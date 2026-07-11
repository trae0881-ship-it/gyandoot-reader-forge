# Plan: Full English Conversion + SEO + Conversion Boost

Goal: Content 8.5→10, SEO 8→10, Conversion 7→10. Keep Hindi SEO pages (`/hindi/*`, Hindi book titles) intact — they rank for Hindi queries. Add English versions alongside where high-value.

Scope is large — will ship in **3 phases**, each independently deployable.

---

## Phase 1 — English + Conversion (Highest ROI)

**Public pages → English copy (UI chrome, headings, CTAs, body):**
- `Index.tsx`, `Books.tsx`, `BookDetail.tsx`, `Articles.tsx`, `ArticleDetail.tsx`
- `About.tsx`, `OurStory.tsx`, `Contact.tsx`, `FAQ.tsx`, `Support.tsx`, `Donate.tsx`
- `Careers.tsx`, `Portfolio.tsx`, `Services.tsx`, `TestimonialsPage.tsx`
- `Auth.tsx`, `Profile.tsx`, `Library.tsx`, `NotFound.tsx`
- Layout: `Header.tsx`, `Footer.tsx`, all nav items, badges, tooltips
- Components: `BrandExperience`, `CompareSection`, `GuaranteeSection`, `UrgencyBanner`, `NewsletterCta`, `LiveReaderStrip`, `RecentPurchasesToast`, `ExitIntentOffer`, `EmailLeadCapture`, `ContinueReadingSection`, `AskScripture`, `FloatingWhatsApp`, `FaqStrip`, `BundleDecoy`

**Legal pages** stay English (already are): Privacy, Terms, Refund, Shipping.

**Conversion upgrades (all 4 selected):**
1. **Hero (Index)** — English H1 with keyword + benefit, rating stars (4.8★ from N readers), live reader count chip, primary CTA "Start Reading Free" + secondary "Browse Library", trust row (100% Money-Back • Free Preview • Instant Access).
2. **BookDetail** — Sticky Buy card with: urgency countdown (real 24h), guarantee badge, "X readers bought this week", 3-star review snippets, "What's inside" bullets, related books cross-sell, bundle upsell ("Get all 3 Upanishad volumes @ save 25%").
3. **Exit intent** — Enhanced `ExitIntentOffer`: English copy, 15% coupon + free first chapter PDF, email capture into existing lead table.
4. **Bundles** — Enhance `BundleDecoy` with real 2/3/5-book bundles, strikethrough pricing, savings badge, single-click add to cart flow.

**Preserve:**
- Hindi book titles/authors from DB (they are the actual product names)
- `/hindi/*`, `/qa/*`, `/texts/*`, `/meditation/*`, `/how-to-read/*` SEO pages (already English/Hindi mix) — Phase 2 will polish these
- All emojis rule (Lucide only), semantic tokens, brand fonts

---

## Phase 2 — SEO Enhancement

**Meta + schema per page** (via existing `useSEO` hook + Helmet):
- Every public route gets: unique `<title>` (<60ch, keyword-first), `<meta description>` (<160ch, benefit + CTA verb), self-referencing canonical, og:title/og:description/og:url, twitter:card.
- **JSON-LD upgrades** in `src/lib/jsonLd.ts`:
  - `Book` schema on BookDetail (author, isbn, offers, aggregateRating, review)
  - `BreadcrumbList` on all inner pages
  - `FAQPage` on every page with FAQs (already partial)
  - `Article` on ArticleDetail with author, datePublished, image
  - `Organization` + `WebSite` with `SearchAction` sitewide
  - `Product` + `Offer` for bundles
- **Internal linking**: add contextual links between `/books/[slug]` ↔ `/texts/*` ↔ `/qa/*` ↔ `/hindi/*` (3–5 related links per page).
- **Sitemap**: verify `scripts/generate-sitemap.mjs` includes all new English SEO pages; priority weights tuned.
- **Robots.txt**: confirm no accidental disallow.
- **Image alt text audit**: sweep BookDetail + Article images for descriptive alt.
- **H1 hygiene**: exactly one H1 per page, keyword-front-loaded.
- Trigger SEO scan at end.

---

## Phase 3 — English Companions for Hindi SEO Pages

Keep every existing `/hindi/*` page. Add English mirrors where valuable:
- `/hindi/upanishad-meaning-in-hindi` → keep + strengthen; already has `/qa/how-many-upanishads`, `/texts/upanishads` in English ✓
- `/hindi/vedas-meaning-in-hindi` → keep; English mirrors already exist
- `/hindi/dhyan-kaise-karein` → add English mirror `/meditation/how-to-meditate` (new page, same structure, English)
- New: `/guides/how-to-read-vedas`, `/guides/upanishad-beginner-guide` (English long-form)

Cross-link Hindi ↔ English versions with `hreflang="hi"` / `hreflang="en"` alternate tags for correct Google language targeting.

---

## Technical Details

**Files touched (Phase 1 ≈ 25 files, Phase 2 ≈ 15, Phase 3 ≈ 4 new):**
- `src/pages/*.tsx` — copy translation, no logic changes
- `src/components/**/*.tsx` — copy + JSX-level enhancements (sticky buy card, bundle grid, exit-intent form)
- `src/lib/jsonLd.ts` — expand schema generators
- `src/hooks/useSEO.tsx` — add og:image, twitter:card, hreflang support
- `index.html` — sitewide og:* fallbacks (English)
- `scripts/generate-sitemap.mjs` — add new routes
- No DB / edge-function / auth changes
- No new deps (react-helmet-async already present)

**Preservation guarantees:**
- Hindi book titles from `books` table render as-is (they're product data, not UI copy)
- INR/₹ pricing stays (per locale memory)
- No emojis anywhere (lint rule holds)
- All existing routes keep their URLs → no redirect debt
- No auth/logic/backend changes → zero regression risk on payments, referrals, reading progress

**Delivery order:** Phase 1 first (biggest visible impact), you review, then Phase 2, then Phase 3.

---

Ready to start Phase 1?
