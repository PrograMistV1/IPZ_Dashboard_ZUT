export const tokenManager = {
    setToken(token) {
        localStorage.setItem("token", token);
    },

    getToken() {
        return localStorage.getItem("token");
    },

    removeToken() {
        localStorage.removeItem("token");
    },

    hasToken() {
        return !!this.getToken();
    },
};
