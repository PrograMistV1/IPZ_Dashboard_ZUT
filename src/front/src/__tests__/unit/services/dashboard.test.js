import { apiFetch } from "../../../services/api";
import {
  getDashboards,
  getDashboard,
  createDashboard,
  updateDashboard,
  deleteDashboard,
  createWidget,
  updateWidget,
  reorderWidgets,
} from "../../../services/dashboard";

jest.mock("../../../services/api", () => ({
  apiFetch: jest.fn(),
}));

describe("dashboard service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getDashboards", () => {
    test("fetches all dashboards", async () => {
      const mockDashboards = [
        { id: 1, name: "Dashboard 1" },
        { id: 2, name: "Dashboard 2" },
      ];
      apiFetch.mockResolvedValue(mockDashboards);

      const result = await getDashboards();

      expect(apiFetch).toHaveBeenCalledWith("/api/dashboards");
      expect(result).toEqual(mockDashboards);
    });
  });

  describe("getDashboard", () => {
    test("fetches single dashboard by id", async () => {
      const mockDashboard = { id: 5, name: "My Dashboard", widgets: [] };
      apiFetch.mockResolvedValue(mockDashboard);

      const result = await getDashboard(5);

      expect(apiFetch).toHaveBeenCalledWith("/api/dashboards/5");
      expect(result).toEqual(mockDashboard);
    });
  });

  describe("createDashboard", () => {
    test("creates new dashboard with payload", async () => {
      const payload = { name: "New Dashboard", widgets: [] };
      const createdDashboard = { id: 10, ...payload };
      apiFetch.mockResolvedValue(createdDashboard);

      const result = await createDashboard(payload);

      expect(apiFetch).toHaveBeenCalledWith("/api/dashboards", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      expect(result).toEqual(createdDashboard);
    });
  });

  describe("updateDashboard", () => {
    test("updates existing dashboard", async () => {
      const dashboardId = 7;
      const payload = { name: "Updated Name" };
      const updatedDashboard = { id: dashboardId, ...payload };
      apiFetch.mockResolvedValue(updatedDashboard);

      const result = await updateDashboard(dashboardId, payload);

      expect(apiFetch).toHaveBeenCalledWith(`/api/dashboards/${dashboardId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      expect(result).toEqual(updatedDashboard);
    });
  });

  describe("deleteDashboard", () => {
    test("deletes dashboard by id", async () => {
      const dashboardId = 3;
      apiFetch.mockResolvedValue({ message: "Deleted" });

      const result = await deleteDashboard(dashboardId);

      expect(apiFetch).toHaveBeenCalledWith(
        `/api/dashboards/${dashboardId}`,
        {
          method: "DELETE",
        }
      );
      expect(result).toEqual({ message: "Deleted" });
    });
  });

  describe("createWidget", () => {
    test("creates widget in dashboard", async () => {
      const dashboardId = 5;
      const payload = { type: "weather", position: { x: 0, y: 0 } };
      const createdWidget = { id: 100, ...payload };
      apiFetch.mockResolvedValue(createdWidget);

      const result = await createWidget(dashboardId, payload);

      expect(apiFetch).toHaveBeenCalledWith(
        `/api/dashboards/${dashboardId}/widgets`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
      expect(result).toEqual(createdWidget);
    });
  });

  describe("updateWidget", () => {
    test("updates existing widget", async () => {
      const widgetId = 42;
      const payload = { position: { x: 10, y: 20 } };
      const updatedWidget = { id: widgetId, ...payload };
      apiFetch.mockResolvedValue(updatedWidget);

      const result = await updateWidget(widgetId, payload);

      expect(apiFetch).toHaveBeenCalledWith(`/api/widgets/${widgetId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      expect(result).toEqual(updatedWidget);
    });
  });

  describe("reorderWidgets", () => {
    test("reorders widgets in dashboard", async () => {
      const dashboardId = 1;
      const widgets = [
        { id: 1, order: 0 },
        { id: 2, order: 1 },
        { id: 3, order: 2 },
      ];
      apiFetch.mockResolvedValue({ success: true });

      const result = await reorderWidgets(dashboardId, widgets);

      expect(apiFetch).toHaveBeenCalledWith(
        `/api/dashboards/${dashboardId}/widgets/reorder`,
        {
          method: "PATCH",
          body: JSON.stringify({ widgets }),
        }
      );
      expect(result).toEqual({ success: true });
    });
  });
});