# Deploying on Railway (frontend + full backend)

The same code runs on Lovable Cloud and on Railway. Which backend the website
uses is decided only by `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`.

## Services to create (one Railway project, all from this GitHub repo or image)

| Service    | Source                                   | Port | Public? |
|------------|------------------------------------------|------|---------|
| db         | image `supabase/postgres:15.8.1.060` + volume `/var/lib/postgresql/data` | 5432 | no |
| auth       | image `supabase/gotrue:v2.170.0`         | 9999 | no |
| rest       | image `postgrest/postgrest:v12.2.8`      | 3000 | no |
| storage    | image `supabase/storage-api:v1.19.3` + volume `/var/lib/storage` | 5000 | no |
| functions  | repo, Dockerfile `deploy/backend/functions/Dockerfile` | 9000 | no |
| gateway    | repo, Dockerfile `deploy/backend/gateway/Dockerfile`   | $PORT | yes (this is PUBLIC_API_URL) |
| migrate    | repo, Dockerfile `deploy/backend/migrate/Dockerfile`, restart policy NEVER | - | no |
| frontend   | repo, root `Dockerfile` (`railway.json`) | $PORT | yes |

Service names must match the table so `*.railway.internal` addresses work.
For repo services set Settings -> Build -> Dockerfile Path, root directory = repo root.

## Steps
1. `node deploy/backend/generate-keys.mjs` -> copy JWT_SECRET, ANON_KEY, SERVICE_ROLE_KEY.
2. Create `db` first, set `POSTGRES_PASSWORD`, wait until healthy.
3. Create the other services; paste variables from `deploy/backend/railway.env.example`
   (each block lists the variables for that service). Copy PayPal, Resend, AI keys etc.
4. Generate a domain for `gateway` -> set it as `PUBLIC_API_URL` everywhere.
5. Run `migrate` once. It creates all tables, roles, functions, policies and the
   daily/scheduled jobs (pointing at your gateway URL). Re-running is safe.
6. Create storage buckets once (gateway URL, service key):
   `book-covers` (public), `post-images` (public), `book-files` (private).
7. Deploy `frontend` with build variables `VITE_SUPABASE_URL=PUBLIC_API_URL`,
   `VITE_SUPABASE_PUBLISHABLE_KEY=ANON_KEY`. Add `gyandootnova.in` if desired.
8. Google login: add `PUBLIC_API_URL/auth/v1/callback` in Google Cloud console.
9. Sign up on the Railway site, then make yourself admin:
   `insert into user_roles(user_id, role) select id,'admin' from auth.users where email='YOU';`

## Moving existing data
Admin -> Data Export downloads a full SQL file from Lovable Cloud; run it against
Railway `db` after step 5. Book files/covers must be re-uploaded (or copied) to Railway storage.
User passwords do not transfer; users reset passwords or use OTP/Google.

## Important
- Railway and Lovable Cloud are separate databases. New orders/users on one do not
  appear on the other unless you re-export.
- Lovable AI gateway (`LOVABLE_API_KEY`) only works on Lovable Cloud; on Railway the
  agents use your OpenRouter / Gemini / OpenAI keys.
- Recommended: at least 4 GB RAM total across services.
