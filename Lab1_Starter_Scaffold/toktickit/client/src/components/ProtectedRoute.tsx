import React, { ReactNode, useEffect } from "react";
import { useAuth } from "../context/AuthContext.js";
import Login from "./Login.js";
import ChangePassword from "./ChangePassword.js";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && user && !user.mustChangePassword) {
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to default view if role not allowed
        window.location.hash = "";
      }
    }
  }, [user, loading, allowedRoles]);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-5" style={{ maxWidth: 640 }}>
        <h1 className="h3 mb-4 text-center">
          TokTickIT <span className="text-success">IT Service Desk</span>
        </h1>
        <Login />
      </div>
    );
  }

  if (user.mustChangePassword) {
    return (
      <div className="container py-5" style={{ maxWidth: 640 }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 mb-1">
              TokTickIT <span className="text-success">IT Service Desk</span>
            </h1>
            <p className="text-muted mb-0">IT Support Request System</p>
          </div>
          <div className="text-end">
            <div className="fw-bold">{user.name}</div>
            <div className="small text-muted mb-2">{user.role}</div>
            <button className="btn btn-sm btn-outline-danger" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
        <ChangePassword />
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
