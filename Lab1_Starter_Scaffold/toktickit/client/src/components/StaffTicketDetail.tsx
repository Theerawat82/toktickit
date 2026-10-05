import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext.js";
import { apiFetch } from "../api.js";
import AttachmentSection from "./AttachmentSection.js";
import ActionsTaken from "./ActionsTaken.js";

import { ZEN, priorityBadgeStyle, statusBadgeStyle } from '../theme.js';





const roleBadgeStyle: Record<string, { bg: string; color: string }> = {
  Requester: { bg: ZEN.paleBg, color: ZEN.primary },
  "IT Staff": { bg: "#EFF8FF", color: "#175CD3" },
  Administrator: { bg: "#FDF4FF", color: "#6941C6" },
  IT_Staff: { bg: "#EFF8FF", color: "#175CD3" },
};

function Badge({ text, map }: { text: string; map: Record<string, { bg: string; color: string }> }) {
  const key = text.replace(/\s+/g, "_");
  const style = map[key] ?? map[text] ?? { bg: "#F2F4F7", color: "#344054" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 12px",
        borderRadius: 16,
        fontSize: 13,
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.color,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function displayRole(role: string) {
  if (!role) return role;
  return role.replace(/_/g, " ");
}

export default function StaffTicketDetail({ ticketId }: { ticketId: number }) {
  const { user } = useAuth();

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [activeTab, setActiveTab] = useState("comments");

  // Related data
  const [comments, setComments] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);

  // Inputs
  const [commentContent, setCommentContent] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [noteLoading, setNoteLoading] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [noteError, setNoteError] = useState("");

  // Action status
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const loadTicket = useCallback(async () => {
  if (!user) return;
  setErrorMsg("");
  try {
    const res = await apiFetch(`/api/tickets/${ticketId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch ticket detail");
    setTicket(data);
  } catch (err: any) {
    setErrorMsg(err.message || "Unknown error");
  } finally {
    setLoading(false);
  }
}, [ticketId, user?.id]);

  const loadComments = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/tickets/${ticketId}/comments`);
      if (res.ok) setComments(await res.json());
    } catch (e) {}
  }, [ticketId]);

  const loadNotes = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/tickets/${ticketId}/internal-notes`);
      if (res.ok) setNotes(await res.json());
    } catch (e) {}
  }, [ticketId]);

  const loadStaff = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/users/staff`);
      if (res.ok) setStaffUsers(await res.json());
    } catch (e) {}
  }, []);

  useEffect(() => {
    loadTicket();
    loadComments();
    loadNotes();
    loadStaff();
  }, [loadTicket, loadComments, loadNotes, loadStaff]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError("");
    if (!commentContent.trim()) {
      setCommentError("Comment cannot be empty.");
      return;
    }
    setCommentLoading(true);
    try {
      const res = await apiFetch(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: commentContent.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post comment");
      setCommentContent("");
      await loadComments();
    } catch (err: any) {
      setCommentError(err.message || "Failed to post comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setNoteError("");
    if (!noteContent.trim()) {
      setNoteError("Note cannot be empty.");
      return;
    }
    setNoteLoading(true);
    try {
      const res = await apiFetch(`/api/tickets/${ticketId}/internal-notes`, {
        method: "POST",
        body: JSON.stringify({ content: noteContent.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post internal note");
      setNoteContent("");
      await loadNotes();
    } catch (err: any) {
      setNoteError(err.message || "Failed to post internal note");
    } finally {
      setNoteLoading(false);
    }
  };

  const handleAction = async (endpoint: string, payload: any, successMsg: string) => {
    setActionError("");
    setActionSuccess("");
    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/tickets/${ticketId}/${endpoint}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.status === 409) {
        setTicket(data.currentServerRow);
        throw new Error("This ticket was updated elsewhere — refreshing to the latest state");
      }
      if (!res.ok) throw new Error(data.error || `Failed to update ${endpoint}`);
      setActionSuccess(successMsg);
      await loadTicket();
    } catch (err: any) {
      setActionError(err.message || `Failed to update ${endpoint}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (!user) return null;
  if (loading) return <div className="text-center py-5">Loading ticket details...</div>;
  if (errorMsg) return <div className="alert alert-danger" role="alert">{errorMsg}</div>;
  if (!ticket) return null;

  const getValidStatuses = (currentStatus: string) => {
    switch (currentStatus) {
      case "New": return ["New", "Open", "Cancelled"];
      case "Open": return ["Open", "In Progress", "Resolved", "Cancelled"];
      case "In Progress": return ["In Progress", "Waiting for Requester", "Resolved"];
      case "Waiting for Requester": return ["Waiting for Requester", "In Progress"];
      case "Resolved": return ["Resolved", "Closed", "Reopened"];
      case "Reopened": return ["Reopened", "Open"];
      case "Closed": return ["Closed"];
      case "Cancelled": return ["Cancelled"];
      default: return [currentStatus];
    }
  };
  const validStatuses = getValidStatuses(ticket.currentStatus);


  return (
    <div>
      <div className="mb-3">
        <a href="#" className="text-decoration-none" style={{ color: ZEN.secondary, fontWeight: 600 }}>
          &larr; Back to Ticket Queue
        </a>
      </div>

      <div className="row g-4">
        {/* Main Content */}
        <div className="col-12 col-lg-8">
          <div className="card mb-4" style={{ borderColor: ZEN.border }}>
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
              <div>
                <h4 className="mb-1" style={{ color: ZEN.primary, fontWeight: 700 }}>{ticket.ticketNumber}</h4>
                <div style={{ color: ZEN.neutral, fontSize: 18, fontWeight: 600 }}>{ticket.summary}</div>
              </div>
              <div>
                <Badge text={ticket.currentStatus} map={statusBadgeStyle} />
              </div>
            </div>
            <div className="card-body" style={{ backgroundColor: "#F9FAFB" }}>
              <h6 className="fw-bold" style={{ color: ZEN.neutral }}>Description</h6>
              <div className="p-3 bg-white rounded" style={{ border: `1px solid ${ZEN.border}`, color: ZEN.neutral, minHeight: "80px", whiteSpace: "pre-wrap" }}>
                {ticket.description}
              </div>
            </div>
          </div>

          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button className={`nav-link fw-semibold ${activeTab === "comments" ? "active" : ""}`} style={{ color: activeTab === "comments" ? ZEN.primary : ZEN.neutral }} onClick={() => setActiveTab("comments")}>
                💬 Public Comments
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link fw-semibold ${activeTab === "notes" ? "active" : ""}`} style={{ color: activeTab === "notes" ? ZEN.primary : ZEN.neutral }} onClick={() => setActiveTab("notes")}>
                🔒 Internal Notes
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link fw-semibold ${activeTab === "attachments" ? "active" : ""}`} style={{ color: activeTab === "attachments" ? ZEN.primary : ZEN.neutral }} onClick={() => setActiveTab("attachments")}>
                📎 Attachments
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link fw-semibold ${activeTab === "actions" ? "active" : ""}`} style={{ color: activeTab === "actions" ? ZEN.primary : ZEN.neutral }} onClick={() => setActiveTab("actions")}>
                ⚙️ Service Actions
              </button>
            </li>
          </ul>

          <div className="tab-content mt-3">
            {activeTab === "comments" && (
              <div className="card" style={{ borderColor: ZEN.border }}>
                <div className="card-body p-0">
                  {comments.length === 0 ? (
                    <div className="p-4 text-center text-muted small">No public comments yet.</div>
                  ) : (
                    <ul className="list-unstyled mb-0">
                      {comments.map((c, idx) => (
                        <li key={c.id ?? idx} className="px-4 py-3" style={{ borderBottom: idx < comments.length - 1 ? `1px solid ${ZEN.border}` : undefined }}>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="fw-semibold" style={{ color: ZEN.neutral, fontSize: 14 }}>{c.author?.name ?? "Unknown"}</span>
                            {c.author?.role && (
                              <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, backgroundColor: (roleBadgeStyle[c.author.role] ?? { bg: "#F2F4F7" }).bg, color: (roleBadgeStyle[c.author.role] ?? { color: "#344054" }).color }}>
                                {displayRole(c.author.role)}
                              </span>
                            )}
                            <span className="text-muted" style={{ fontSize: 12 }}>{formatDate(c.createdAt)}</span>
                          </div>
                          <div style={{ color: ZEN.neutral, fontSize: 14, whiteSpace: "pre-wrap" }}>{c.content}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="card-footer bg-white py-3">
                  <form onSubmit={handlePostComment}>
                    <textarea className="form-control mb-2" placeholder="Write a public comment…" rows={3} value={commentContent} onChange={(e) => setCommentContent(e.target.value)} disabled={commentLoading} />
                    {commentError && <div className="small text-danger mb-2">{commentError}</div>}
                    <div className="d-flex justify-content-end">
                      <button type="submit" className="btn btn-sm text-white fw-semibold" style={{ backgroundColor: ZEN.primary }} disabled={commentLoading || !commentContent.trim()}>
                        {commentLoading ? "Posting…" : "Post Comment"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === "notes" && (
              <div className="card" style={{ borderColor: ZEN.warning }}>
                <div className="card-header fw-bold" style={{ backgroundColor: "#FEF0C7", color: ZEN.warning }}>
                  Internal Notes (Not visible to Requester)
                </div>
                <div className="card-body p-0" style={{ backgroundColor: "#FEF0C7" }}>
                  {notes.length === 0 ? (
                    <div className="p-4 text-center text-muted small">No internal notes yet.</div>
                  ) : (
                    <ul className="list-unstyled mb-0">
                      {notes.map((n, idx) => (
                        <li key={n.id ?? idx} className="px-4 py-3" style={{ borderBottom: idx < notes.length - 1 ? `1px solid #FFE4CC` : undefined }}>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="fw-semibold" style={{ color: ZEN.neutral, fontSize: 14 }}>{n.author?.name ?? "Unknown"}</span>
                            <span className="text-muted" style={{ fontSize: 12 }}>{formatDate(n.createdAt)}</span>
                          </div>
                          <div style={{ color: ZEN.neutral, fontSize: 14, whiteSpace: "pre-wrap" }}>{n.content}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="card-footer py-3" style={{ backgroundColor: "#FEF0C7" }}>
                  <form onSubmit={handlePostNote}>
                    <textarea className="form-control mb-2" placeholder="Write an internal note…" rows={3} value={noteContent} onChange={(e) => setNoteContent(e.target.value)} disabled={noteLoading} />
                    {noteError && <div className="small text-danger mb-2">{noteError}</div>}
                    <div className="d-flex justify-content-end">
                      <button type="submit" className="btn btn-sm fw-semibold" style={{ backgroundColor: ZEN.warning, color: "white" }} disabled={noteLoading || !noteContent.trim()}>
                        {noteLoading ? "Posting…" : "Add Internal Note"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === "attachments" && (
              <AttachmentSection ticketId={ticket.id} attachments={ticket.attachments || []} onAttachmentUpdated={loadTicket} />
            )}

            {activeTab === "actions" && (
              <div className="card" style={{ borderColor: ZEN.border }}>
                <div className="card-body">
                  {actionError && <div className="alert alert-danger" role="alert">{actionError}</div>}
                  {actionSuccess && <div className="alert alert-success" role="alert">{actionSuccess}</div>}

                  <div className="mb-4">
                    <label className="fw-bold mb-2">Ticket Owner</label>
                    <div className="d-flex gap-2">
                      <select
                        aria-label="Ticket Owner"
                        className="form-select"
                        value={ticket.ticketOwnerId || ""}
                        onChange={(e) => handleAction("owner", { ticketOwnerId: e.target.value ? Number(e.target.value) : null, version: ticket.version }, "Owner updated successfully.")}
                        disabled={actionLoading}
                      >
                        <option value="">-- Unassigned --</option>
                        {staffUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="fw-bold mb-2">IT Priority</label>
                    <div className="d-flex gap-2">
                      <select
                        aria-label="IT Priority"
                        className="form-select"
                        value={ticket.itPriority || "Low"}
                        onChange={(e) => handleAction("priority", { itPriority: e.target.value, version: ticket.version }, "Priority updated successfully.")}
                        disabled={actionLoading}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="fw-bold mb-2">Current Status</label>
                    <div className="d-flex gap-2">
                      <select
                          aria-label="Current Status"
                          className="form-select"
                          value={ticket.currentStatus}
                          onChange={(e) => handleAction("status", { status: e.target.value, version: ticket.version }, "Status updated successfully.")}
                          disabled={actionLoading}
                        >
                          {validStatuses.map(st => <option key={st} value={st}>{st}</option>)}
                        </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-12 col-lg-4">
          <div className="card mb-4" style={{ borderColor: ZEN.border }}>
            <div className="card-header bg-white py-3">
              <strong style={{ color: ZEN.primary }}>Ticket Information</strong>
            </div>
            <div className="card-body">
              <ul className="list-unstyled mb-0" style={{ fontSize: 14, color: ZEN.neutral }}>
                <li className="mb-3">
                  <div className="text-muted small fw-semibold text-uppercase">Requester</div>
                  <div>{ticket.requesterUser?.name || ticket.requester?.name}</div>
                </li>
                <li className="mb-3">
                  <div className="text-muted small fw-semibold text-uppercase">Owner</div>
                  <div>{ticket.ticketOwner?.name || "Unassigned"}</div>
                </li>
                <li className="mb-3">
                  <div className="text-muted small fw-semibold text-uppercase">Category</div>
                  <div>{ticket.category?.name}</div>
                </li>
                <li className="mb-3">
                  <div className="text-muted small fw-semibold text-uppercase">Related System</div>
                  <div>{ticket.relatedSystem?.name}</div>
                </li>
                <li className="mb-3">
                  <div className="text-muted small fw-semibold text-uppercase">Requested Priority</div>
                  <div className="mt-1"><Badge text={ticket.requestedPriority} map={priorityBadgeStyle} /></div>
                </li>
                <li className="mb-3">
                  <div className="text-muted small fw-semibold text-uppercase">IT Priority</div>
                  <div className="mt-1"><Badge text={ticket.itPriority} map={priorityBadgeStyle} /></div>
                </li>
                <li className="mb-3">
                  <div className="text-muted small fw-semibold text-uppercase">Created At</div>
                  <div>{formatDate(ticket.createdAt)}</div>
                </li>
                <li>
                  <div className="text-muted small fw-semibold text-uppercase">Last Updated</div>
                  <div>{formatDate(ticket.updatedAt)}</div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions Taken - full-width row so the table is not squeezed into the 8-col column */}
        <div className="col-12">
          <ActionsTaken ticketId={ticket.id} userRole="IT_Staff" />
        </div>
      </div>
    </div>
  );
}
