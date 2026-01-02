const TOKEN_KEY = "access_token";

export const tokenManager = {
  get() {
    return localStorage.getItem(TOKEN_KEY);
  },

  set(token) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clear() {
    localStorage.removeItem(TOKEN_KEY);
  },
};
