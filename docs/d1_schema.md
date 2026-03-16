# D1 Schema

## Tables
- posts
- categories
- tags
- post_tags
- series
- series_posts
- media_assets

Example:

CREATE TABLE posts (
 id TEXT PRIMARY KEY,
 slug TEXT UNIQUE,
 title TEXT,
 content_json TEXT,
 status TEXT,
 created_at TEXT,
 updated_at TEXT
);