import { Hono } from "hono";
import { z } from "zod";

import { createPost, deletePost, updatePost } from "../lib/posts";
import { fail, ok, parseJson, requireAdmin } from "../lib/http";
import type { AppEnv } from "../types";

const postInputSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().trim().nullable().optional(),
  slug: z.string().trim().min(1).optional(),
  excerpt: z.string().trim().nullable().optional(),
  content: z.string().min(1),
  categoryId: z.string().trim().nullable().optional(),
  tagIds: z.array(z.string().trim().min(1)).optional(),
  coverImage: z.string().trim().nullable().optional(),
  youtubeUrl: z.string().trim().nullable().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  publishedAt: z.string().trim().nullable().optional(),
});

const postUpdateSchema = postInputSchema.partial();

const adminRoutes = new Hono<AppEnv>();

adminRoutes.use("*", requireAdmin);

adminRoutes.post("/posts", async (c) => {
  const parsed = await parseJson(c, postInputSchema);

  if ("response" in parsed) {
    return parsed.response;
  }

  const post = await createPost(c.env.DB, parsed.data);
  return ok(c, post, 201);
});

adminRoutes.put("/posts/:id", async (c) => {
  const parsed = await parseJson(c, postUpdateSchema);

  if ("response" in parsed) {
    return parsed.response;
  }

  const post = await updatePost(c.env.DB, c.req.param("id"), parsed.data);

  if (!post) {
    return fail(c, 404, "POST_NOT_FOUND", "No post matched the requested id.");
  }

  return ok(c, post);
});

adminRoutes.delete("/posts/:id", async (c) => {
  const deleted = await deletePost(c.env.DB, c.req.param("id"));

  if (!deleted) {
    return fail(c, 404, "POST_NOT_FOUND", "No post matched the requested id.");
  }

  return ok(c, { id: c.req.param("id"), deleted: true });
});

export default adminRoutes;
