## Blog Publishing & Scheduling — Implementation Plan

Add full publishing metadata and scheduling to the AI blog agent (`seo-blog-agent`) and the Admin Posts UI.

### 1. Database (migration)

Extend `public.posts` with scheduling + SEO fields:

- `publish_status` text default `'draft'` — check in (`draft`,`scheduled`,`published`)
- `scheduled_at` timestamptz (combined date+time in UTC)
- `timezone` text default `'Asia/Kolkata'`
- `reading_time_min` int
- `word_count` int
- `category` text
- `primary_keyword` text
- `secondary_keywords` text[]
- `tags` text[]
- `author` text
- `featured_image_title` text
- `featured_image_alt` text
- `featured_image_caption` text
- `social_caption` text
- `social_excerpt` text
- `internal_links` jsonb  (array of `{anchor,url}`)
- `external_references` jsonb (array of `{title,url}`)
- `canonical_url` text
- `schema_type` text default `'BlogPosting'`

Backfill `publish_status` from existing `is_published`. Keep `is_published` for backward compatibility (mirror it via trigger on publish_status change).

### 2. `seo-blog-agent` edge function

Update the AI generation prompt + Zod schema to return a structured object with two top-level sections:

```
{
  article: { title, slug, meta_title, meta_description, content, excerpt, ... },
  publishing: { publish_status, scheduled_publish_date, scheduled_publish_time,
                timezone, reading_time, word_count, category, primary_keyword,
                secondary_keywords, tags, author, featured_image_prompt,
                featured_image_title, featured_image_alt, featured_image_caption,
                social_caption, social_excerpt, internal_links,
                external_references, canonical_url, schema_type }
}
```

Rules implemented server-side:
- If caller passes `scheduled_at` → use it, status = `scheduled`.
- Else → default `publish_status = 'draft'`, but AI still returns a suggested date/time based on target audience (Hindi spiritual readers → morning IST slots: 6–8 AM, 7–9 PM).
- Never auto-flip to `published` without explicit `confirm_publish: true` in the request.
- For batch requests (`count > 1`): stagger suggested times across days (one per day, alternating morning/evening slots) to build a publishing calendar.
- Auto-compute `word_count` and `reading_time_min` server-side (200 wpm) as a safety net over AI output.

### 3. Admin UI (`AdminPosts.tsx` + `AdminAI.tsx`)

- Post editor: add Publishing panel with status dropdown (Draft/Scheduled/Published), date+time pickers, timezone, category, tags chips, keywords, author, featured-image alt/caption, social caption/excerpt, canonical URL, schema type.
- List view: show status badge and scheduled time.
- AdminAI "Generate blog" flow: after generation, show the returned publishing plan next to the article body; user clicks Save Draft / Schedule / Publish (explicit confirmation).
- Batch generation: render the staggered calendar preview before saving.

### 4. Scheduled publishing

Add a lightweight `pg_cron` job (5-min cadence) that flips `publish_status='scheduled'` rows whose `scheduled_at <= now()` to `published` and sets `is_published=true`. Job created via `supabase--insert` (per scheduling knowledge), not migration.

### 5. Response contract

The edge function returns the exact CMS-ready shape listed in the request, so any external API consumer gets the same object the admin UI saves.

### Out of scope

- Building a public "author profile" system (reuses free-text `author`).
- Social auto-posting — we only generate captions.

Confirm and I'll implement in this order: migration → edge function → cron job → admin UI.