import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext.js";
import { apiFetch } from "../api.js";
import AttachmentSection from "./AttachmentSection.js";

// ---------------------------------------------------------------------------
// Design tokens — Zen Green palette (ui-spec.md §1)
// ---------------------------------------------------------------------------
const ZEN = {
  primary: "#006B3C",
  secondary: "#0B7A46",
  paleBg: "#EAF6EF",
  pageBg: "#F5F7F6",
  error: "#D92D20",
  warning: "#F79009",
  success: "#039855",
  neutral: "#344054",
  border: "#D0D5DD",
  white: "#FFFFFF",
};

const priorityBadge: Record<string, { bg: string; color: string }> = {
  Low: { bg: ZEN.paleBg, color: ZEN.primary },
  Medium: { bg: "#FFF7E6", color: "#B54708" },
  High: { bg: "#FEF3F2", color: "#B42318" },
  Critical: { bg: "#FEE4E2", color: "#912018" },
};

const statusBadge: Record<string, { bg: string; color: string }> = {
  New: { bg: ZEN.paleBg, color: ZEN.primary },
  Open: { bg: "#E0F2FE", color: "#026AA2" },
  In_Progress: { bg: "#FFF7E6", color: "#B54708" },
  Pending: { bg: "#F2F4F7", color: "#344054" },
  Resolved: { bg: "#D1FADF", color: "#027A48" },
  Closed: { bg: "#F2F4F7", color: "#667085" },
};

/** Role badge colours for comments (Zen Green palette) */
const roleBadgeStyle: Record<string, { bg: string; color: string }> = {
  Requester: { bg: ZEN.paleBg, color: ZEN.primary },
  "IT Staff": { bg: "#EFF8FF", color: "#175CD3" },
  Administrator: { bg: "#FDF4FF", color: "#6941C6" },
  IT_Staff: { bg: "#EFF8FF", color: "#175CD3" },
};

/** Statuses where the Requester can still interact — "Problem Appears Resolved" is visible */
const ACTIVE_STATUSES = new Set(["New", "Open", "In Progress", "In_Progress", "Waiting for Requester", "Waiting_for_Requester", "Reopened"]);

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
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Normalise role enum value for display
// ---------------------------------------------------------------------------
function displayRole(role: string) {
  if (!role) return role;
  return role.replace(/_/g, " ");
}

