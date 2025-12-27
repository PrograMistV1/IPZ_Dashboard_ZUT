import { tokenManager } from "./tokenManager";

const API_URL = "http://127.0.0.1:8000";

export async function apiFetch(
  path,
  options = {}
) {
  const token = tokenManager.get();

  const res = await fetch(
    API_URL + path,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && {
          Authorization: `Bearer ${token}`,
        }),
        ...options.headers,
      },
    }
  );

  if (res.status === 401) {
    tokenManager.clear();
    throw new Error("UNAUTHORIZED");
  }

  return res.json();
}
