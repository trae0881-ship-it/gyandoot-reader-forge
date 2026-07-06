// Autonomous SEO Publishing Agent v3
// - Multi-provider LLM fallback: Anthropic → OpenAI → Gemini → DeepSeek
// - Multi-provider search fallback: Tavily → Exa → Firecrawl → SerpAPI
// - Similarity check, revisions, JSON-LD, TOC, internal/external links, logs.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const NICHE = "Books, Spirituality, Meditation, Self Growth, Mindfulness, Consciousness";
const SITE = "https://gyandootnova.in";
const AUTHOR = "GyandootNova Editorial";
const SIMILARITY_THRESHOLD = 0.7;

// ─── helpers ─────────────────────────────────────────────────────────
function slugify(s: string) {
  return s.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").trim()
    .replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
}
const STOP = new Set("the a an and or but if of to in on for with from by as is are was were be been being this that these those it its at we our you your they them he she his her hai hain ka ke ki ko me mein se par or aur ya bhi wo woh yeh ye kya kyun kaise".split(/\s+/));
function tokenize(s: string): Set<string> {
  return new Set((s || "").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(w => w.length > 2 && !STOP.has(w)));
}
function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0; for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}
function readingTime(text: string) {
  const w = text.split(/\s+/).filter(Boolean).length;
  return { words: w, minutes: Math.max(1, Math.round(w / 200)) };
}
function stripFences(s: string) {
  return s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

// ─── LLM providers ───────────────────────────────────────────────────
type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

async function llmAnthropic(messages: ChatMsg[], json: boolean): Promise<string> {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) throw new Error("no-key");
  const sys = messages.filter(m => m.role === "system").map(m => m.content).join("\n\n");
  const rest = messages.filter(m => m.role !== "system");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: sys + (json ? "\n\nReturn ONLY valid JSON. No markdown fences." : ""),
      messages: rest.map(m => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) throw new Error(`anthropic ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

async function llmOpenAI(messages: ChatMsg[], json: boolean): Promise<string> {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new Error("no-key");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "gpt-4o",
      messages,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`openai ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function llmGemini(messages: ChatMsg[], json: boolean): Promise<string> {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("no-key");
  const sys = messages.filter(m => m.role === "system").map(m => m.content).join("\n\n");
  const user = messages.filter(m => m.role !== "system").map(m => m.content).join("\n\n");
  const model = "gemini-2.5-flash";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: sys + (json ? "\n\nReturn ONLY valid JSON. No markdown fences." : "") }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: json ? { responseMimeType: "application/json" } : {},
    }),
  });
  if (!res.ok) throw new Error(`gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function llmDeepSeek(messages: ChatMsg[], json: boolean): Promise<string> {
  const key = Deno.env.get("DEEPSEEK_API_KEY");
  if (!key) throw new Error("no-key");
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`deepseek ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

const LLM_CHAIN: [string, (m: ChatMsg[], j: boolean) => Promise<string>][] = [
  ["anthropic", llmAnthropic],
  ["openai", llmOpenAI],
  ["gemini", llmGemini],
  ["deepseek", llmDeepSeek],
];

async function callLLM(messages: ChatMsg[], json: boolean, log: any): Promise<string> {
  log.llm_attempts = log.llm_attempts || [];
  const errors: string[] = [];
  for (const [name, fn] of LLM_CHAIN) {
    try {
      const out = await fn(messages, json);
      if (!out) throw new Error("empty response");
      log.llm_attempts.push({ provider: name, ok: true });
      log.llm_used = name;
      return json ? stripFences(out) : out;
    } catch (e: any) {
      const msg = String(e?.message || e);
      log.llm_attempts.push({ provider: name, ok: false, error: msg.slice(0, 200) });
      errors.push(`${name}: ${msg}`);
    }
  }
  throw new Error(`All LLM providers failed: ${errors.join(" | ")}`);
}

// ─── Search providers ────────────────────────────────────────────────
type Source = { url: string; title: string; snippet: string };

async function searchTavily(query: string): Promise<Source[]> {
  const key = Deno.env.get("TAVILY_API_KEY");
  if (!key) throw new Error("no-key");
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: key, query, max_results: 6, search_depth: "advanced" }),
  });
  if (!res.ok) throw new Error(`tavily ${res.status}`);
  const data = await res.json();
  return (data.results || []).map((r: any) => ({ url: r.url, title: r.title || "", snippet: r.content || "" })).filter((s: Source) => s.url);
}

