import { apiFetch } from "./api";

// DASHBOARDS

export async function getDashboards() {
  return apiFetch("/api/dashboards");
}

export async function getDashboard(id) {
  return apiFetch(`/api/dashboards/${id}`);
}

export async function createDashboard(payload) {
  return apiFetch("/api/dashboards", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateDashboard(dashboardId, payload) {
  return apiFetch(`/api/dashboards/${dashboardId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteDashboard(dashboardId) {
  return apiFetch(`/api/dashboards/${dashboardId}`, {
    method: "DELETE",
  });
}

// WIDGETS

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

export async function reorderWidgets(dashboardId, widgets) {
  return apiFetch(`/api/dashboards/${dashboardId}/widgets/reorder`, {
    method: "PATCH",
    body: JSON.stringify({ widgets }),
  });
}
