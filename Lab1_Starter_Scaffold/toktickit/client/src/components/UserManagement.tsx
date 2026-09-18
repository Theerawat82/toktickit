import React, { useState, useEffect } from "react";
import { apiFetch } from "../api";
const ZEN = {
  primary: "#006B3C",
  secondary: "#0B7A46",
  tint: "#EAF6EF",
  border: "#C2E0D1",
  paleBg: "#F4F9F6",
  pageBg: "#FAFCFB",
  white: "#FFFFFF",
  neutral: "#4B5563",
};

type Role = "Requester" | "IT_Staff" | "Administrator";

interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Requester" as Role,
    password: "",
    isActive: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset Password State
  const [resetPasswordValue, setResetPasswordValue] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (search) query.append("search", search);
      if (roleFilter) query.append("role", roleFilter);
      
      const res = await apiFetch(`/api/admin/users?${query.toString()}`);
      if (!res.ok) {
        if (res.status === 403) throw new Error("Forbidden: You do not have permission to access this page.");
        throw new Error("Failed to load users");
      }
      const json = await res.json();
      setUsers(json.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        role: formData.role === "IT_Staff" ? "IT Staff" : formData.role
      };
      
      const res = await apiFetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");
      
      setFormSuccess("User created successfully");
      fetchUsers();
      setTimeout(() => {
        setShowCreateModal(false);
        setFormSuccess(null);
      }, 1500);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role === "IT_Staff" ? "IT Staff" : formData.role,
        isActive: formData.isActive,
      };
      const res = await apiFetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update user");
      
      setFormSuccess("User updated successfully");
      fetchUsers();
      setTimeout(() => {
        setShowEditModal(false);
        setFormSuccess(null);
      }, 1500);
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) return;
    setFormError(null);
    setFormSuccess(null);
    try {
      const res = await apiFetch(`/api/admin/users/${selectedUser.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newInitialPassword: resetPasswordValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");
      
      setFormSuccess("Password reset successfully");
      setResetPasswordValue("");
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const openCreateModal = () => {
    setFormData({ name: "", email: "", role: "Requester", password: "", isActive: true });
    setFormError(null);
    setFormSuccess(null);
    setShowCreateModal(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      password: "",
      isActive: user.isActive,
    });
    setResetPasswordValue("");
    setFormError(null);
    setFormSuccess(null);
    setShowEditModal(true);
  };

  if (error) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Administrator User Management</h2>
        <button className="btn text-white fw-bold" style={{ backgroundColor: ZEN.primary }} onClick={openCreateModal}>
          + Create User
        </button>
      </div>

      <div className="card shadow-sm border-0 mb-4" style={{ backgroundColor: ZEN.tint }}>
        <div className="card-body d-flex gap-3">
          <input
            type="text"
            className="form-control"
            placeholder="Search by Name or Email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="form-select" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="Requester">Requester</option>
            <option value="IT_Staff">IT Staff</option>
            <option value="Administrator">Administrator</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">Loading users...</div>
      ) : (
        <div className="card shadow-sm border-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead style={{ backgroundColor: ZEN.tint }}>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">No users found.</td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id}>
                      <td className="fw-semibold">{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className="badge" style={{ backgroundColor: ZEN.secondary }}>
                          {u.role.replace("_", " ")}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.isActive ? "bg-success" : "bg-secondary"}`}>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => openEditModal(u)}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals using simple positioned divs for this example */}
      {(showCreateModal || showEditModal) && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title">{showCreateModal ? "Create User" : "Edit User"}</h5>
                <button type="button" className="btn-close" onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}></button>
              </div>
              
              <div className="modal-body pt-0">
                {formError && <div className="alert alert-danger py-2">{formError}</div>}
                {formSuccess && <div className="alert alert-success py-2">{formSuccess}</div>}

                <form onSubmit={showCreateModal ? handleCreateSubmit : handleEditSubmit}>
                  <div className="mb-3">
                    <label htmlFor="userName" className="form-label fw-bold">Name</label>
                    <input id="userName" type="text" required className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="userEmail" className="form-label fw-bold">Email</label>
                    <input id="userEmail" type="email" required className="form-control" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="userRole" className="form-label fw-bold">Role</label>
                    <select id="userRole" className="form-select" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as Role})}>
                      <option value="Requester">Requester</option>
                      <option value="IT_Staff">IT Staff</option>
                      <option value="Administrator">Administrator</option>
                    </select>
                  </div>
                  
                  {showCreateModal && (
                    <div className="mb-3">
                      <label htmlFor="userPassword" className="form-label fw-bold">Initial Password</label>
                      <input id="userPassword" type="password" required className="form-control" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                    </div>
                  )}

                  <div className="mb-4 form-check form-switch">
                    <input className="form-check-input" type="checkbox" role="switch" id="activeSwitch" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                    <label className="form-check-label fw-bold" htmlFor="activeSwitch">Active Account</label>
                  </div>

                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}>Cancel</button>
                    <button type="submit" className="btn text-white" style={{ backgroundColor: ZEN.primary }} disabled={submitting}>
                      {submitting ? "Saving..." : "Save User"}
                    </button>
                  </div>
                </form>

                {showEditModal && (
                  <>
                    <hr className="my-4" />
                    <h6 className="fw-bold mb-3">Danger Zone</h6>
                    
                    <div className="mb-3 border p-3 rounded" style={{ backgroundColor: "#fff5f5", borderColor: "#f5c6cb" }}>
                      <label className="form-label fw-bold text-danger">Reset Password</label>
                      <div className="input-group">
                        <input type="password" placeholder="New Password" className="form-control" value={resetPasswordValue} onChange={e => setResetPasswordValue(e.target.value)} />
                        <button type="button" className="btn btn-danger" onClick={handleResetPassword}>Reset</button>
                      </div>
                      <small className="text-muted d-block mt-1">
                        Must contain at least 8 chars, one uppercase, one lowercase, one number, and one symbol. User will be forced to change this upon next login.
                      </small>
                    </div>

                    <div className="mb-3 border p-3 rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: "#fff5f5", borderColor: "#f5c6cb" }}>
                      <div>
                        <span className="fw-bold text-danger d-block">Deactivate User</span>
                        <small className="text-muted">Prevents the user from logging in.</small>
                      </div>
                      <button type="button" className="btn btn-outline-danger" onClick={async (e) => { 
                        e.preventDefault();
                        if (!selectedUser) return;
                        setFormError(null);
                        setFormSuccess(null);
                        setSubmitting(true);
                        try {
                          const payload = {
                            name: formData.name,
                            email: formData.email,
                            role: formData.role === "IT_Staff" ? "IT Staff" : formData.role,
                            isActive: false,
                          };
                          const res = await apiFetch(`/api/admin/users/${selectedUser.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload),
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || "Failed to update user");
                          
                          setFormSuccess("User updated successfully");
                          fetchUsers();
                          setTimeout(() => {
                            setShowEditModal(false);
                            setFormSuccess(null);
                          }, 1500);
                        } catch (err: any) {
                          setFormError(err.message);
                        } finally {
                          setSubmitting(false);
                        }
                      }}>
                        Deactivate
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