export default function RequesterTicketDetail({ ticketId }: { ticketId: number }) {
  const { user } = useAuth();

  // Ticket state
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Comments state
  const [comments, setComments] = useState<any[]>([]);
  const [commentContent, setCommentContent] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [commentSuccess, setCommentSuccess] = useState(false);

  // "Problem Appears Resolved" button state (BR-12)
  const [resolveLoading, setResolveLoading] = useState(false);
  const [resolveError, setResolveError] = useState("");

  // ---------------------------------------------------------------------------
  // Load ticket detail
  // ---------------------------------------------------------------------------
  const loadTicket = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await apiFetch(`/api/tickets/${ticketId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch ticket detail");
      }
      setTicket(data);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [ticketId, user]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

  // ---------------------------------------------------------------------------
  // Load public comments — runs after ticket is successfully loaded
  // ---------------------------------------------------------------------------
  const loadComments = useCallback(async () => {
    if (!ticket) return;
    try {
      const res = await apiFetch(`/api/tickets/${ticketId}/comments`);
      if (!res.ok) return; // Silently ignore — don't break the ticket view
      const data = await res.json();
      console.log("loadComments DATA:", data);
      if (Array.isArray(data)) {
        console.log("loadComments SETTING DATA:", data);
        setComments(data);
      }
    } catch (e) {
      console.log("loadComments ERROR:", e);
    }
  }, [ticketId, ticket]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // ---------------------------------------------------------------------------
  // Post a public comment (AC-07 / BR-09)
  // ---------------------------------------------------------------------------
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError("");
    setCommentSuccess(false);

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
      if (!res.ok) {
        throw new Error(data.error || "Failed to post comment");
      }
      setCommentContent("");
      setCommentSuccess(true);
      await loadComments();
    } catch (err: unknown) {
      setCommentError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setCommentLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // "Problem Appears Resolved" action (BR-12)
  // ---------------------------------------------------------------------------
  const handleResolve = async () => {
    setResolveError("");
    setResolveLoading(true);
    try {
      const res = await apiFetch(`/api/tickets/${ticketId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ problemAppearsResolved: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to mark as resolved");
      }
      await loadTicket();
    } catch (err: unknown) {
      setResolveError(err instanceof Error ? err.message : "Failed to mark as resolved");
    } finally {
      setResolveLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (!user) return null;

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" style={{ color: ZEN.primary }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2" style={{ color: ZEN.neutral }}>Loading ticket details...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="alert alert-danger">
        <h5 className="alert-heading mb-1">❌ Error</h5>
        <hr className="my-2" />
        <p className="mb-0">{errorMsg}</p>
        <div className="mt-3">
          <a href="#" className="btn btn-sm btn-outline-danger">
            &larr; Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  const canResolve = ACTIVE_STATUSES.has(ticket.currentStatus) && !ticket.problemAppearsResolved;

  return (
    <div>
      <div className="mb-3">
        <a href="#" className="text-decoration-none" style={{ color: ZEN.secondary, fontWeight: 600 }}>
          &larr; Back to My Tickets
        </a>
      </div>

      <div className="row g-4">
        {/* Main Content (left column) */}
        <div className="col-12 col-lg-8">
          {/* Ticket header card */}
          <div className="card mb-4" style={{ borderColor: ZEN.border }}>
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
              <div>
                <h4 className="mb-1" style={{ color: ZEN.primary, fontWeight: 700 }}>
                  {ticket.ticketNumber}
                </h4>
                <div style={{ color: ZEN.neutral, fontSize: 18, fontWeight: 600 }}>
                  {ticket.summary}
                </div>
              </div>
              <div>
                <Badge text={ticket.currentStatus} map={statusBadge} />
              </div>
            </div>
            <div className="card-body" style={{ backgroundColor: "#F9FAFB" }}>
              <h6 className="fw-bold" style={{ color: ZEN.neutral }}>Description</h6>
              <div
                className="p-3 bg-white rounded"
                style={{
                  border: `1px solid ${ZEN.border}`,
                  color: ZEN.neutral,
                  minHeight: "120px",
                  whiteSpace: "pre-wrap",
                }}
              >
                {ticket.description}
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* BR-12: "Problem Appears Resolved" action                         */}
          {/* Show only when ticket is in an active state                      */}
          {/* ---------------------------------------------------------------- */}
          {canResolve && (
            <div
              className="card mb-4"
              style={{ borderColor: ZEN.primary, borderWidth: 2 }}
              data-testid="resolve-action-card"
            >
              <div className="card-body d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
                <div>
                  <h6 className="fw-bold mb-1" style={{ color: ZEN.primary }}>
                    ✅ Problem Appears Resolved?
                  </h6>
                  <p className="mb-0 small text-muted">
                    If your issue has been resolved, let us know so we can close the ticket.
                  </p>
                  {resolveError && (
                    <div className="mt-2 small" style={{ color: ZEN.error }}>{resolveError}</div>
                  )}
                </div>
                <button
                  className="btn text-white fw-semibold flex-shrink-0"
                  style={{ backgroundColor: ZEN.primary, borderColor: ZEN.primary, minWidth: 180 }}
                  onClick={handleResolve}
                  disabled={resolveLoading}
                  data-testid="resolve-btn"
                >
                  {resolveLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                      Submitting…
                    </>
                  ) : (
                    "Problem Appears Resolved"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* Public Comments section (AC-07 / BR-09 / FR-09)                  */}
          {/* ---------------------------------------------------------------- */}
          <div className="card mb-4" style={{ borderColor: ZEN.border }}>
            <div className="card-header bg-white py-3 d-flex align-items-center gap-2">
              <strong style={{ color: ZEN.primary }}>💬 Public Comments</strong>
              {comments.length > 0 && (
                <span
                  className="badge rounded-pill"
                  style={{ backgroundColor: ZEN.primary, color: "#fff", fontSize: 12 }}
                >
                  {comments.length}
                </span>
              )}
            </div>
            <div className="card-body p-0">
              {/* Comment list */}
              {comments.length === 0 ? (
                <div className="p-4 text-center text-muted small">
                  No comments yet. Be the first to leave a comment.
                </div>
              ) : (
                <ul className="list-unstyled mb-0">
                  {comments.map((c: any, idx: number) => (
                    <li
                      key={c.id ?? idx}
                      className="px-4 py-3"
                      style={{
                        borderBottom: idx < comments.length - 1 ? `1px solid ${ZEN.border}` : undefined,
                      }}
                    >
                      <div className="d-flex align-items-center gap-2 mb-1">
                        {/* Author avatar initials */}
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            backgroundColor: ZEN.paleBg,
                            color: ZEN.primary,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: 13,
                            flexShrink: 0,
                          }}
                        >
                          {(c.author?.name ?? "?")[0].toUpperCase()}
                        </div>
                        <div className="d-flex flex-wrap align-items-center gap-2">
                          <span className="fw-semibold" style={{ color: ZEN.neutral, fontSize: 14 }}>
                            {c.author?.name ?? "Unknown"}
                          </span>
                          {/* Role badge */}
                          {c.author?.role && (
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: 10,
                                fontSize: 11,
                                fontWeight: 600,
                                backgroundColor:
                                  (roleBadgeStyle[c.author.role] ?? { bg: "#F2F4F7" }).bg,
                                color:
                                  (roleBadgeStyle[c.author.role] ?? { color: "#344054" }).color,
                              }}
                            >
                              {displayRole(c.author.role)}
                            </span>
                          )}
                          <span className="text-muted" style={{ fontSize: 12 }}>
                            {c.createdAt ? formatDate(c.createdAt) : ""}
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          paddingLeft: 40,
                          color: ZEN.neutral,
                          fontSize: 14,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {c.content}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Comment input form */}
            <div
              className="card-footer bg-white py-3"
              style={{ borderTop: `1px solid ${ZEN.border}` }}
            >
              <form onSubmit={handlePostComment} noValidate>
                <div className="mb-2">
                  <textarea
                    className="form-control"
                    id="comment-input"
                    placeholder="Write a public comment…"
                    rows={3}
                    value={commentContent}
                    onChange={(e) => {
                      setCommentContent(e.target.value);
                      setCommentError("");
                      setCommentSuccess(false);
                    }}
                    disabled={commentLoading}
                    style={{ resize: "vertical", borderColor: commentError ? ZEN.error : ZEN.border }}
                    data-testid="comment-input"
                  />
                  {commentError && (
                    <div className="mt-1 small" style={{ color: ZEN.error }} data-testid="comment-error">
                      {commentError}
                    </div>
                  )}
                  {commentSuccess && (
                    <div className="mt-1 small" style={{ color: ZEN.success }} data-testid="comment-success">
                      Comment posted successfully.
                    </div>
                  )}
                </div>
                <div className="d-flex justify-content-end">
                  <button
                    type="submit"
                    className="btn btn-sm text-white fw-semibold"
                    style={{ backgroundColor: ZEN.primary, borderColor: ZEN.primary }}
                    disabled={commentLoading || !commentContent.trim()}
                    data-testid="post-comment-btn"
                  >
                    {commentLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                        Posting…
                      </>
                    ) : (
                      "Post Comment"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar (right column) */}
        <div className="col-12 col-lg-4">
          <div className="card mb-4" style={{ borderColor: ZEN.border }}>
            <div className="card-header bg-white py-3">
              <strong style={{ color: ZEN.primary }}>Ticket Information</strong>
            </div>
            <div className="card-body">
              <ul className="list-unstyled mb-0" style={{ fontSize: 14, color: ZEN.neutral }}>
                <li className="mb-3">
                  <div className="text-muted small fw-semibold text-uppercase">Requester</div>
                  <div>{ticket.requesterUser?.name}</div>
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
                  <div className="text-muted small fw-semibold text-uppercase">Priority</div>
                  <div className="mt-1"><Badge text={ticket.requestedPriority} map={priorityBadge} /></div>
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

          <AttachmentSection 
            ticketId={ticket.id} 
            attachments={ticket.attachments || []} 
            onAttachmentUpdated={loadTicket} 
          />
        </div>
      </div>
    </div>
  );
}