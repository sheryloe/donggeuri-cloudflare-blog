# Donggeuri Cloudflare Blog

Cloudflare-only blog platform scaffold based on the architecture docs in `docs/`.

## Architecture

- Cloudflare Pages for the public site and admin UI shell
- Cloudflare Workers for the JSON API
- Cloudflare D1 for blog metadata and post content
- Cloudflare R2 for media assets

## Workspace Layout

- `apps/web`: Cloudflare Pages frontend for public and admin routes
- `apps/api`: Cloudflare Worker API with D1 and R2 bindings
- `packages/shared`: shared types used by the web app and the worker

## Quick Start

1. Copy `.env.example` into your local environment tooling as needed.
2. Install dependencies with `npm install`.
3. Run the API with `npm run dev:api`.
4. Run the frontend with `npm run dev:web`.

## Worker API

Implemented scaffold routes from `docs/worker_api.md`:

- `GET /api/public/posts`
- `GET /api/public/posts/:slug`
- `GET /api/public/categories`
- `POST /api/admin/posts`
- `PUT /api/admin/posts/:id`
- `DELETE /api/admin/posts/:id`

Admin routes currently use `Authorization: Bearer <JWT_SECRET>` as a bootstrap-only placeholder until a dedicated login flow is added.
