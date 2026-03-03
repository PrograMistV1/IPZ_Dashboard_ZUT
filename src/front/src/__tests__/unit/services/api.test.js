import { apiFetch } from "../../../services/api";
import { tokenManager } from "../../../services/tokenManager";

jest.mock("../../../services/tokenManager", () => ({
  tokenManager: {
    get: jest.fn(),
    clear: jest.fn(),
  },
}));

describe("apiFetch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  test("adds Authorization header when token exists", async () => {
    tokenManager.get.mockReturnValue("jwt-token");
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });

    await apiFetch("/api/test", { method: "GET" });

    expect(fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/test",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer jwt-token",
        }),
      })
    );
  });

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

  test("throws backend validation message for non-2xx responses", async () => {
    tokenManager.get.mockReturnValue(null);
    fetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ detail: [{ msg: "field required" }] }),
    });

    await expect(apiFetch("/api/news", { method: "POST" })).rejects.toThrow(
      "field required"
    );
  });
});
