import { apiFetch } from "./api";

export async function getNews(category) {
  if (!category) throw new Error("Category is required");

  return apiFetch(`/api/news`, {
    method: "POST",
    body: JSON.stringify({ category }),
  });
}
