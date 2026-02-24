import {apiFetch} from "./api";

export async function listWeatherConfigs() {
  return apiFetch('/api/weather/configs');
}

export async function createWeatherConfig(widget_id, configuration) {
  return apiFetch('/api/weather/configs', { method: 'POST', body: JSON.stringify({ widget_id, configuration }) });
}

export async function getWeatherConfig(widget_id) {
  return apiFetch(`/api/weather/configs/${widget_id}`);
}

export async function updateWeatherConfig(widget_id, configuration) {
  return apiFetch(`/api/weather/configs/${widget_id}`, { method: 'PATCH', body: JSON.stringify({ configuration }) });
}
