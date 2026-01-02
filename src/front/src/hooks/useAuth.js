import {useCallback, useState} from "react";
import {apiClient} from "../utils/apiClient";
import {tokenManager} from "../utils/tokenManager";
import {API_ENDPOINTS, ERROR_MESSAGES} from "../constants/api";

export const useAuth = () => {
    const [error, setError] = useState("");

    const login = useCallback(async (username, password) => {
        setError("");
        try {
            const response = await apiClient.post(API_ENDPOINTS.LOGIN, {
                username,
                password,
            });

            const data = await apiClient.handleResponse(
                response,
                ERROR_MESSAGES.INVALID_CREDENTIALS
            );

            if (data.error) {
                setError(data.error);
                return null;
            }

            tokenManager.setToken(data.access_token);
            return data;
        } catch {
            setError(ERROR_MESSAGES.CONNECTION_ERROR);
            return null;
        }
    }, []);

    const register = useCallback(async (username, email, password) => {
        setError("");
        try {
            const response = await apiClient.post(API_ENDPOINTS.REGISTER, {
                username,
                email,
                password,
            });

            const data = await apiClient.handleResponse(
                response,
                ERROR_MESSAGES.REGISTRATION_FAILED
            );

            if (data.error) {
                setError(data.error);
                return false;
            }

            return true;
        } catch {
            setError(ERROR_MESSAGES.CONNECTION_ERROR);
            return false;
        }
    }, []);

    const logout = useCallback(() => {
        tokenManager.removeToken();
        setError("");
    }, []);

    return {login, register, logout, error, setError};
};
