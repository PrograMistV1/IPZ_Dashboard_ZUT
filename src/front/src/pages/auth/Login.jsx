import React, {useState} from "react";
import {useAuth} from "./AuthContext";
import "../../styles/auth.css";
import {useNavigate} from "react-router-dom";

export default function Login() {
    const {login} = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setError("");

        const result = await login(username, password);
        if (result && result.success) {
            navigate("/", {replace: true});
        } else {
            setError((result && result.message) ? result.message : "Invalid username or password");
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-box">
                <h2>Login</h2>

                <form onSubmit={submit}>
                    <input
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />

                    <div className="password-field">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className="toggle-password"
                            onClick={() => setShowPassword((s) => !s)}
                            aria-pressed={showPassword}
                            title={showPassword ? 'Hide password' : 'Show password'}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <path d="M12 5C7 5 2.73 8.11 1 12C2.73 15.89 7 19 12 19C17 19 21.27 15.89 23 12C21.27 8.11 17 5 12 5Z" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                <circle cx="12" cy="12" r="3" stroke="#0f172a" strokeWidth="1.2"/>
                            </svg>
                        </button>
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <button type="submit">Login</button>
                </form>

                <div className="auth-footer">
                    No account?{" "}
                    <span onClick={() => navigate("/auth/register")}> Register</span>
                </div>
            </div>
        </div>
    );
}
