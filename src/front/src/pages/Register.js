import React, {useState} from "react";
import "../styles/Login.css";
import {useAuth} from "../hooks/useAuth";

function Register({onBackToLogin}) {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const {register, error, setError} = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");
        setIsLoading(true);

        const success = await register(username, email, password);
        setIsLoading(false);

        if (success) {
            setSuccessMessage("Rejestracja udana! Przejdź do logowania.");
            setTimeout(onBackToLogin, 2000);
        }
    };

    return (
        <div className="auth-box">
            <h2>Register</h2>

            <form onSubmit={handleSubmit}>
                <input
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isLoading}
                />

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    {isLoading ? "Registering..." : "Register"}
                </button>
            </form>

            {error && <p className="error">{error}</p>}
            {successMessage && <p className="success">{successMessage}</p>}

            <p>
                Already have an account?{" "}
                <span className="link" onClick={onBackToLogin}>
          Login
        </span>
            </p>
        </div>
    );
}

export default Register;

