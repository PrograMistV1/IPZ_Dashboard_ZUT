import { apiFetch } from "./api";

export async function getDashboards() {
  const res = await apiFetch("/api/dashboards");
  return res;
}

export async function getDashboard(id) {
  return apiFetch(`/api/dashboards/${id}`);
}

export async function createWidget(dashboardId, payload) {
  return apiFetch(`/api/dashboards/${dashboardId}/widgets`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateWidget(widgetId, payload) {
  return apiFetch(`/api/widgets/${widgetId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function updateDashboard(dashboardId, payload) {
  return apiFetch(`/api/dashboards/${dashboardId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}