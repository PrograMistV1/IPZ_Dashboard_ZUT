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
  const [fieldErrors, setFieldErrors] = useState({});

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

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

  return (
    <div className="auth-wrapper">
      <div className="auth-box">
        <h2>Register</h2>

        <form onSubmit={submit}>
          <div>
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setFieldErrors((prev) => ({ ...prev, username: "" }));
              }}
              className={fieldErrors.username ? "input-error" : ""}
              required
            />
            {fieldErrors.username && (
              <div className="field-error">{fieldErrors.username}</div>
            )}
          </div>

          <div>
            <input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((prev) => ({ ...prev, email: "" }));
              }}
              className={fieldErrors.email ? "input-error" : ""}
              required
            />
            {fieldErrors.email && (
              <div className="field-error">{fieldErrors.email}</div>
            )}
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((prev) => ({ ...prev, password: "" }));
              }}
              className={fieldErrors.password ? "input-error" : ""}
              required
            />
            {fieldErrors.password && (
              <div className="field-error">{fieldErrors.password}</div>
            )}
          </div>

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
