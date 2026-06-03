# Multi-Channel OTP Authentication

User ke liye 3 channels se OTP login: **SMS**, **WhatsApp**, **Email**. Admin har channel ke liye apna provider (MSG91 / Twilio / Fast2SMS / Gupshup / WhatsApp Cloud API) admin panel se add kar sakega.

---

## 1. Database (new tables)

**`otp_providers`** (admin-managed)
- `channel`: `'sms' | 'whatsapp' | 'email'`
- `provider_name`: `'twilio' | 'msg91' | 'fast2sms' | 'gupshup' | 'whatsapp_cloud' | 'resend'`
- `config_json` (jsonb) — API key, sender ID, template ID, from-number etc.
- `is_active` (only one active per channel)

**`phone_otps`** (replace/extend `admin_otps` pattern)
- `phone` (E.164), `code_hash`, `channel`, `expires_at`, `attempts`, `used`

**`profiles`** add `phone` column (unique, nullable).

RLS: only admins read/write `otp_providers`; `phone_otps` only via service-role from edge functions.

---

## 2. Edge Functions

| Function | Purpose |
|---|---|
| `phone-otp-send` | Input: `{phone, channel}` → picks active provider → sends OTP via SMS/WhatsApp → stores hash |
| `phone-otp-verify` | Input: `{phone, code}` → verifies → creates/links Supabase user (using admin API + `signInWithOtp` magic link OR custom token) → returns session |

Provider adapters inside one function file (`providers/twilio.ts`, `msg91.ts`, etc.) — switch by `provider_name`.

**Auth integration:** Use Supabase Admin API: `admin.createUser({phone, phone_confirm: true})` if not exists, then `admin.generateLink({type: 'magiclink'})` → frontend uses returned token to set session. (Custom flow because Supabase native phone auth requires Twilio configured in dashboard, which we are replacing with our own multi-provider system.)

---

## 3. Admin UI — `/admin/auth-providers`

New page in admin sidebar:
- Channel selector (SMS / WhatsApp / Email)
- Provider dropdown per channel
- Dynamic form fields per provider (Twilio → SID/Token/From; MSG91 → AuthKey/TemplateID/Sender; etc.)
- Test button (sends OTP to admin's own number)
- Toggle active

Secrets stored encrypted in `config_json` (server-side only, never exposed to client — admin UI shows masked values).

---

## 4. User UI — `/auth` redesign

Tabs: **Email/Password** | **Phone OTP** | **WhatsApp OTP** | **Google**
- Phone tab: country code + number → "Send OTP" → 6-digit input → verify → redirect `/profile`
- Same flow for WhatsApp tab (different channel param)
- Email tab unchanged

---

## 5. Implementation order

1. Migration: `otp_providers`, `phone_otps`, profile.phone
2. Edge function: `phone-otp-send` + `phone-otp-verify` with Twilio + MSG91 + WhatsApp Cloud adapters
3. Admin page `/admin/auth-providers` + sidebar link
4. User `/auth` page — add Phone/WhatsApp tabs
5. Test end-to-end

---

## Technical notes

- Providers ke API keys **`otp_providers.config_json`** me store honge (not in Supabase secrets) — kyunki admin runtime pe add karega, har provider ke alag fields hain.
- WhatsApp Cloud API (Meta) free hai for low volume; Twilio WhatsApp paid hai but easier setup. Admin choose karega.
- Rate limit: max 3 OTP requests per phone per 10 min (in edge function).
- "Chapter not found" issue ke liye — alag se book slug bhejiye, baad me fix karenge.

**Approve karein to implementation start karta hu.**