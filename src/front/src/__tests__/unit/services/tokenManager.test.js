import { tokenManager } from "../../../services/tokenManager";

describe("tokenManager", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("set and get token", () => {
    tokenManager.set("abc.def.ghi");

    expect(tokenManager.get()).toBe("abc.def.ghi");
  });

  test("clear removes token", () => {
    tokenManager.set("to-be-removed");
    tokenManager.clear();

    expect(tokenManager.get()).toBeNull();
  });
});
