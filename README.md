# GSI Stock Management (Cloudflare Pages + Supabase)

Temporary showcase version moved off Base44. Later merges into GSI Portal (FastAPI + PostgreSQL).

## Architecture
- Frontend: React/Vite on Cloudflare Pages (`npm run build` → `dist`)
- Login: Supabase Auth (email + password, 6-digit sign-up code, reset link)
- Backend: ONE Supabase Edge Function `store-api` (service key stays on the server)
  - `supabase/functions/store-api/handlers/*` = the ported Base44 functions (same names)
  - `supabase/functions/_shared/base44compat.ts` = verifies the login token and loads the
    user from `public.userdetails` (isvaliduser + getuserdetails). Inactive users are blocked.
- Frontend calls stay `base44.functions.invoke(name, payload)`; `src/api/base44Client.js`
  forwards them to `store-api`.

## Environment
Cloudflare Pages env vars (and `.env.local` for dev):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`  (public anon key only — never the service_role key)

## Deploy backend
npx supabase functions deploy store-api --project-ref qndbffhigdlednfmaexz
