# Sales Conversion Overhaul — /books & Book Detail

Goal: `/books` aur book-detail pages ko sales-optimized banana. Sirf UI theek hone se sales nahi aati — trust, low-friction checkout, aur clear offer chahiye. Yeh plan 4 phases me deliver hoga.

## Phase 1 — Trust & Social Proof (highest ROI)

**Book cards (/books) me add:**
- Star rating + review count badge (e.g. "4.8 ★ · 1,240 readers")
- "Verified Purchase" badge on reviews
- Live reader count chip (already exists in `mem://ui/social-proof` — reuse)
- "Bestseller" / "New" / "Free preview" tags with Lucide icons

**Book detail page me add:**
- Testimonials carousel (min 3, real quotes from `contact_enquiries` or seeded)
- "X people bought in last 24h" (from `purchases` table)
- Money-back / satisfaction guarantee strip
- Author credibility block (photo, credentials, other books)

**DB:** naya `book_reviews` table (rating 1-5, review text, verified flag, user_id, book_id) + admin moderation.

## Phase 2 — Checkout Friction Removal

**Current problem:** multi-step, requires login before payment.

**Changes:**
- One-click **Buy Now** on card → direct Razorpay modal (guest checkout via email only)
- Save address/phone on profile after first purchase; auto-fill next time
- Remove all optional fields from checkout
- Sticky mobile "Buy Now ₹XXX" bar on book detail page
- UPI + Cards + Wallets prominently shown (Razorpay already integrated)
- Post-payment: instant access + email receipt (Resend already set up)

**DB:** `guest_checkouts` table for email-only orders; link to user on later signup.

## Phase 3 — Pricing & Offers

- **First-time buyer coupon:** auto-apply `WELCOME10` (10% off) — banner on `/books`
- **Bundle discount:** "Buy 2 get 15% off, Buy 3 get 25%" — auto-calculated in cart
- **Free shipping threshold** removed (digital books) — instead "Instant PDF + Reader access"
- **Stock urgency** (honest): "Limited-time launch price · ends [date]" — admin-editable, no fake countdown
- Coupon input already exists; add "Apply best coupon automatically" toggle

## Phase 4 — Landing Optimization for Traffic Sources

**SEO (Google organic):**
- Each book page: FAQ schema, Review schema, Product schema with price/availability
- H1 = book title + core benefit, H2s = "What you'll learn", "Who this is for"
- Internal linking from blog posts → books (LSI keywords already tracked)

**WhatsApp / direct share:**
- Per-book OG image with title + price + cover (auto-generated)
- Short share link: `/b/[slug]` → redirects to full book URL with UTM
- "Share on WhatsApp" button with pre-filled message

**Instagram/Facebook ads:**
- New route `/offer/[slug]` — single-CTA landing variant (no nav, no footer clutter, testimonial above fold, one Buy Now button)
- UTM auto-capture into `purchases.utm_source`

**Repeat readers / email:**
- Abandoned checkout email (24h after `purchases.status='pending'`) via Resend
- "Complete your library" recommendation email after purchase
- Personalized "You might also like" on book detail (based on past purchases)

## Phase 5 — Analytics Funnel (measure what matters)

Client-side events (custom edge function `track-event` → `visitor_logs`):
- `view_books_list`, `view_book`, `click_buy_now`, `begin_checkout`, `payment_success`, `payment_failed`
- Store `utm_source/medium/campaign` on every event

Admin dashboard tab **"Sales Funnel"**:
- Funnel chart: views → buy click → checkout → paid
- Drop-off % at each stage
- Top-converting traffic sources
- Coupon usage & revenue impact

## Technical notes (for reference)

- Reuse existing tables: `books`, `purchases`, `coupons`, `visitor_logs`, `profiles`
- New tables: `book_reviews`, `guest_checkouts`, `sales_events`
- Edge functions: `track-event`, `abandoned-checkout-email`, `auto-apply-coupon`
- No new payment gateway — extend existing Razorpay flow
- Follow brand rules: no emojis, Lucide icons only, INR-first, Hindi-first copy

## Delivery order

Phase 1 (trust) + Phase 2 (checkout) deliver ~70% of the sales lift and are done first in one pass. Phase 3-5 follow. Each phase is independently shippable.

## Ek confirmation chahiye

Kya main **Phase 1 + Phase 2 abhi start karun** (biggest sales impact, ~1 build), aur baaki phases uske baad? Ya aap koi ek specific phase pehle chahte ho?
