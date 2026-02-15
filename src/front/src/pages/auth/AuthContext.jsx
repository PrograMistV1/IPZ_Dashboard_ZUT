import React, {createContext, useCallback, useContext, useEffect, useState} from "react";
import {apiFetch} from "../../services/api";
import {tokenManager} from "../../services/tokenManager";

const AuthContext = createContext(null);

/** @typedef {{access_token: string, user_id: number, username: string, role: string, isEnabled: boolean}} LoginResponse */
/** @typedef {{user_id: number, username: string, role: string, isEnabled: boolean}} UserMeResponse */

export function AuthProvider({children}) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const token = tokenManager.get();
                if (token) {
                    try {
                        /** @type {UserMeResponse} */
                        const userData = await apiFetch("/auth/me");
                        setUser({
                            id: userData.user_id,
                            username: userData.username,
                            role: userData.role,
                            isEnabled: userData.isEnabled,
                            logged: true,
                        });
                    } catch (err) {
                        console.error("Failed to load user data:", err);
                        tokenManager.clear();
                        setUser(null);
                    }
                }
            } catch (err) {
                console.error("Auth initialization error:", err);
                tokenManager.clear();
            } finally {
                setLoading(false);
            }
        };

        initializeAuth().then(() => {
        });
    }, []);

    const login = useCallback(async (username, password) => {
        try {

            /** @type {LoginResponse} */
            const data = await apiFetch("/auth/login", {
                method: "POST", body: JSON.stringify({username, password}),
            });

            if (!data?.access_token) {
                console.error("Login error(NO_TOKEN): No access token in response");
                return false;
            }

            tokenManager.set(data.access_token);
            setUser({
                id: data.user_id,
                username: data.username,
                role: data.role,
                isEnabled: data.isEnabled,
                logged: true,
            });
            return true;
        } catch (err) {
            console.error("Login error:", err);
            return false;
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await apiFetch("/auth/logout", {method: "POST"});
        } catch (err) {
            console.error("Logout error:", err);
        } finally {
            tokenManager.clear();
            setUser(null);
        }
    }, []);

    const value = {
        user, loading, login, logout,
    };

    return (<AuthContext.Provider value={value}>
        {children}
    </AuthContext.Provider>);
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
}