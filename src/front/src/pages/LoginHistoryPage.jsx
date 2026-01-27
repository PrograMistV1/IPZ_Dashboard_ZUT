import React, {useEffect, useState} from "react";
import {apiFetch} from "../services/api";
import {useNavigate} from "react-router-dom";
import "../styles/auth.css";

export default function LoginHistoryPage() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        apiFetch("/auth/login-history")
            .then(setHistory)
            .catch(() => setError("Failed to load login history"))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="auth-wrapper">
            <div
                className="auth-box"
                style={{width: "100%", maxWidth: 900}}
            >
                <button
                    onClick={() => navigate("/")}
                    style={{marginBottom: 16}}
                >
                    ← Back to dashboard
                </button>

                <h2>Login history</h2>

                {loading && <p>Loading...</p>}
                {error && <p className="auth-error">{error}</p>}

                {!loading && !error && (
                    <table>
                        <thead>
                        <tr>
                            <th>Date</th>
                            <th>IP</th>
                            <th>User agent</th>
                        </tr>
                        </thead>
                        <tbody>
                        {history.map((h, i) => (
                            <tr key={i}>
                                <td>
                                    {new Date(h.login_time).toLocaleString()}
                                </td>
                                <td>{h.ip_address || "-"}</td>
                                <td>{h.user_agent || "-"}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
