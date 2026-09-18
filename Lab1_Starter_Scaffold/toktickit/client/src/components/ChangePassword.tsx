import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import { apiFetch } from "../api.js";

export default function ChangePassword() {
  const { user, updateUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        if (user) {
          updateUser({ ...user, mustChangePassword: false });
        }
      } else {
        if (data.errors && data.errors.length > 0) {
          setError(data.errors[0].message);
        } else {
          setError(data.error || "Failed to change password.");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow-sm mb-4" style={{ maxWidth: 500, margin: "0 auto" }}>
      <div className="card-header bg-warning text-dark">
        <h5 className="mb-0">Change Your Password</h5>
      </div>
      <div className="card-body">
        {user?.mustChangePassword && (
          <div className="alert alert-warning">
            You must change your password before you can access the system.
          </div>
        )}

        {success ? (
          <div className="alert alert-success">
            Password changed successfully! You can now continue.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-danger">{error}</div>}
            
            <div className="mb-3">
              <label className="form-label" htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                className="form-control"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label" htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                className="form-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
              <div className="form-text">
                Must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character.
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-warning w-100" 
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
