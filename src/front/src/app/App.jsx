import React, {useEffect} from "react";
import {BrowserRouter, Navigate, Route, Routes, useNavigate} from "react-router-dom";
import {AuthProvider, useAuth} from "../pages/auth/AuthContext";

import AppLayout from "./AppLayout";
import {DashboardProvider} from "../components/dashboard/DashboardContext";

import Dashboard from "../components/dashboard/Dashboard";
import LoginPage from "../pages/auth/Login";
import RegisterPage from "../pages/auth/Register";
import LoginHistoryPage from "../pages/LoginHistoryPage";
import WelcomePage from "../pages/WelcomePage";
import EconomyDashboard from "../components/economy/EconomyDashboard";
import WeatherDashboard from "../components/weather/WeatherDashboard";

import "../styles/global.css";

function AuthGate() {
    const {user, loading} = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && window.location.pathname.startsWith("/auth")) {
            navigate("/", {replace: true});
        }
    }, [user, navigate]);

    if (loading) {
        return (<div className="loading-container">Loading...</div>);
    }

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
                    <Route path="*" element={<WelcomePage/>}/>
                    <Route path="/dashboard/:id" element={<Dashboard/>}/>
                    <Route path="/economy" element={<EconomyDashboard/>}/>
                    <Route path="/weather" element={<WeatherDashboard/>}/>
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
