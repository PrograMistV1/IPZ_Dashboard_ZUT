import { apiFetch } from "./api";

export async function listWeatherConfigs() {
  return apiFetch('/api/weather/configs');
}

export async function createWeatherConfig(name, configuration) {
  return apiFetch('/api/weather/configs', { method: 'POST', body: JSON.stringify({ name, configuration }) });
}

export async function getWeatherConfig(id) {
  return apiFetch(`/api/weather/configs/${id}`);
}

export async function updateWeatherConfig(id, configuration) {
  return apiFetch(`/api/weather/configs/${id}`, { method: 'PATCH', body: JSON.stringify({ configuration }) });
}
