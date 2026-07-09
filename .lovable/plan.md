
# SEO Content Build — Vedas/Upanishads/Gita + Meditation + International Ranking

Goal: capture the demand Semrush revealed (Bhagavad Gita 301K, Vedas 33K, Upanishads 27K, "how to meditate properly" 60K, etc.) and expand reach beyond India into US / AU / CA / Europe.

## What we'll build

**A. Text Hub Pages** (new routes, one per ancient text)
- `/texts/rigved`, `/texts/vedas`, `/texts/upanishads`, `/texts/bhagavad-gita`
- Each hub answers who/how many/what/when/oldest in structured sections
- Each includes an FAQ accordion at the bottom (schema-backed)

**B. Structured Data (JSON-LD)**
- `Article` + `Book` schema on every hub and post page
- `FAQPage` schema wherever an FAQ accordion appears
- `BreadcrumbList` on hubs and Hindi meaning pages

**C. Hindi "Meaning" & "How to Read" Pages** (new routes)
- `/hindi/upanishad-meaning-in-hindi` (2,900/mo, low comp)
- `/hindi/vedas-meaning-in-hindi`
- `/how-to-read/bhagavad-gita` (1,300/mo)
- `/how-to-read/vedas`

**D. Meditation Posts** (as regular blog posts in existing posts system)
- "Meditation for Anxiety — Hindi + English guide" (1,300/mo)
- "Meditation for Stress — techniques that actually work" (2,400/mo)
- Each: optimized meta, reading time, "Related articles" module

**E. Comparison Hub** (new route)
- `/meditation/techniques-compared` — Vipassana / Zen / TM / Kriya / Who-Am-I
- Comparison table + internal links to individual technique posts

**F. Hindi Pillar Page** (new route, cornerstone content)
- `/hindi/dhyan-kaise-karein` — "ध्यान कैसे करें — शुरुआती लोगों के लिए संपूर्ण मार्गदर्शिका"
- Targets *how to meditate properly* (60,500/mo, low comp)
- Sections: तकनीक (technique), चरण-दर-चरण (steps), सामान्य गलतियाँ (common mistakes), लाभ (benefits), FAQ

**G. Q&A Pages** (new route family)
- `/qa/who-wrote-bhagavad-gita` (22,200/mo)
- `/qa/who-wrote-vedas` (8,100/mo)
- `/qa/how-many-vedas-are-there` (6,600/mo)
- `/qa/what-is-vipassana` etc.
- Each: single-question H1, direct answer in first 40 words, FAQ schema

**H. International Ranking Layer** (US / AU / CA / EU)
- Add `hreflang` tags on all English pages (`en-US`, `en-GB`, `en-AU`, `en-CA`, `en-IN`, `hi-IN`) pointing to same URLs — signals Google to serve these pages in those markets
- English metadata polished on all text hubs
- Add `geo.region` meta tags on English versions
- Submit expanded sitemap to Bing Webmaster Tools (already done) + Google Search Console for the new URLs
- Note: single set of English URLs targeting all English markets — no separate `/us/` or `/uk/` paths needed for this content type

## Routing & sitemap

- New routes added to `App.tsx` router
- All new URLs appended to `scripts/generate-sitemap.mjs`
- Each hub/post added to `public/llms.txt` for AI-search visibility
- Prerender config updated so crawlers see full HTML

## Technical section

- **JSON-LD helper:** new `src/lib/jsonLd.ts` with typed builders (`buildArticleSchema`, `buildBookSchema`, `buildFAQSchema`, `buildBreadcrumbSchema`)
- **FAQ component:** new `src/components/FaqAccordion.tsx` — takes `{ question, answer }[]`, renders shadcn accordion + injects matching `FAQPage` JSON-LD via `react-helmet-async`
- **Hub template:** new `src/components/TextHub.tsx` — reusable layout for A. Props: `{ text, hindiName, sanskritName, description, sections, faqs, downloadUrl? }`
- **Q&A template:** new `src/components/QAPage.tsx` — H1 = question, TL;DR answer box, long-form explanation, related Q&As
- **hreflang:** new `src/components/HreflangTags.tsx` — reusable Helmet block emitting `<link rel="alternate" hreflang="...">` for all 6 locales + `x-default`
- **Reading time:** existing posts already track it or compute via word count / 200 wpm
- **Related articles module:** query `posts` table filtered by shared tag/category, limit 3

**Content authoring:** English + Hindi copy for A/C/D/E/F/G will be written by me inline (long-form, sourced/factually correct — Vedas authorship attributed to rishis/Vyasa tradition, chapter counts verified, etc.). No AI hallucination on facts.

**Deferred to a follow-up if scope is too big for one pass:** Q&A pages (G) can ship in a second batch after A–F land, since G is 5+ pages of copy.

## Estimated file impact

- ~15 new route/page files
- ~4 new shared components + 1 lib
- Edits to `App.tsx`, `scripts/generate-sitemap.mjs`, `public/llms.txt`, `index.html` (sitewide hreflang fallback)
- No DB migration needed — hubs are static content, posts use existing table

## What I need from you before starting

1. **Confirm scope:** Should I ship all A–H in one pass (larger, longer), or A–F first and defer G (Q&A pages) + H (hreflang) to a second turn?
2. **Language mix per hub:** Bilingual (Hindi + English side-by-side) or separate English hub + Hindi companion page linked from it?
3. **Downloads:** Do you want the free Bhagavad Gita / Vedas PDFs offered on the hubs? (You mentioned the 40K/mo *bhagwat geeta in hindi pdf* opportunity earlier.) If yes, do you have the PDFs to upload, or should the hubs just link to your existing free chapters in the reader?
