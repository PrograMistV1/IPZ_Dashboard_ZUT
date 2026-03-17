import { apiFetch } from "../../../services/api";
import {
  listWeatherConfigs,
  createWeatherConfig,
  getWeatherConfig,
  updateWeatherConfig,
} from "../../../services/weather";

jest.mock("../../../services/api", () => ({
  apiFetch: jest.fn(),
}));

describe("weather service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listWeatherConfigs", () => {
    test("fetches all weather configs", async () => {
      const mockConfigs = [
        { widget_id: 1, name: "Home Weather", configuration: {} },
        { widget_id: 2, name: "Work Weather", configuration: {} },
      ];
      apiFetch.mockResolvedValue(mockConfigs);

      const result = await listWeatherConfigs();

      expect(apiFetch).toHaveBeenCalledWith("/api/weather/configs");
      expect(result).toEqual(mockConfigs);
    });

    test("handles empty configs list", async () => {
      apiFetch.mockResolvedValue([]);

      const result = await listWeatherConfigs();

      expect(result).toEqual([]);
    });
  });

  describe("createWeatherConfig", () => {
    test("creates new weather config", async () => {
      const name = "My Weather";
      const configuration = { city: "Warsaw", units: "metric" };
      const createdConfig = { widget_id: 10, name, configuration };
      apiFetch.mockResolvedValue(createdConfig);

      const result = await createWeatherConfig(name, configuration);

      expect(apiFetch).toHaveBeenCalledWith("/api/weather/configs", {
        method: "POST",
        body: JSON.stringify({ name, configuration }),
      });
      expect(result).toEqual(createdConfig);
    });

    test("creates config with empty configuration", async () => {
      const name = "Default Weather";
      const configuration = {};
      apiFetch.mockResolvedValue({ widget_id: 1, name, configuration });

      await createWeatherConfig(name, configuration);

      expect(apiFetch).toHaveBeenCalledWith("/api/weather/configs", {
        method: "POST",
        body: JSON.stringify({ name, configuration }),
      });
    });
  });

  describe("getWeatherConfig", () => {
    test("fetches weather config by widget_id", async () => {
      const widgetId = 42;
      const mockConfig = {
        widget_id: widgetId,
        name: "Test Config",
        configuration: { city: "Berlin" },
      };
      apiFetch.mockResolvedValue(mockConfig);

      const result = await getWeatherConfig(widgetId);

      expect(apiFetch).toHaveBeenCalledWith(
        `/api/weather/configs/${widgetId}`
      );
      expect(result).toEqual(mockConfig);
    });
  });

  describe("updateWeatherConfig", () => {
    test("updates existing weather config", async () => {
      const widgetId = 7;
      const configuration = { city: "London", showHumidity: true };
      const updatedConfig = { widget_id: widgetId, configuration };
      apiFetch.mockResolvedValue(updatedConfig);

      const result = await updateWeatherConfig(widgetId, configuration);

      expect(apiFetch).toHaveBeenCalledWith(
        `/api/weather/configs/${widgetId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ configuration }),
        }
      );
      expect(result).toEqual(updatedConfig);
    });

    test("updates config with partial configuration", async () => {
      const widgetId = 7;
      const configuration = { city: "Paris" };
      apiFetch.mockResolvedValue({ widget_id: widgetId, configuration });

      await updateWeatherConfig(widgetId, configuration);

      expect(apiFetch).toHaveBeenCalledWith(
        `/api/weather/configs/${widgetId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ configuration }),
        }
      );
    });
  });
});