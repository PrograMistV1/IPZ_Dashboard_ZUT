import React from "react";
import {useAuth} from "./auth/AuthContext";
import "../styles/welcome.css";

export default function WelcomePage() {
    const {user} = useAuth();
    return (
        <div className="welcome-container">
            <div className="welcome-content">
                {user ? (
                    <h1>{`Welcome, ${user.username}!`}</h1>
                ) : (
                    <h1>Welcome!</h1>
                )}
            </div>
        </div>
    );
}
