import React, {useState} from "react";
import {useAuth} from "./AuthContext";
import "../../styles/auth.css";
import {useNavigate} from "react-router-dom";

export default function Login() {
    const {login} = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            await login(username, password);
        } catch {
            setError("Invalid username or password");
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

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

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
