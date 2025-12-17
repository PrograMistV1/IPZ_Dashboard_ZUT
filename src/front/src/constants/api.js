export const API_BASE_URL = "http://127.0.0.1:8000";

export const API_ENDPOINTS = {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGIN_HISTORY: "/auth/login-history",
    ACCOUNT_INFO: "/auth/me",
    RATES: "/rates",
};

export const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "CHF", "JPY"];

export const ERROR_MESSAGES = {
    INVALID_CREDENTIALS: "Invalid username or password",
    REGISTRATION_FAILED: "Registration failed",
    CONNECTION_ERROR: "Backend connection error",
    SERVER_ERROR: "Server error",
    SESSION_ERROR: "Session invalid",
    UNAUTHORIZED: "Unauthorized operation",
    FETCH_HISTORY_ERROR: "Failed to fetch login history",
    FETCH_ACCOUNT_ERROR: "Failed to fetch account information",
};
