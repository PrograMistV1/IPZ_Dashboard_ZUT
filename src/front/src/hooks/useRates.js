import {useCallback, useState} from "react";
import {apiClient} from "../utils/apiClient";
import {API_ENDPOINTS, ERROR_MESSAGES} from "../constants/api";

export const useRates = () => {
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchRates = useCallback(async (currency, dateFrom, dateTo) => {
        setError("");
        setRates([]);
        setLoading(true);

        try {
            const response = await apiClient.post(API_ENDPOINTS.RATES, {
                currency,
                date_from: dateFrom,
                date_to: dateTo,
            });

            const data = await apiClient.handleResponse(
                response,
                ERROR_MESSAGES.SERVER_ERROR
            );

            if (data.error) {
                setError(data.error);
            } else {
                setRates(data.rates || []);
            }
        } catch {
            setError(ERROR_MESSAGES.CONNECTION_ERROR);
        } finally {
            setLoading(false);
        }
    }, []);

    return {rates, loading, error, fetchRates, setError};
};

