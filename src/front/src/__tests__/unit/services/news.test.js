import { apiFetch } from "../../../services/api";
import { getNews } from "../../../services/news";

jest.mock("../../../services/api", () => ({
  apiFetch: jest.fn(),
}));

describe("news service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getNews", () => {
    test("fetches news for valid category", async () => {
      const category = "technology";
      const mockNews = [
        { id: 1, title: "Tech News 1", category },
        { id: 2, title: "Tech News 2", category },
      ];
      apiFetch.mockResolvedValue(mockNews);

      const result = await getNews(category);

      expect(apiFetch).toHaveBeenCalledWith("/api/news", {
        method: "POST",
        body: JSON.stringify({ category }),
      });
      expect(result).toEqual(mockNews);
    });

    test("throws error when category is missing", async () => {
      await expect(getNews(null)).rejects.toThrow("Category is required");
      await expect(getNews(undefined)).rejects.toThrow("Category is required");
      await expect(getNews("")).rejects.toThrow("Category is required");
    });

    test("fetches news for different categories", async () => {
      const categories = ["business", "sports", "entertainment", "science"];

      for (const category of categories) {
        apiFetch.mockResolvedValue([{ id: 1, category }]);
        await getNews(category);
        expect(apiFetch).toHaveBeenCalledWith("/api/news", {
          method: "POST",
          body: JSON.stringify({ category }),
        });
        jest.clearAllMocks();
      }
    });

    test("handles empty news list", async () => {
      apiFetch.mockResolvedValue([]);

      const result = await getNews("politics");

      expect(result).toEqual([]);
    });

    test("propagates API errors", async () => {
      apiFetch.mockRejectedValue(new Error("Network error"));

      await expect(getNews("technology")).rejects.toThrow("Network error");
    });
  });
});