## Goal

Logged-in user ke liye ek rich, delightful User Dashboard banana — jisme "logo click = dashboard" ho, aur ek Kindle-jaisa page-flip Reader ho. Feature list bahut lambi hai, isliye main isse **3 phases** me dunga taaki har phase ship-ready ho aur aap review kar saken.

---

## Phase 1 — Foundation (yeh main abhi build karunga)

### 1. Logo & Auth routing
- `Header` me logo ka `to="/"` conditionally `to="/dashboard"` (logged-in user ke liye)
- `/auth` ke baad success redirect: agar user hai → `/dashboard`, warna current behavior
- Public site (Home, Books, Articles, About, etc.) sab kuch waise ka waisa — sirf logged-in user ke logo-click ka behavior badlega

### 2. New Dashboard Shell — `/dashboard`
Left sidebar (shadcn `Sidebar`, collapsible) + main content area. Sidebar sections:
- Account
- My Library
- Orders
- Reading Dashboard
- Community
- Spiritual
- Notifications
- Support

Har section apne sub-route pe kholta hai (`/dashboard/library`, `/dashboard/orders`, etc.). Mobile pe drawer.

### 3. Kindle-style Flip Reader — `/read/:bookId/flip`
- `react-pageflip` (HTMLFlipBook) use karke real page-turn animation
- Chapter content ko fixed-height "pages" me paginate karega (client-side splitter)
- Controls: next/prev, keyboard arrows, tap zones (mobile), progress bar, chapter jump, font-size, theme (sepia/dark/light), bookmark
- Existing `BookReader.tsx` intact rahega — flip ek naya mode hoga, reader ke andar toggle: "Scroll | Flip"

### 4. Core Dashboard pages (real data, working)
- **My Profile** (existing Profile.tsx ko integrate)
- **Purchased Books** + **Free Books** + **Continue Reading** (from `reading_progress`) + **Recently Viewed** (localStorage) + **Favorites/Wishlist** (from `bookmarks`)
- **My Orders** + **Invoice Download** (existing purchases → PDF via jsPDF)
- **Reading Dashboard**: streak, total time, books completed, chapters read, daily goal, achievement badges, calendar heatmap (from `reading_progress`)
- **My Reviews** + **My Comments** (from `book_reviews`)
- **Notifications** (from `seo_notifications` filtered by user, or new lightweight table)

---

## Phase 2 — Engagement & Spiritual (next turn)

- Today's Quote / Daily Mantra / Panchang / Festival Calendar (static curated data + a `daily_spiritual` table)
- Meditation Timer (client-only, chime + duration presets)
- Reading Certificate (PDF on book completion)
- Spiritual Journey Timeline
- Reading Challenge / Goals
- Birthday Blessing (from profile DOB)
- Festival Theme (auto CSS switcher on festival dates)
- Achievement Badges engine

---

## Phase 3 — Advanced (final turn)

- Family Library (invite emails, shared purchases table)
- Audio Book Player (needs audio uploads on books)
- Offline Reading (Service Worker + IndexedDB cache of chapter HTML)
- QR Code for Purchased Books
- AI Personalized Home (Lovable AI recommendations based on reading history)
- Exclusive Member Content gate
- Discussion Groups / Following authors / Followers (social graph tables)
- Live Chat & Ticket system (contact_enquiries expansion)

---

## Technical notes

- New tables (Phase 1): `wishlist`, `favorites`, `reading_sessions` (for streak/time tracking), `user_notifications`, `achievements`, `user_achievements`. All with RLS + GRANTs.
- New route: `/dashboard/*` with nested routes; existing `/library`, `/profile` will redirect into dashboard.
- Design: warm spiritual palette (saffron/deep-maroon accents on cream), Playfair Display headings + Inter body (already in project). No emojis — Lucide icons only.
- Dependencies: `react-pageflip`, `jspdf`, `react-calendar-heatmap`, `qrcode.react`.

---

**Confirm karein: Kya main Phase 1 build karna shuru kar dun?** Agar aap chahe to pehle scope trim/expand bhi kar sakte hain (e.g. "flip reader pehle chahiye, dashboard baad me").
