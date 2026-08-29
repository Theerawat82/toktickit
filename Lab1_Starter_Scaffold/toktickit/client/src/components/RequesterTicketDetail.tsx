import React, { useState, useEffect } from "react";
import { useRequester } from "../context/RequesterContext.js";
import AttachmentSection from "./AttachmentSection.js";

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

export default function RequesterTicketDetail({ ticketId }: { ticketId: number }) {
  const { activeRequester } = useRequester();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const loadTicket = async () => {
    if (!activeRequester) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        headers: { "x-requester-id": String(activeRequester.id) },
      });
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
  };

  useEffect(() => {
    loadTicket();
  }, [ticketId, activeRequester]);

  if (!activeRequester) return null;

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

  return (
    <div>
      <div className="mb-3">
        <a href="#" className="text-decoration-none" style={{ color: ZEN.secondary, fontWeight: 600 }}>
          &larr; Back to My Tickets
        </a>
      </div>

      <div className="row g-4">
        {/* Main Content (70% on desktop) */}
        <div className="col-12 col-lg-8">
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
        </div>

        {/* Sidebar (30% on desktop) */}
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
