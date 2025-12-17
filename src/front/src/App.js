import React, {useEffect, useState} from "react";
import "./styles/App.css";
import Login from "./pages/Login";
import Register from "./pages/Register";
import {useRates} from "./hooks/useRates";
import {useUserData} from "./hooks/useUserData";
import {tokenManager} from "./utils/tokenManager";

function App() {
    const [currency, setCurrency] = useState("USD");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [user, setUser] = useState(null);
    const [mode, setMode] = useState("login");
    const [showHistory, setShowHistory] = useState(false);
    const [appError, setAppError] = useState("");

    const {rates, loading, error: ratesError, fetchRates} = useRates();
    const {
        accountInfo,
        loginHistory,
        error: userDataError,
        fetchAccountInfo,
        fetchLoginHistory
    } = useUserData(handleLogoutRequired);

    useEffect(() => {
        if (tokenManager.hasToken()) {
            setUser({logged: true});
        }
    }, []);

    function handleLogoutRequired() {
        setUser(null);
        tokenManager.removeToken();
        setAppError("Session expired, please login again");
    }

    if (!user) {
        if (mode === "login") {
            return <Login onLogin={setUser} onRegister={() => setMode("register")}/>;
        }
        return <Register onBackToLogin={() => setMode("login")}/>;
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        setAppError("");
        fetchRates(currency, dateFrom, dateTo);
    };

    const handleLogout = () => {
        tokenManager.removeToken();
        setUser(null);
    };

    const handleFetchHistory = async () => {
        if (showHistory) {
            setShowHistory(false);
            return;
        }
        await fetchLoginHistory();
        setShowHistory(true);
    };

    const handleFetchAccount = async () => {
        await fetchAccountInfo();
    };

    const displayError = appError || ratesError || userDataError;

    return (
        <div className="container">
            <div className="header-buttons">
                <button className="history-btn" onClick={handleFetchHistory}>
                    Login History
                </button>
                <button onClick={handleFetchAccount}>
                    Account Info
                </button>
                <button className="logout-btn" onClick={handleLogout}>
                    Logout
                </button>
            </div>

            <form onSubmit={handleSubmit} className="form">
                <label>Currency:</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CHF">CHF</option>
                    <option value="JPY">JPY</option>
                </select>

                <label>From Date:</label>
                <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    required
                />

                <label>To Date:</label>
                <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    required
                />

                <button type="submit" disabled={loading}>
                    {loading ? "Fetching..." : "Fetch"}
                </button>
            </form>

            {loading && <p className="loading">Loading...</p>}

            {displayError && <p className="error">{displayError}</p>}

            {accountInfo && (
                <div className="account-info">
                    <h3>Account Info</h3>
                    <p>
                        <b>Username:</b> {accountInfo.login}
                    </p>
                </div>
            )}

            {showHistory && (
                <div className="history">
                    <h3>Login History</h3>
                    {loginHistory.length === 0 ? (
                        <p>No data</p>
                    ) : (
                        loginHistory.map((h, idx) => (
                            <div key={idx} className="history-item">
                                <b>{new Date(h.login_time).toLocaleString()}</b>
                                <br/>
                                IP: {h.ip_address}
                                <br/>
                                {h.user_agent}
                                <hr/>
                            </div>
                        ))
                    )}
                </div>
            )}

            {rates.length > 0 && (
                <table>
                    <thead>
                    <tr>
                        <th>Date</th>
                        <th>Rate</th>
                    </tr>
                    </thead>
                    <tbody>
                    {rates.map((item, idx) => (
                        <tr key={idx}>
                            <td>{item.date}</td>
                            <td>{item.rate}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default App;

