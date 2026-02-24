import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../../pages/auth/AuthContext";
import "../../styles/layout.css";

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div className="user-menu">
      <div
        className="user-avatar"
        onClick={() => setOpen((v) => !v)}
      >
        {user.username?.[0]?.toUpperCase() || "U"}
      </div>

      {open && (
        <div className="user-dropdown">
          {user?.role === "ADMIN" && (
            <button
              onClick={() => {
                setOpen(false);
                navigate("/admin");
              }}
            >
              Admin Panel
            </button>
          )}

          <button
            onClick={() => {
              setOpen(false);
              navigate("/login-history");
            }}
          >
            Login history
          </button>

          <button className="danger" onClick={logout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
