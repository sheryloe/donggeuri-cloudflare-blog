# API Worker

Cloudflare Worker API for public content delivery and admin operations.

## Run

- Copy `apps/api/.dev.vars.example` to `apps/api/.dev.vars`, or run `pwsh ./scripts/setup-local-dev.ps1` from the repo root.
- Apply the local schema once before `wrangler dev --local`:
  `pnpm --filter @cloudflare-blog/api exec wrangler d1 migrations apply cloudflare-blog --local`
- `pnpm --filter @cloudflare-blog/api dev`
- `pnpm --filter @cloudflare-blog/api build`

## Required Variables

- `PUBLIC_APP_ORIGIN`
- `ADMIN_APP_ORIGIN`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH`
- `JWT_SECRET`
- `R2_PUBLIC_BASE_URL`

## Public Endpoints

- `/api/public/posts`
- `/api/public/search?q=cloudflare`
- `/rss.xml`
- `/sitemap.xml`
- `/assets/*`

## Security Notes

- CORS is allowlist-based and does not reflect arbitrary request origins.
- Public routes allow the public and admin frontend origins.
- Admin routes allow only the admin frontend origin.
- Admin sessions use a same-site cookie and are intended for deployments under the same eTLD+1.
