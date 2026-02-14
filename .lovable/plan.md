

# GyandootNova — Spiritual Publication & Knowledge Platform

## Brand & Design System
- **Colors**: Deep Red (#B71C1C) primary, Golden Yellow (#FBC02D) accents, White background, Dark Charcoal (#222222) text
- **Typography**: Serif headings (Google Fonts - Playfair Display), sans-serif body (Inter)
- **Feel**: Premium spiritual editorial with generous whitespace and clean layout

---

## Pages & Features

### 1. Public Site

**Homepage**
- Hero banner with brand tagline and call-to-action
- Featured books carousel
- Latest articles/programs section
- Donation call-to-action banner

**Books Library** (`/books`)
- Grid of book cards with WebP thumbnails, title, author, price/free badge
- Filter by free/paid

**Book Detail** (`/books/:slug`)
- Book cover, description, table of contents
- "Read Free Preview" or "Purchase to Read" button
- Razorpay checkout for paid books

**Online Book Reader** (`/books/:slug/:chapter-slug`)
- Clean branded reading layout
- Font size toggle, dark/light mode
- Reading progress bar
- Next/Previous chapter navigation
- PDF viewer (PDF.js) for uploaded PDFs
- Session-based access control — purchase validation before unlocking paid chapters

**Articles & Programs** (`/articles`, `/articles/:slug`)
- Blog-style listing with cards
- Full article view with rich content

**Donations** (`/donate`)
- Custom amount donation form
- Razorpay checkout integration
- Thank you confirmation

### 2. Admin Panel (`/admin`)

- **Secure login** with email/password (Supabase Auth)
- **Dashboard**: Quick stats — total books, posts, revenue, donations
- **Books Management**: CRUD books, upload PDF/DOC files to Supabase Storage, add/manage chapters, toggle free/preview, auto-generate slugs, WebP thumbnail upload
- **Posts Management**: CRUD articles and programs
- **Donations & Purchases**: View lists with basic analytics
- **Settings**: Site logo, brand name configuration

### 3. Authentication & Roles
- Supabase Auth for user registration and login
- User roles table (admin, user) with secure role checking
- Admin routes protected by role validation

---

## Database Schema (Supabase)

1. **profiles** — user display info (linked to auth.users)
2. **user_roles** — role-based access (admin/user)
3. **books** — title, slug, description, cover_url, price, is_free, file_url, file_type
4. **book_chapters** — book_id, title, slug, chapter_number, content, is_preview
5. **posts** — title, slug, content, type (article/program), meta fields
6. **donations** — user_id, amount, razorpay_payment_id, status
7. **purchases** — user_id, book_id, razorpay_payment_id, status
8. **settings** — key/value site configuration

Indexes on slug, book_id, chapter_number. RLS policies on all tables.

---

## Razorpay Integration
- Edge function to create Razorpay orders
- Edge function webhook to verify payment signatures
- Client-side Razorpay Checkout SDK for books and donations
- Purchase records stored with payment IDs
- Access unlocked after verified payment

---

## SEO & Performance
- Dynamic meta titles, descriptions, Open Graph & Twitter card tags per page
- Structured data (JSON-LD) for Organization, Book, Article
- Clean slug-based URLs with React Router
- Lazy loading images, WebP format
- Minimal bundle — no heavy libraries

---

## File Storage
- Supabase Storage buckets for book files (PDF/DOC) and cover images
- Secure bucket with RLS — only purchased users or preview access
- Files served through authenticated URLs, no direct public downloads

