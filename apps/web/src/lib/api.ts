import type { ApiResponse, Category, Post, PostSummary } from "@donggeuri/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  const payload = (await response.json()) as ApiResponse<T>;

  if (!payload.success) {
    throw new Error(payload.error.message);
  }

  return payload.data;
}

export function listPosts() {
  return request<PostSummary[]>("/api/public/posts");
}

export function getPost(slug: string) {
  return request<Post>(`/api/public/posts/${slug}`);
}

export function listCategories() {
  return request<Category[]>("/api/public/categories");
}
