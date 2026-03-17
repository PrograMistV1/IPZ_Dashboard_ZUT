import { apiFetch } from "../../../services/api";
import { tokenManager } from "../../../services/tokenManager";

jest.mock("../../../services/tokenManager", () => ({
  tokenManager: {
    get: jest.fn(),
    clear: jest.fn(),
  },
}));

const API_URL = "http://127.0.0.1:8000";

describe("apiFetch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    tokenManager.get.mockReturnValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("basic requests", () => {
    test("makes GET request to correct URL", async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: "test" }),
      });

      await apiFetch("/api/test", { method: "GET" });

      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/api/test`,
        expect.objectContaining({
          method: "GET",
        })
      );
    });

    test("makes POST request with body", async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ id: 1 }),
      });
      const payload = { name: "test" };

      await apiFetch("/api/items", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/api/items`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(payload),
        })
      );
    });

    test("sets Content-Type header by default", async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await apiFetch("/api/test");

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        })
      );
    });
  });

  describe("authorization", () => {
    test("adds Authorization header when token exists", async () => {
      tokenManager.get.mockReturnValue("jwt-token");
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      });

      await apiFetch("/api/test", { method: "GET" });

      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/api/test`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer jwt-token",
          }),
        })
      );
    });

    test("does not add Authorization header when token is null", async () => {
      tokenManager.get.mockReturnValue(null);
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await apiFetch("/api/public");

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.any(String),
          }),
        })
      );
    });

    test("allows custom headers to override defaults", async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await apiFetch("/api/test", {
        headers: { "Content-Type": "application/xml" },
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Content-Type": "application/xml",
          }),
        })
      );
    });
  });

  describe("error handling", () => {
    test("clears token and throws UNAUTHORIZED on 401", async () => {
      tokenManager.get.mockReturnValue("expired-token");
      fetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ detail: "Invalid session" }),
      });

      await expect(apiFetch("/api/protected")).rejects.toThrow("UNAUTHORIZED");
      expect(tokenManager.clear).toHaveBeenCalledTimes(1);
    });

    test("dispatches unauthorized event on 401", async () => {
      tokenManager.get.mockReturnValue("expired-token");
      fetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ detail: "Invalid session" }),
      });
      const eventSpy = jest.spyOn(window, "dispatchEvent");

      await expect(apiFetch("/api/protected")).rejects.toThrow("UNAUTHORIZED");

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "unauthorized",
          detail: expect.objectContaining({
            path: "/api/protected",
          }),
        })
      );
      eventSpy.mockRestore();
    });

    test("throws backend validation message for non-2xx responses", async () => {
      tokenManager.get.mockReturnValue(null);
      fetch.mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ detail: [{ msg: "field required" }] }),
      });

      await expect(
        apiFetch("/api/news", { method: "POST" })
      ).rejects.toThrow("field required");
    });

    test("throws generic error when no detail in response", async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(apiFetch("/api/error")).rejects.toThrow("Request failed");
    });

    test("includes status in error object", async () => {
      fetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ detail: "Not found" }),
      });

      try {
        await apiFetch("/api/not-found");
      } catch (error) {
        expect(error.status).toBe(404);
      }
    });

    test("includes details in error object", async () => {
      const errorDetail = [{ msg: "invalid email" }];
      fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ detail: errorDetail }),
      });

      try {
        await apiFetch("/api/register", { method: "POST" });
      } catch (error) {
        expect(error.details).toEqual(errorDetail);
      }
    });
  });

  describe("response handling", () => {
    test("returns parsed JSON data on success", async () => {
      const responseData = { user: { id: 1, name: "John" } };
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => responseData,
      });

      const result = await apiFetch("/api/user/1");

      expect(result).toEqual(responseData);
    });

    test("handles empty JSON response", async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 204,
        json: async () => ({}),
      });

      const result = await apiFetch("/api/no-content");

      expect(result).toEqual({});
    });

    test("handles null JSON response", async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => null,
      });

      const result = await apiFetch("/api/null-response");

      expect(result).toBeNull();
    });

    test("handles malformed JSON gracefully", async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      const result = await apiFetch("/api/bad-json");

      expect(result).toBeNull();
    });
  });

  describe("edge cases", () => {
    test("handles path without leading slash", async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await apiFetch("api/test-no-slash");

      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}api/test-no-slash`,
        expect.any(Object)
      );
    });

    test("handles query parameters in path", async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
      });

      await apiFetch("/api/search?q=test&page=1");

      expect(fetch).toHaveBeenCalledWith(
        `${API_URL}/api/search?q=test&page=1`,
        expect.any(Object)
      );
    });
  });
});
