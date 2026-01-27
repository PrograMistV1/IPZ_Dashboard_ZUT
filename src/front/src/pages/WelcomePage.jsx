import React from "react";
import {useAuth} from "./auth/AuthContext";
import "../styles/welcome.css";

export default function WelcomePage() {
    const {user} = useAuth();

    return (<div className="welcome-container">
        <div className="welcome-content">
            <h1>Welcome! 👋</h1>

            {user && (<p className="welcome-greeting">Hello, <strong>{user.username}</strong>!</p>)}
        </div>
    </div>);
}
