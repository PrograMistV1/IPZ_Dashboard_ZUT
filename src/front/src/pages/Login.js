import React, {useState} from "react";
import "../styles/Login.css";
import {useAuth} from "../hooks/useAuth";

function Login({onLogin, onRegister}) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const {login, error} = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const result = await login(username, password);
        setIsLoading(false);

        if (result) {
            onLogin(result);
        }
    };

    return (
        <div className="auth-box">
            <h2>Login</h2>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isLoading}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                />

                <button type="submit" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                </button>
            </form>

            {error && <p className="error">{error}</p>}

            <p>
                Don't have an account?{" "}
                <span className="link" onClick={onRegister}>
          Register
        </span>
            </p>
        </div>
    );
}

export default Login;

