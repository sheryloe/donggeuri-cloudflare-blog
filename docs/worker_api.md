# Worker API Design

## Public Routes
GET /api/public/posts
GET /api/public/posts/:slug
GET /api/public/categories

## Admin Routes
POST /api/admin/posts
PUT /api/admin/posts/:id
DELETE /api/admin/posts/:id

## Principles
- public/admin route separation
- validation on entry
- consistent JSON response