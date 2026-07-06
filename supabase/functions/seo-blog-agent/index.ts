// Autonomous SEO Publishing Agent v2
// - Scans posts, computes similarity, updates (>0.7) or creates new draft.
// - Live web research via Firecrawl when FIRECRAWL_API_KEY is present.
// - Generates 1800+ word SEO article, JSON-LD FAQ, OG, TOC, internal links, alt text.
// - Preserves manually edited posts by writing a revision snapshot before updating.
// - Logs every run to public.seo_agent_logs.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const NICHE = "Books, Spirituality, Meditation, Self Growth, Mindfulness, Consciousness";
const SITE = "https://gyandootnova.in";
const AUTHOR = "GyandootNova Editorial";
const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-pro";
const SIMILARITY_THRESHOLD = 0.7;

// ─── helpers ─────────────────────────────────────────────────────────

function slugify(s: string) {
  return s.toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

const STOP = new Set(
  "the a an and or but if of to in on for with from by as is are was were be been being this that these those it its at we our you your they them he she his her hai hain ka ke ki ko me mein se par or aur ya bhi wo woh yeh ye kya kyun kaise".split(/\s+/)
);

function tokenize(s: string): Set<string> {
  return new Set(
    (s || "").toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w)),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

function readingTime(text: string) {
  const w = text.split(/\s+/).filter(Boolean).length;
  return { words: w, minutes: Math.max(1, Math.round(w / 200)) };
}

async function callAI(messages: any[], json = false): Promise<string> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  const res = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      messages,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`AI ${res.status}: ${(await res.text()).slice(0, 400)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

type Source = { url: string; title: string; snippet: string };

async function firecrawlSearch(query: string): Promise<Source[]> {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) return [];
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, limit: 6 }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const items = data?.data || data?.web?.results || [];
    return items.slice(0, 6).map((r: any) => ({
      url: r.url || r.link,
      title: r.title || "",
      snippet: r.description || r.snippet || "",
    })).filter((s: Source) => s.url);
  } catch {
    return [];
  }
}

// ─── main ────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const log: any = {
    status: "ok",
    sources: [],
    internal_links: [],
    external_links: [],
    action: "created",
  };

  try {
    const body = await req.json().catch(() => ({}));
    const forcedTopic: string | undefined = body?.topic;

    // 1) Scan Posts table
    const { data: existing } = await supabase
      .from("posts")
      .select("id, slug, title, excerpt, meta_description, content, manually_edited, updated_at")
      .eq("post_type", "article")
      .order("created_at", { ascending: false })
      .limit(500);

    const existingList = (existing || [])
      .map((p) => `- ${p.title} (/${p.slug})`).join("\n");

    // 2) Topic discovery
    let topic = forcedTopic;
    if (!topic) {
      const raw = await callAI([
        {
          role: "system",
          content: `You are an SEO strategist for a publisher in the niche: ${NICHE}. Propose ONE high-search-intent English blog topic NOT already covered. Return JSON: {"topic":"...","rationale":"..."}`,
        },
        {
          role: "user",
          content: `Existing posts:\n${existingList || "(none)"}\n\nRules:\n- Evergreen or trending in books/spirituality/meditation/self-growth/mindfulness/consciousness.\n- Different angle from anything above.\n- Should serve real reader search intent.`,
        },
      ], true);
      topic = JSON.parse(raw).topic;
    }
    log.topic = topic;

    // 3) Similarity check (Jaccard on title+excerpt tokens vs topic tokens)
    const topicTokens = tokenize(topic!);
    let bestMatch: { post: any; score: number } | null = null;
    for (const p of existing || []) {
      const sc = jaccard(topicTokens, tokenize(`${p.title} ${p.excerpt || ""}`));
      if (!bestMatch || sc > bestMatch.score) bestMatch = { post: p, score: sc };
    }
    log.similarity_score = bestMatch?.score ?? 0;
    log.matched_slug = bestMatch && bestMatch.score >= SIMILARITY_THRESHOLD ? bestMatch.post.slug : null;

    const willUpdate = !!log.matched_slug;
    log.action = willUpdate ? "updated" : "created";

    // 4) Live web research
    const sources = await firecrawlSearch(topic!);
    log.sources = sources.map((s) => ({ url: s.url, title: s.title }));

    const researchBlock = sources.length
      ? sources.map((s, i) => `[${i + 1}] ${s.title}\n${s.url}\n${s.snippet}`).join("\n\n")
      : "(no live search results — rely on general public knowledge; do NOT fabricate citations)";

    // 5) Internal link pool
    const internalPool = (existing || []).slice(0, 60)
      .map((p) => `/articles/${p.slug} — ${p.title}`).join("\n");

    // 6) Generate article
    const genPrompt = `Write a fully original, human-sounding, plagiarism-free English blog article for a ${NICHE} publisher.

TOPIC: ${topic}

RESEARCH NOTES (public sources — REWRITE in your own words, DO NOT COPY sentences):
${researchBlock}

INTERNAL LINK POOL (use 3–6 contextual links as <a href="/articles/slug">natural anchor</a>):
${internalPool || "(none)"}

REQUIREMENTS
- 1800–2400 words in the body (excluding TOC/FAQ/conclusion).
- Follow Google Helpful Content: first-hand insight tone, no fluff, no keyword stuffing.
- EEAT: accurate, respectful of tradition, cite scripture/book/author names inline where relevant.
- One H1, several H2s, H3 subsections; short paragraphs; natural sentence variety.
- Include Table of Contents (linked H2s), FAQ (6 Qs), and Conclusion.
- Add 2–4 external links ONLY to authoritative sources from research (Wikipedia, gov, .edu, official book/author sites, Britannica). Skip if none qualify.
- Output valid HTML body (h1,h2,h3,p,ul,ol,li,a,strong,em,blockquote).

Return STRICT JSON (no markdown fences):
{
  "seo_title": "≤60 chars",
  "meta_title": "≤60 chars",
  "meta_description": "≤160 chars",
  "slug": "kebab-case-english",
  "focus_keyword": "...",
  "related_keywords": ["...", "..."],
  "h1": "...",
  "excerpt": "≤200 chars plain text",
  "body_html": "<h1>...</h1>...",
  "faq": [{"q":"...","a":"..."}, ... 6 items],
  "featured_image_prompt": "descriptive image prompt",
  "featured_image_alt": "≤120 chars alt text with focus keyword",
  "og_title": "...",
  "og_description": "...",
  "twitter_title": "...",
  "twitter_description": "...",
  "external_links": [{"url":"...","anchor":"..."}]
}`;

    const raw = await callAI([
      {
        role: "system",
        content: "You are a senior SEO editor and domain writer. Follow Google Helpful Content. Output ONLY valid JSON, no code fences.",
      },
      { role: "user", content: genPrompt },
    ], true);
    const article = JSON.parse(raw);

    // 7) Assemble final HTML with TOC + JSON-LD
    const h2s = [...String(article.body_html).matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)]
      .map((m) => m[1].replace(/<[^>]+>/g, ""));
    const toc = h2s.length
      ? `<nav class="toc"><strong>Table of Contents</strong><ol>${
          h2s.map((t) => `<li>${t}</li>`).join("")
        }</ol></nav>`
      : "";

    const rt = readingTime(String(article.body_html).replace(/<[^>]+>/g, " "));
    log.word_count = rt.words;
    log.reading_time_min = rt.minutes;

    const slugFinal = slugify(article.slug || article.seo_title);
    const canonical = `${SITE}/articles/${log.matched_slug || slugFinal}`;

    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: (article.faq || []).map((f: any) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    };
    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.h1 || article.seo_title,
      author: { "@type": "Organization", name: AUTHOR },
      datePublished: new Date().toISOString(),
      description: article.meta_description,
      mainEntityOfPage: canonical,
      keywords: [article.focus_keyword, ...(article.related_keywords || [])].join(", "),
    };

    const meta = `<p class="post-meta"><em>${AUTHOR} • ${
      new Date().toLocaleDateString("en-IN")
    } • ${rt.minutes} min read • Focus: ${article.focus_keyword}</em></p>`;

    const ogBlock = `
<!-- Open Graph -->
<meta property="og:title" content="${(article.og_title || article.seo_title).replace(/"/g, "&quot;")}" />
<meta property="og:description" content="${(article.og_description || article.meta_description).replace(/"/g, "&quot;")}" />
<meta property="og:type" content="article" />
<meta property="og:url" content="${canonical}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${(article.twitter_title || article.seo_title).replace(/"/g, "&quot;")}" />
<meta name="twitter:description" content="${(article.twitter_description || article.meta_description).replace(/"/g, "&quot;")}" />
<link rel="canonical" href="${canonical}" />`;

    const finalHtml =
      `<!-- SEO_AGENT_META focus_keyword="${article.focus_keyword}" related="${(article.related_keywords || []).join("|")}" alt="${(article.featured_image_alt || "").replace(/"/g, "'")}" -->\n` +
      meta + toc + article.body_html +
      `\n<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>` +
      `\n<script type="application/ld+json">${JSON.stringify(articleSchema)}</script>` +
      `\n${ogBlock}`;

    // Collect emitted links for the log
    const linkRe = /<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
    for (const m of article.body_html.matchAll(linkRe)) {
      const href = m[1];
      const anchor = m[2];
      if (href.startsWith("/")) log.internal_links.push({ url: href, anchor });
      else if (href.startsWith("http")) log.external_links.push({ url: href, anchor });
    }
    for (const el of article.external_links || []) log.external_links.push(el);

    // 8) Save (create or update with revision snapshot)
    let postId: string | null = null;
    let finalSlug = slugFinal;

    if (willUpdate && bestMatch) {
      const post = bestMatch.post;
      finalSlug = post.slug; // preserve URL

      // Snapshot BEFORE overwrite (always, but especially if manually edited)
      await supabase.from("post_revisions").insert({
        post_id: post.id,
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        meta_title: null,
        meta_description: post.meta_description,
        reason: post.manually_edited
          ? "seo-agent: pre-update snapshot (manually edited)"
          : "seo-agent: pre-update snapshot",
      });

      const { error } = await supabase.from("posts").update({
        title: article.h1 || article.seo_title,
        content: finalHtml,
        excerpt: article.excerpt,
        meta_title: article.meta_title,
        meta_description: article.meta_description,
        manually_edited: false,
      }).eq("id", post.id);
      if (error) throw error;
      postId = post.id;
    } else {
      // Ensure slug uniqueness
      let candidate = finalSlug;
      for (let i = 2; i < 30; i++) {
        const { data: clash } = await supabase.from("posts")
          .select("id").eq("slug", candidate).maybeSingle();
        if (!clash) break;
        candidate = `${finalSlug}-${i}`;
      }
      finalSlug = candidate;
      const { data: ins, error } = await supabase.from("posts").insert({
        title: article.h1 || article.seo_title,
        slug: finalSlug,
        content: finalHtml,
        excerpt: article.excerpt,
        meta_title: article.meta_title,
        meta_description: article.meta_description,
        post_type: "article",
        is_published: false,
      }).select("id").single();
      if (error) throw error;
      postId = ins.id;
    }

    log.post_id = postId;
    log.slug = finalSlug;
    log.focus_keyword = article.focus_keyword;
    log.meta = {
      featured_image_prompt: article.featured_image_prompt,
      featured_image_alt: article.featured_image_alt,
      related_keywords: article.related_keywords,
      canonical,
    };

    await supabase.from("seo_agent_logs").insert(log);

    return new Response(JSON.stringify({ success: true, ...log }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("seo-blog-agent error", e);
    log.status = "error";
    log.error = String(e?.message || e).slice(0, 1000);
    try {
      await supabase.from("seo_agent_logs").insert(log);
    } catch {}
    return new Response(JSON.stringify({ success: false, error: log.error }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
