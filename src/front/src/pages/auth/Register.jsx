import React, {useState} from "react";
import {apiFetch} from "../../services/api";
import "../../styles/auth.css";
import {useNavigate} from "react-router-dom";

export default function Register() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setFieldErrors({});

        try {
            await apiFetch("/auth/register", {
                method: "POST", headers: {
                    "Content-Type": "application/json",
                }, body: JSON.stringify({
                    username, email, password,
                }),
            });

            navigate("/auth/login");
        } catch (err) {
            if (err.status === 422 && Array.isArray(err.details)) {
                const errors = {};

                err.details.forEach((error) => {
                    const field = error.loc?.[1];
                    const message = error.ctx?.reason || error.msg || "Invalid value";
                    if (field) {
                        errors[field] = message;
                    }
                });

                if (Object.keys(errors).length > 0) {
                    setFieldErrors(errors);
                    return;
                }
            }

            setError(err.message || "Registration failed");
        }
    };

    return (<div className="auth-wrapper">
        <div className="auth-box">
            <h2>Register</h2>

            <form onSubmit={submit}>
                <div>
                    <input
                        placeholder="Username"
                        value={username}
                        onChange={(e) => {
                            setUsername(e.target.value);
                            setFieldErrors((prev) => ({...prev, username: ""}));
                        }}
                        className={fieldErrors.username ? "input-error" : ""}
                        required
                    />
                    {fieldErrors.username && (<div className="field-error">{fieldErrors.username}</div>)}
                </div>

                <div>
                    <input
                        placeholder="Email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setFieldErrors((prev) => ({...prev, email: ""}));
                        }}
                        className={fieldErrors.email ? "input-error" : ""}
                        required
                    />
                    {fieldErrors.email && (<div className="field-error">{fieldErrors.email}</div>)}
                </div>

                <div className="password-field">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setFieldErrors((prev) => ({...prev, password: ""}));
                        }}
                        className={fieldErrors.password ? "input-error" : ""}
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
                    {fieldErrors.password && (<div className="field-error">{fieldErrors.password}</div>)}
                </div>

                {error && <div className="auth-error">{error}</div>}

                <button type="submit">Register</button>
            </form>

            <div className="auth-footer">
                <span onClick={() => navigate("/auth/login")}> ← Back to login</span>
            </div>
        </div>
    </div>);
}
