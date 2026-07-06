// Autonomous SEO Blog Agent
// - Researches a niche topic, checks existing posts, then creates or updates a draft.
// - Uses Lovable AI Gateway (no user key needed).
// - Optional web research via Firecrawl if FIRECRAWL_API_KEY is set.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const NICHE =
  "Hindi dharmik granth, Vedic scriptures, Sanatan Dharma, Geeta, Ramayana, Rigved, Hanuman Chalisa, mantras, bhajans, spiritual living";
const SITE = "https://gyandootnova.in";
const AUTHOR = "GyandootNova Editorial";

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-pro";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function readingTime(text: string) {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

async function callAI(messages: any[], json = false): Promise<string> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  const res = await fetch(LOVABLE_AI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`AI ${res.status}: ${txt.slice(0, 500)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function firecrawlResearch(topic: string): Promise<string> {
  const key = Deno.env.get("FIRECRAWL_API_KEY");
  if (!key) return "";
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: topic, limit: 5 }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    const items = data?.data || data?.web?.results || [];
    return items
      .slice(0, 5)
      .map((r: any) => `- ${r.title}: ${r.description || r.snippet || ""}`)
      .join("\n");
  } catch {
    return "";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const forcedTopic: string | undefined = body?.topic;

    // 1) Load existing posts (title/slug/excerpt) so agent can dedupe or update.
    const { data: existing } = await supabase
      .from("posts")
      .select("id, slug, title, excerpt, meta_description, created_at")
      .eq("post_type", "article")
      .order("created_at", { ascending: false })
      .limit(200);

    const existingList = (existing || [])
      .map((p) => `- ${p.title} (/${p.slug})`)
      .join("\n");

    // 2) Discover topic (unless forced).
    let topic = forcedTopic;
    if (!topic) {
      const discover = await callAI(
        [
          {
            role: "system",
            content:
              "You are an SEO strategist for a Hindi spiritual publisher. Propose ONE fresh, high-intent blog topic in Hindi/Hinglish that is NOT already covered by the existing list. Return JSON: {\"topic\":\"...\",\"rationale\":\"...\"}",
          },
          {
            role: "user",
            content: `Niche: ${NICHE}\n\nExisting posts:\n${existingList || "(none)"}\n\nRules:\n- Prefer trending, evergreen or seasonal (festival/tithi) topics.\n- Must serve real search intent.\n- Different angle from anything above.`,
          },
        ],
        true,
      );
      topic = JSON.parse(discover).topic;
    }

    // 3) Similarity check → decide update vs create.
    const simRaw = await callAI(
      [
        {
          role: "system",
          content:
            "Return JSON {\"match_slug\": string|null, \"reason\":\"...\"}. Choose match_slug ONLY if an existing post covers essentially the same core topic (not just related).",
        },
        {
          role: "user",
          content: `New topic: ${topic}\n\nExisting posts:\n${existingList || "(none)"}`,
        },
      ],
      true,
    );
    const sim = JSON.parse(simRaw);
    const matchSlug: string | null = sim.match_slug || null;

    // 4) Research pass (optional Firecrawl).
    const research = await firecrawlResearch(topic!);

    // 5) Internal links pool.
    const internalPool = (existing || [])
      .slice(0, 40)
      .map((p) => `/articles/${p.slug} — ${p.title}`)
      .join("\n");

    // 6) Generate full article JSON.
    const genPrompt = `Write a completely original, human-sounding, plagiarism-free blog article in Hindi (Devanagari, with occasional Hinglish where natural) about:

TOPIC: ${topic}

RESEARCH NOTES (public sources — DO NOT COPY, rewrite fully in your own words):
${research || "(no external research available — rely on well-known public knowledge)"}

INTERNAL LINK POOL (use 3–6 contextual links naturally, exact paths):
${internalPool || "(none)"}

REQUIREMENTS:
- 1500–2200 words of body (excluding FAQ/conclusion).
- EEAT: cite tradition/scripture where relevant, be accurate, avoid sensational claims.
- Natural human writing — vary sentence length, no keyword stuffing, no AI clichés.
- Structure: one H1, multiple H2 sections, H3 subsections where useful.
- Include a FAQ section with 5 questions.
- Include a Conclusion.
- Insert internal links as normal <a href="/articles/slug">anchor</a> in HTML body.
- Output valid HTML for the body (h1,h2,h3,p,ul,ol,li,a,strong,em,blockquote).

Return STRICT JSON:
{
  "seo_title": "≤60 chars",
  "meta_title": "≤60 chars",
  "meta_description": "≤160 chars",
  "slug": "kebab-case-english-slug",
  "focus_keyword": "...",
  "secondary_keywords": ["...","..."],
  "h1": "...",
  "excerpt": "≤200 chars plain text",
  "body_html": "<h1>...</h1>...<h2>FAQ</h2>...<h2>Conclusion</h2>...",
  "faq": [{"q":"...","a":"..."}, ... 5 items],
  "featured_image_prompt": "photo/illustration prompt for a cover image",
  "og_title": "...",
  "og_description": "...",
  "twitter_title": "...",
  "twitter_description": "..."
}`;

    const raw = await callAI(
      [
        {
          role: "system",
          content:
            "You are a senior SEO editor & Sanatan Dharma scholar-writer. Follow Google Helpful Content guidelines. Write only original prose. Output ONLY valid JSON, no markdown fences.",
        },
        { role: "user", content: genPrompt },
      ],
      true,
    );
    const article = JSON.parse(raw);

    // 7) Build final HTML with JSON-LD + TOC.
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
      mainEntityOfPage: `${SITE}/articles/${article.slug}`,
    };

    // Extract H2s for TOC.
    const h2Matches = [...String(article.body_html).matchAll(/<h2[^>]*>(.*?)<\/h2>/gi)];
    const toc = h2Matches.length
      ? `<nav class="toc"><strong>विषय सूची</strong><ol>${h2Matches
          .map((m) => `<li>${m[1].replace(/<[^>]+>/g, "")}</li>`)
          .join("")}</ol></nav>`
      : "";

    const readMin = readingTime(String(article.body_html).replace(/<[^>]+>/g, " "));
    const meta = `<p class="post-meta"><em>${AUTHOR} • ${new Date().toLocaleDateString(
      "hi-IN",
    )} • ${readMin} min read</em></p>`;

    const finalHtml = `${meta}${toc}${article.body_html}
<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>
<script type="application/ld+json">${JSON.stringify(articleSchema)}</script>`;

    // 8) Insert or update.
    let slug = slugify(article.slug || article.seo_title);
    let action: "created" | "updated" = "created";
    let postId: string | null = null;

    if (matchSlug) {
      const { data: existingPost } = await supabase
        .from("posts")
        .select("id, slug")
        .eq("slug", matchSlug)
        .maybeSingle();
      if (existingPost) {
        slug = existingPost.slug; // preserve URL
        const { error } = await supabase
          .from("posts")
          .update({
            title: article.h1 || article.seo_title,
            content: finalHtml,
            excerpt: article.excerpt,
            meta_title: article.meta_title,
            meta_description: article.meta_description,
          })
          .eq("id", existingPost.id);
        if (error) throw error;
        postId = existingPost.id;
        action = "updated";
      }
    }

    if (action === "created") {
      // Ensure slug uniqueness.
      let candidate = slug;
      for (let i = 2; i < 20; i++) {
        const { data: clash } = await supabase
          .from("posts")
          .select("id")
          .eq("slug", candidate)
          .maybeSingle();
        if (!clash) break;
        candidate = `${slug}-${i}`;
      }
      slug = candidate;
      const { data: inserted, error } = await supabase
        .from("posts")
        .insert({
          title: article.h1 || article.seo_title,
          slug,
          content: finalHtml,
          excerpt: article.excerpt,
          meta_title: article.meta_title,
          meta_description: article.meta_description,
          post_type: "article",
          is_published: false,
        })
        .select("id")
        .single();
      if (error) throw error;
      postId = inserted.id;
    }

    return new Response(
      JSON.stringify({
        success: true,
        action,
        post_id: postId,
        slug,
        topic,
        focus_keyword: article.focus_keyword,
        secondary_keywords: article.secondary_keywords,
        featured_image_prompt: article.featured_image_prompt,
        reading_time_min: readMin,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("seo-blog-agent error", e);
    return new Response(
      JSON.stringify({ success: false, error: e.message || String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
