import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { apiFetch } from "../services/api";
import "./auth.css";

export default function RegisterModal() {
  const { setMode } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await apiFetch("/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json", 
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      setMode("login");
    } catch (err) {
      setError("Registration failed");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-box">
        <h2>Register</h2>

        <form onSubmit={submit}>
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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

          <button type="submit">Register</button>
        </form>

        <div className="auth-footer">
          <span onClick={() => setMode("login")}>
            ← Back to login
          </span>
        </div>
      </div>
    </div>
  );
}
