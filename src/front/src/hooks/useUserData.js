import {useCallback, useState} from "react";
import {apiClient} from "../utils/apiClient";
import {tokenManager} from "../utils/tokenManager";
import {API_ENDPOINTS, ERROR_MESSAGES} from "../constants/api";

export const useUserData = (onLogoutRequired) => {
    const [accountInfo, setAccountInfo] = useState(null);
    const [loginHistory, setLoginHistory] = useState([]);
    const [error, setError] = useState("");

    const fetchAccountInfo = useCallback(async () => {
        setError("");
        try {
            const token = tokenManager.getToken();
            const response = await apiClient.get(API_ENDPOINTS.ACCOUNT_INFO, token);

            const data = await apiClient.handleResponse(
                response,
                ERROR_MESSAGES.FETCH_ACCOUNT_ERROR
            );

            if (data.unauthorized) {
                onLogoutRequired?.();
                return;
            }

            if (data.error) {
                setError(data.error);
            } else {
                setAccountInfo(data);
            }
        } catch {
            setError(ERROR_MESSAGES.FETCH_ACCOUNT_ERROR);
        }
    }, [onLogoutRequired]);

    const fetchLoginHistory = useCallback(async () => {
        setError("");
        try {
            const token = tokenManager.getToken();
            const response = await apiClient.get(
                API_ENDPOINTS.LOGIN_HISTORY,
                token
            );

            const data = await apiClient.handleResponse(
                response,
                ERROR_MESSAGES.FETCH_HISTORY_ERROR
            );

            if (data.unauthorized) {
                onLogoutRequired?.();
                return;
            }

            if (data.error) {
                setError(data.error);
            } else {
                setLoginHistory(Array.isArray(data) ? data : []);
            }
        } catch {
            setError(ERROR_MESSAGES.FETCH_HISTORY_ERROR);
        }
    }, [onLogoutRequired]);

    return {
        accountInfo,
        loginHistory,
        error,
        setError,
        fetchAccountInfo,
        fetchLoginHistory,
    };
};

