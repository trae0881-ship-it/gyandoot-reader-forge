# Sales Conversion Sprint — 4 features

## 1. Book Reviews (submit + display verified count)

**DB** — `book_reviews` table already exists (rating, review, is_verified_purchase auto-set by trigger, is_approved). No migration needed.

**Components** — new `src/components/BookReviewForm.tsx` (star picker + textarea, logged-in only, one review per user per book) and `src/components/BookReviewList.tsx` (approved reviews with verified badge, avg rating, count).

**Book card** — replace the hardcoded `Stars`/reviews line in `BookCard` (Books.tsx line 382-390) with real aggregate from `book_reviews` (count of approved). Show "✓ Verified" badge next to count if any verified purchases exist. Fetch aggregates once per page in a single query keyed by book_id.

**Book detail** — add reviews section at bottom of `BookDetail.tsx` with the form (if logged in) + list.

## 2. `/offer/[slug]` ads landing page

New route `src/pages/OfferLanding.tsx` registered in `App.tsx`. Distraction-free:
- No header/footer (use a bare layout, just a small logo top-left)
- Big cover, title, one-line pitch, price + WELCOME10 auto-applied
- Single sticky "Buy Now — ₹XXX" CTA that jumps straight into checkout
- Trust bar (compact), 2 short reviews, money-back note, FAQ (3 items)
- UTM capture on mount → `sales_events` (view_offer_landing)
- SEO: noindex (ad landing, not organic)

## 3. Admin Sales Funnel dashboard

New tab in `AdminDashboard.tsx` (or new `src/pages/admin/AdminSalesFunnel.tsx` linked from admin nav). One-screen funnel:

```text
view_books_list  ████████████ 1,240
  → view_book      ██████ 480 (39%)
    → click_buy_now  ███ 210 (44%)
      → begin_checkout ██ 92 (44%)
        → payment_success █ 38 (41%)
```

Data source: existing `sales_events` table. Show:
- Funnel bars (last 7d / 30d toggle)
- Drop-off % between each step
- Top UTM sources by conversion
- Recent 20 events table

## 4. Guest checkout (email-only)

**Frontend** — on `BookDetail.tsx` Buy Now: if not logged in, show a compact inline dialog asking only for email (+ optional name). No password, no OTP required for the checkout itself.

**Backend** — extend `create-order` edge function to accept `guest_email` when there is no auth. Store as `guest_email` column on `purchases` (add if missing). `verify-payment` grants access + emails download link to guest email.

**DB migration** — add `guest_email TEXT` and `guest_name TEXT` on `purchases`, allow null user_id when guest_email present (validation trigger — one of the two must be set), plus RLS grant so anon can insert via edge function only (service role).

**Post-purchase** — send an existing transactional email with the file download link + a "claim account" link (magic-link signup) so they can access their library later.

## Delivery order

1. DB migration (guest checkout columns) — one approval gate.
2. Features 1, 2, 3 in parallel edits (no cross-dependencies).
3. Feature 4 wiring (frontend dialog + edge function updates) after migration lands.

All four use existing tables/functions where possible — only one migration is required.
