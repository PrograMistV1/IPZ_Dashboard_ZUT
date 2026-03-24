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
            const res = await fetch("http://127.0.0.1:8000/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            let data = null;
            try { data = await res.json(); } catch (e) { data = null; }

            if (!res.ok) {
                let msg = "Invalid username or password";
                const detail = data?.detail;
                if (detail) {
                    if (typeof detail === 'string') {
                        msg = detail;
                    } else if (typeof detail === 'object') {
                        const d = detail;
                        if (d.locked_until) {
                            try {
                                const dt = new Date(d.locked_until);
                                const formatted = dt.toLocaleString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                                msg = d.message ? `${d.message} ${formatted}` : `Account locked until ${formatted}`;
                            } catch (e) {
                                msg = d.message || JSON.stringify(d);
                            }
                        } else {
                            msg = d.message || JSON.stringify(d);
                        }
                    } else {
                        msg = JSON.stringify(detail);
                    }
                }
                return { success: false, message: msg };
            }

            const token = data?.access_token;
            if (!token) {
                console.error("Login error(NO_TOKEN): No access token in response");
                return { success: false, message: "Login failed" };
            }

            tokenManager.set(token);
            setUser({
                id: data.user_id,
                username: data.username,
                role: data.role,
                isEnabled: data.isEnabled,
                logged: true,
            });
            return { success: true };
        } catch (err) {
            console.error("Login error:", err);
            return { success: false, message: "Network or server error" };
        }
    }, []);

    const logout = useCallback(async (skipServer = false) => {
        try {
            if (!skipServer) {
                await apiFetch("/auth/logout", {method: "POST"});
            }
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