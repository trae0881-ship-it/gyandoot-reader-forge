# Deploying on Railway

## Website (frontend)
1. Push this repo to GitHub, then in Railway: New Project -> Deploy from GitHub repo.
2. Railway detects `railway.json` and builds the `Dockerfile` (nginx serves the site on `$PORT`).
3. In the service Variables, add (copy values from `.env`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
4. Settings -> Networking -> Generate Domain, or add `gyandootnova.in` as a custom domain.

## Backend
The database, login, storage and all server functions (payments, SEO agents, emails,
daily report) run on Lovable Cloud. The Railway website talks to that same backend,
so nothing else has to be deployed and all data stays in one place.

Moving the backend itself off Lovable Cloud would require a self-hosted Supabase
stack plus migrating data, secrets (PayPal, Resend, AI keys) and scheduled jobs.
