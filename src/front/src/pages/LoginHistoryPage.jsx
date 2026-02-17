import React, {useEffect, useState} from "react";
import {apiFetch} from "../services/api";
import {useNavigate} from "react-router-dom";
import "../styles/auth.css";
import "../styles/admin.css";

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
        <div className="admin-page">
            <h2>Login history</h2>

            <div style={{marginTop: 12}}>
                <button className="back-btn" onClick={() => navigate("/")} style={{marginBottom: 12}}>Back to dashboard</button>

                {loading && <p>Loading...</p>}
                {error && <p className="auth-error">{error}</p>}

                {!loading && !error && (
                    <table className="admin-table">
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