async function searchExa(query: string): Promise<Source[]> {
  const key = Deno.env.get("EXA_API_KEY");
  if (!key) throw new Error("no-key");
  const res = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key },
    body: JSON.stringify({ query, numResults: 6, contents: { text: { maxCharacters: 800 } } }),
  });
  if (!res.ok) throw new Error(`exa ${res.status}`);
  const data = await res.json();
  return (data.results || []).map((r: any) => ({ url: r.url, title: r.title || "", snippet: r.text || r.snippet || "" })).filter((s: Source) => s.url);
}

async function searchFirecrawl(query: string): Promise<Source[]> {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) throw new Error("no-key");
  const res = await fetch("https://api.firecrawl.dev/v2/search", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit: 6 }),
  });
  if (!res.ok) throw new Error(`firecrawl ${res.status}`);
  const data = await res.json();
  const items = data?.data || data?.web?.results || [];
  return items.map((r: any) => ({ url: r.url || r.link, title: r.title || "", snippet: r.description || r.snippet || "" })).filter((s: Source) => s.url);
}

async function searchSerpAPI(query: string): Promise<Source[]> {
  const key = Deno.env.get("SERPAPI_API_KEY");
  if (!key) throw new Error("no-key");
  const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&num=6&api_key=${key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`serpapi ${res.status}`);
  const data = await res.json();
  return (data.organic_results || []).map((r: any) => ({ url: r.link, title: r.title || "", snippet: r.snippet || "" })).filter((s: Source) => s.url);
}

const SEARCH_CHAIN: [string, (q: string) => Promise<Source[]>][] = [
  ["tavily", searchTavily],
  ["exa", searchExa],
  ["firecrawl", searchFirecrawl],
  ["serpapi", searchSerpAPI],
];

async function runSearch(query: string, log: any): Promise<Source[]> {
  log.search_attempts = log.search_attempts || [];
  const combined: Source[] = [];
  const seen = new Set<string>();
  let anyOk = false;

  for (const [name, fn] of SEARCH_CHAIN) {
    try {
      const results = await fn(query);
      log.search_attempts.push({ provider: name, ok: true, count: results.length });
      if (!log.search_provider_used) log.search_provider_used = name;
      anyOk = true;
      for (const r of results) {
        if (!seen.has(r.url)) { seen.add(r.url); combined.push(r); }
      }
      if (combined.length >= 6) break; // enough
    } catch (e: any) {
      log.search_attempts.push({ provider: name, ok: false, error: String(e?.message || e).slice(0, 150) });
    }
  }
  if (!anyOk) throw new Error("All search providers failed or missing keys");
  return combined.slice(0, 8);
}

