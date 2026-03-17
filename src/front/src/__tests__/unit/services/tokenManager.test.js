import { tokenManager } from "../../../services/tokenManager";

const TOKEN_KEY = "access_token";

describe("tokenManager", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("get", () => {
    test("returns null when no token is set", () => {
      expect(tokenManager.get()).toBeNull();
    });

    test("returns token when it is set", () => {
      const testToken = "abc.def.ghi";
      tokenManager.set(testToken);
      expect(tokenManager.get()).toBe(testToken);
    });

    test("returns the exact token that was set", () => {
      const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test";
      tokenManager.set(testToken);
      expect(tokenManager.get()).toBe(testToken);
    });
  });

  describe("set", () => {
    test("stores token in localStorage", () => {
      const testToken = "test-token-123";
      tokenManager.set(testToken);
      expect(localStorage.getItem(TOKEN_KEY)).toBe(testToken);
    });

    test("overwrites existing token", () => {
      tokenManager.set("old-token");
      tokenManager.set("new-token");
      expect(tokenManager.get()).toBe("new-token");
    });

    test("can store empty string as token", () => {
      tokenManager.set("");
      expect(tokenManager.get()).toBe("");
    });

    test("stores JWT-format token correctly", () => {
      const jwtToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxfQ.test";
      tokenManager.set(jwtToken);
      expect(tokenManager.get()).toBe(jwtToken);
    });
  });

  describe("clear", () => {
    test("removes token from localStorage", () => {
      tokenManager.set("to-be-removed");
      tokenManager.clear();
      expect(tokenManager.get()).toBeNull();
    });

    test("clearing when no token exists does not throw", () => {
      expect(() => tokenManager.clear()).not.toThrow();
    });

    test("clear removes only the token key", () => {
      localStorage.setItem("other_key", "other_value");
      tokenManager.set("token");
      tokenManager.clear();
      expect(localStorage.getItem("other_key")).toBe("other_value");
      expect(tokenManager.get()).toBeNull();
    });
  });

  describe("integration", () => {
    test("set and get roundtrip", () => {
      const testToken = "roundtrip-token";
      tokenManager.set(testToken);
      expect(tokenManager.get()).toBe(testToken);
    });

    test("set, clear, get sequence", () => {
      tokenManager.set("temp-token");
      expect(tokenManager.get()).toBe("temp-token");
      tokenManager.clear();
      expect(tokenManager.get()).toBeNull();
    });
  });
});
