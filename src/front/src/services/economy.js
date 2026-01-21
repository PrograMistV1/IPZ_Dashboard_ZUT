import { apiFetch } from "./api";

export async function listEconomyConfigs() {
  return apiFetch("/api/economy/configs");
}

export async function createEconomyConfig(payload) {
  return apiFetch("/api/economy/configs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateEconomyConfig(id, payload) {
  return apiFetch(`/api/economy/configs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
