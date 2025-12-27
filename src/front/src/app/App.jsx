import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "../auth/AuthContext";

import AppLayout from "./AppLayout";
import Dashboard from "../components/dashboard/Dashboard";
import LoginModal from "../auth/LoginModal";
import RegisterModal from "../auth/RegisterModal";
import LoginHistoryPage from "../pages/LoginHistoryPage";

function AuthGate() {
  const { user, mode } = useAuth();

  if (!user) {
    return mode === "login"
      ? <LoginModal />
      : <RegisterModal />;
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route
          path="/login-history"
          element={<LoginHistoryPage />}
        />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AuthGate />
      </BrowserRouter>
    </AuthProvider>
  );
}