// ─── main ────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const log: any = { status: "ok", sources: [], internal_links: [], external_links: [], action: "created" };

  try {
    const body = await req.json().catch(() => ({}));
    const forcedTopic: string | undefined = body?.topic;

    // 1) Scan Posts table
    const { data: existing } = await supabase.from("posts")
      .select("id, slug, title, excerpt, meta_description, content, manually_edited, updated_at")
      .eq("post_type", "article").order("created_at", { ascending: false }).limit(500);

    const existingList = (existing || []).map(p => `- ${p.title} (/${p.slug})`).join("\n");

    // 2) Topic discovery
    let topic = forcedTopic;
    if (!topic) {
      const raw = await callLLM([
        { role: "system", content: `You are an SEO strategist for a publisher in the niche: ${NICHE}. Propose ONE high-search-intent English blog topic NOT already covered. Return JSON: {"topic":"...","rationale":"..."}` },
        { role: "user", content: `Existing posts:\n${existingList || "(none)"}\n\nRules:\n- Evergreen or trending in books/spirituality/meditation/self-growth/mindfulness/consciousness.\n- Different angle from anything above.\n- Should serve real reader search intent.` },
      ], true, log);
      topic = JSON.parse(raw).topic;
    }
    log.topic = topic;

    // 3) Similarity check
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

    // 4) Multi-provider live web research
    let sources: Source[] = [];
    try {
      sources = await runSearch(topic!, log);
    } catch (e: any) {
      log.status = "error";
      log.error = `No search providers available: ${e?.message || e}`;
      await supabase.from("seo_agent_logs").insert(log);
      return new Response(JSON.stringify({ success: false, error: log.error, log }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    log.sources = sources.map(s => ({ url: s.url, title: s.title }));

    const researchBlock = sources.map((s, i) => `[${i + 1}] ${s.title}\n${s.url}\n${s.snippet}`).join("\n\n");

    // 5) Internal link pool
    const internalPool = (existing || []).slice(0, 60).map(p => `/articles/${p.slug} — ${p.title}`).join("\n");

    // 6) Generate article
    const genPrompt = `Write a fully original, human-sounding, plagiarism-free English blog article for a ${NICHE} publisher.

TOPIC: ${topic}

RESEARCH NOTES (multiple public sources — REWRITE in your own words, DO NOT COPY sentences):
${researchBlock}

INTERNAL LINK POOL (use 3–6 contextual links as <a href="/articles/slug">natural anchor</a>):
${internalPool || "(none)"}

REQUIREMENTS
- 1800–2500 words in the body (excluding TOC/FAQ/conclusion).
- Google Helpful Content compliant, EEAT, natural human tone, no AI clichés.
- Prefer authoritative sources: government, .edu, scientific, books, reputable news.
- One H1, several H2s, H3 subsections; short paragraphs; sentence variety.
- Include TOC (linked H2s), FAQ (6 Qs), Conclusion.
- Add 2–4 external links only to authoritative sources from research.
- Output valid HTML body (h1,h2,h3,p,ul,ol,li,a,strong,em,blockquote).

Return STRICT JSON (no markdown fences):
{
  "seo_title": "≤60 chars", "meta_title": "≤60 chars", "meta_description": "≤160 chars",
  "slug": "kebab-case-english", "focus_keyword": "...", "related_keywords": ["...","..."],
  "tags": ["..."], "category": "...",
  "h1": "...", "excerpt": "≤200 chars", "body_html": "<h1>...</h1>...",
  "faq": [{"q":"...","a":"..."}, ...6],
  "featured_image_prompt": "...", "featured_image_alt": "≤120 chars with focus keyword",
  "og_title": "...", "og_description": "...", "twitter_title": "...", "twitter_description": "...",
  "external_links": [{"url":"...","anchor":"..."}]
}`;

    const raw = await callLLM([
      { role: "system", content: "You are a senior SEO editor and domain writer. Follow Google Helpful Content. Output ONLY valid JSON, no code fences." },
      { role: "user", content: genPrompt },
    ], true, log);
    const article = JSON.parse(raw);

    // 7) Assemble
    const h2s = [...String(article.body_html).matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)].map(m => m[1].replace(/<[^>]+>/g, ""));
    const toc = h2s.length ? `<nav class="toc"><strong>Table of Contents</strong><ol>${h2s.map(t => `<li>${t}</li>`).join("")}</ol></nav>` : "";
    const rt = readingTime(String(article.body_html).replace(/<[^>]+>/g, " "));
    log.word_count = rt.words;
    log.reading_time_min = rt.minutes;
    log.content_score = Math.min(100, Math.round((rt.words / 2000) * 60) + Math.min(20, h2s.length * 3) + (article.faq?.length ? 15 : 0) + (sources.length ? 5 : 0));

    const slugFinal = slugify(article.slug || article.seo_title);
    const canonical = `${SITE}/articles/${log.matched_slug || slugFinal}`;

    const faqSchema = {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: (article.faq || []).map((f: any) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    };
    const articleSchema = {
      "@context": "https://schema.org", "@type": "Article",
      headline: article.h1 || article.seo_title,
      author: { "@type": "Organization", name: AUTHOR },
      datePublished: new Date().toISOString(),
      description: article.meta_description, mainEntityOfPage: canonical,
      keywords: [article.focus_keyword, ...(article.related_keywords || [])].join(", "),
    };
    const meta = `<p class="post-meta"><em>${AUTHOR} • ${new Date().toLocaleDateString("en-IN")} • ${rt.minutes} min read • Focus: ${article.focus_keyword}</em></p>`;
    const ogBlock = `
<meta property="og:title" content="${(article.og_title || article.seo_title).replace(/"/g, "&quot;")}" />
<meta property="og:description" content="${(article.og_description || article.meta_description).replace(/"/g, "&quot;")}" />
<meta property="og:type" content="article" />
<meta property="og:url" content="${canonical}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${(article.twitter_title || article.seo_title).replace(/"/g, "&quot;")}" />
<meta name="twitter:description" content="${(article.twitter_description || article.meta_description).replace(/"/g, "&quot;")}" />
<link rel="canonical" href="${canonical}" />`;

    const finalHtml =
      `<!-- SEO_AGENT_META focus_keyword="${article.focus_keyword}" related="${(article.related_keywords || []).join("|")}" tags="${(article.tags || []).join("|")}" category="${article.category || ""}" alt="${(article.featured_image_alt || "").replace(/"/g, "'")}" -->\n` +
      meta + toc + article.body_html +
      `\n<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>` +
      `\n<script type="application/ld+json">${JSON.stringify(articleSchema)}</script>` +
      `\n${ogBlock}`;

    const linkRe = /<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
    for (const m of article.body_html.matchAll(linkRe)) {
      if (m[1].startsWith("/")) log.internal_links.push({ url: m[1], anchor: m[2] });
      else if (m[1].startsWith("http")) log.external_links.push({ url: m[1], anchor: m[2] });
    }
    for (const el of article.external_links || []) log.external_links.push(el);

    // 8) Save (always Draft)
    let postId: string | null = null;
    let finalSlug = slugFinal;

    if (willUpdate && bestMatch) {
      const post = bestMatch.post;
      finalSlug = post.slug;
      await supabase.from("post_revisions").insert({
        post_id: post.id, title: post.title, content: post.content, excerpt: post.excerpt,
        meta_title: null, meta_description: post.meta_description,
        reason: post.manually_edited ? "seo-agent: pre-update snapshot (manually edited)" : "seo-agent: pre-update snapshot",
      });
      const { error } = await supabase.from("posts").update({
        title: article.h1 || article.seo_title, content: finalHtml, excerpt: article.excerpt,
        meta_title: article.meta_title, meta_description: article.meta_description,
        manually_edited: false, is_published: false,
      }).eq("id", post.id);
      if (error) throw error;
      postId = post.id;
    } else {
      let candidate = finalSlug;
      for (let i = 2; i < 30; i++) {
        const { data: clash } = await supabase.from("posts").select("id").eq("slug", candidate).maybeSingle();
        if (!clash) break;
        candidate = `${finalSlug}-${i}`;
      }
      finalSlug = candidate;
      const { data: ins, error } = await supabase.from("posts").insert({
        title: article.h1 || article.seo_title, slug: finalSlug, content: finalHtml,
        excerpt: article.excerpt, meta_title: article.meta_title, meta_description: article.meta_description,
        post_type: "article", is_published: false,
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
      tags: article.tags, category: article.category, canonical,
    };

    await supabase.from("seo_agent_logs").insert(log);
    return new Response(JSON.stringify({ success: true, ...log }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("seo-blog-agent error", e);
    log.status = "error";
    log.error = String(e?.message || e).slice(0, 1000);
    try { await supabase.from("seo_agent_logs").insert(log); } catch {}
    return new Response(JSON.stringify({ success: false, error: log.error, log }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
