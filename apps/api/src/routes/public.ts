import { Hono } from "hono";

import { fail, ok } from "../lib/http";
import { getPublishedPostBySlug, listCategories, listPublishedPosts } from "../lib/posts";
import type { AppEnv } from "../types";

const publicRoutes = new Hono<AppEnv>();

publicRoutes.get("/posts", async (c) => {
  const posts = await listPublishedPosts(c.env.DB);
  return ok(c, posts);
});

publicRoutes.get("/posts/:slug", async (c) => {
  const post = await getPublishedPostBySlug(c.env.DB, c.req.param("slug"));

  if (!post) {
    return fail(c, 404, "POST_NOT_FOUND", "No published post matched the requested slug.");
  }

  return ok(c, post);
});

publicRoutes.get("/categories", async (c) => {
  const categories = await listCategories(c.env.DB);
  return ok(c, categories);
});

export default publicRoutes;
