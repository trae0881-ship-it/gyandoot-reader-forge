## Goal

Ensure nothing goes live on GyandootNova until an admin reviews an automatic originality report. Every book chapter and article gets source-attribution fields, an originality score, and a "pending / approved / rejected" state. Admins get an audit dashboard.

## 1. Database changes (migration)

**Extend `posts` (articles) and `book_chapters`:**

Add columns to both:
- `source_type` text — `original | translation | public_domain | licensed | quoted_excerpt`
- `source_citation` text — free-text citation / URL / book reference
- `permission_notes` text — rights, license, permission-holder
- `originality_score` numeric — 0-100 from last check (nullable)
- `originality_report` jsonb — flagged passages, matched URLs, model summary
- `originality_checked_at` timestamptz
- `approval_status` text default `'draft'` — `draft | pending_review | flagged | approved | rejected | needs_rewrite`
- `approval_notes` text — admin's decision notes
- `reviewed_by` uuid (references `auth.users`, no FK — nullable)
- `reviewed_at` timestamptz
- `last_edited_by` uuid, `last_edited_at` timestamptz

**New table `content_audit_log`:**
- `id`, `entity_type` (`post | chapter | book`), `entity_id` uuid, `action` text (`edited | submitted | check_run | flagged | approved | rejected`), `actor_id` uuid, `notes` text, `payload` jsonb, `created_at`
- GRANT to `authenticated` and `service_role`; RLS: admins can select all, authors can select their own rows; only service role / admin inserts.

**Publish gate:** existing `posts.is_published` and `posts.publish_status` stay, but a trigger blocks flipping `is_published = true` unless `approval_status = 'approved'`. Same rule for `book_chapters` (add `is_published` if missing — currently gated via `is_preview` / purchase; skip if not needed and instead gate visibility in the reader by `approval_status`).

## 2. Edge function `content-originality-check`

Input: `{ entity_type, entity_id }`. Server-only (verify admin or content owner via JWT).
- Loads content (`posts.content` / `book_chapters.content`), strips HTML.
- Calls Lovable AI (`google/gemini-2.5-flash`) with a structured-output prompt: return `{ score, verdict: original|borrowed|uncertain, flagged_passages: [{text, reason, likely_source}], summary }`.
- Optionally cross-checks flagged passages against the web via existing `TAVILY_API_KEY` (already in secrets) for URL matches.
- Writes result to `originality_score`, `originality_report`, `originality_checked_at`.
- If `score < 70` OR any flagged passage → sets `approval_status = 'flagged'` and inserts audit-log row.
- Returns the report to the caller.

Auto-trigger: called from the client immediately when an editor clicks "Submit for review" (status flips `draft → pending_review`, then function runs, may downgrade to `flagged`).

## 3. Editor UI additions

**`AdminPosts` (article editor) and `AdminBooks` chapter editor:**
Add a "Sources & Permissions" card above the save button:
- Source type dropdown (5 options above)
- Source citation textarea
- Permission notes textarea
- Read-only originality panel: score badge, last-checked timestamp, "Run originality check" button, expandable flagged-passages list.
- Save action still saves as `draft`. New buttons: **Submit for Review** (locks status, runs check), **Save Draft**.

Author cannot flip to published directly — the "Publish" button is replaced with "Submit for Review" for non-admin authors. Admins keep a separate "Approve & Publish" button that only enables when `approval_status = 'approved'`.

## 4. Admin Content Audit dashboard

New route `/admin/content-audit` (added to `AdminLayout` sidebar):
- Tabs: **Pending Review**, **Flagged**, **Approved**, **All**.
- Table columns: title, type (article/chapter), author, last edited, originality score (color-coded), status badge, sources filled? (✓/✗), actions.
- Row click → drawer with full originality report, source/permission fields, audit-log timeline, and Approve / Reject / Send back for rewrite buttons (each writes to `approval_status`, `reviewed_by`, `reviewed_at`, `approval_notes` and appends to `content_audit_log`).
- Rejecting with reason "borrowed content" auto-sets `approval_status = 'needs_rewrite'` and returns the piece to the author's queue.

## 5. Reader-side enforcement

- `Articles.tsx`, `ArticleDetail.tsx`, `BookReader.tsx`, `FileBookReader.tsx`, and the article/book chapter queries all filter to `approval_status = 'approved'` (in addition to existing `is_published` checks). Admins bypass via existing `has_role` check.
- Content list queries already used everywhere pass through a shared helper so this is a one-line change per file.

## Technical details

- Lovable AI is already wired (`LOVABLE_API_KEY` present). Use AI SDK `generateText` with `Output.object` for a small, unconstrained schema (score number, verdict enum, short summary, passages array — no `.min/.max`).
- Tavily key is present for optional web cross-check; keep it best-effort so a Tavily failure never blocks the report.
- All new columns are nullable / defaulted so existing rows remain valid; existing published rows are backfilled to `approval_status = 'approved'` in the same migration.
- GRANTs on the new table + updated RLS on `posts` and `book_chapters` so authors can't UPDATE `approval_status` directly (only through the edge function / admin dashboard).
- No frontend business-logic rewrite; existing editors get new fields and the new "Submit for Review" button. Existing publish/reader paths gain a single `approval_status` check.

## Files to create/edit

New:
- `supabase/migrations/<ts>_content_originality_workflow.sql`
- `supabase/functions/content-originality-check/index.ts`
- `src/pages/admin/AdminContentAudit.tsx`
- `src/components/admin/OriginalityPanel.tsx` (reusable card)
- `src/components/admin/SourcesPermissionsCard.tsx`

Edit:
- `src/pages/admin/AdminPosts.tsx` — add source/permission fields, replace Publish with Submit-for-Review flow.
- `src/pages/admin/AdminBooks.tsx` — same additions for chapter editor.
- `src/pages/admin/AdminLayout.tsx` — sidebar link + route.
- `src/App.tsx` — route registration.
- `src/pages/Articles.tsx`, `src/pages/ArticleDetail.tsx`, `src/pages/BookReader.tsx`, `src/pages/FileBookReader.tsx`, `src/pages/Index.tsx` (latest posts query) — add `.eq("approval_status", "approved")` for non-admin reads.

## Rollout

1. Run migration (backfills existing published rows to `approved`).
2. Deploy edge function.
3. Ship editor + dashboard UI.
4. From then on, every new/edited piece must pass the originality check + admin approval before appearing on the site.
