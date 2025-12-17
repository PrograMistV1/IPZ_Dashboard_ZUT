import {API_BASE_URL} from "../constants/api";
import {tokenManager} from "./tokenManager";

export const apiClient = {
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        return fetch(url, options);
    },

    async post(endpoint, data, token = null) {
        const options = {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(data),
        };

        if (token) {
            options.headers.Authorization = `Bearer ${token}`;
        }

        return this.request(endpoint, options);
    },

    async get(endpoint, token = null) {
        const options = {
            method: "GET",
        };

        if (token) {
            options.headers = {
                Authorization: `Bearer ${token}`,
            };
        }

        return this.request(endpoint, options);
    },

    async handleResponse(response, errorMessage) {
        if (response.status === 401) {
            tokenManager.removeToken();
            return {error: "Nieprawidłowa sesja", unauthorized: true};
        }

        if (!response.ok) {
            try {
                const err = await response.json();
                return {error: err.detail || errorMessage};
            } catch {
                return {error: errorMessage};
            }
        }

        try {
            return await response.json();
        } catch {
            return {error: errorMessage};
        }
    },
};
