import React, {useEffect} from "react";
import {BrowserRouter, Navigate, Route, Routes, useNavigate} from "react-router-dom";
import {AuthProvider, useAuth} from "../auth/AuthContext";

import AppLayout from "./AppLayout";
import {DashboardProvider} from "../components/dashboard/DashboardContext";

import Dashboard from "../components/dashboard/Dashboard";
import LoginPage from "../auth/Login";
import RegisterPage from "../auth/Register";
import LoginHistoryPage from "../pages/LoginHistoryPage";

function AuthGate() {
    const {user} = useAuth();
    const navigate = useNavigate();

    console.log("User:", user);

    useEffect(() => {
        if (user && window.location.pathname.startsWith("/auth")) {
            navigate("/", {replace: true});
        }
    }, [user, navigate]);

    if (!user) {
        return (
            <Routes>
                <Route path="/auth/login" element={<LoginPage/>}/>
                <Route path="/auth/register" element={<RegisterPage/>}/>
                <Route path="*" element={<Navigate to="/auth/login" replace/>}/>
            </Routes>
        );
    }

    return (
        <DashboardProvider>
            <Routes>
                <Route element={<AppLayout/>}>
                    <Route path="/" element={<Dashboard/>}/>
                    <Route path="/login-history" element={<LoginHistoryPage/>}/>
                </Route>
            </Routes>
        </DashboardProvider>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AuthGate/>
            </BrowserRouter>
        </AuthProvider>
    );
}
