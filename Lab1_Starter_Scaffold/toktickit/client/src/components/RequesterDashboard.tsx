import { ZEN, statusBadgeStyle } from '../theme.js';
import React, { useEffect, useState } from "react";
import { getRequesterDashboard } from "../api.js";

type RequesterDashboardData = {
  statusBreakdown: Record<string, number>;
  myTickets?: Array<{
    id: number;
    ticketNumber: string;
    summary: string;
    currentStatus: string;
    updatedAt: string;
  }>;
};

export default function RequesterDashboard() {
  const [data, setData] = useState<RequesterDashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getRequesterDashboard();
      setData(result);
    } catch (err: any) {
      setError(err?.message || "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5" data-testid="dashboard-loading">
        <div className="spinner-border" style={{ color: ZEN.primary }} role="status">
          <span className="visually-hidden">Loading dashboard...</span>
        </div>
        <p className="mt-2 text-muted">Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger my-3" data-testid="dashboard-error" role="alert">
        <h5 className="alert-heading fw-bold mb-1">Failed to load metrics</h5>
        {error !== "Failed to load metrics" && <span className="visually-hidden">{error}</span>}
        <p className="mb-2">Unable to retrieve dashboard metrics at this time. Please check your network connection and try again.</p>
        <button className="btn btn-sm btn-outline-danger" onClick={fetchDashboard}>Retry</button>
      </div>
    );
  }

  if (!data) return null;

  const counts: Record<string, number> =
    data.statusBreakdown ||
    (!Array.isArray(data.myTickets) && data.myTickets ? (data.myTickets as unknown as Record<string, number>) : {});
  const recentTickets = Array.isArray(data.myTickets) ? data.myTickets : [];
  const totalTickets = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div data-testid="requester-dashboard">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1" style={{ color: ZEN.primary, fontWeight: 700 }}>My Dashboard</h2>
          <p className="text-muted mb-0 small">Overview of your submitted support requests and current status</p>
        </div>
      </div>

      {/* ── 5 Metric Cards ── */}
      <div className="row g-3 mb-4" data-testid="metric-cards">
        {/* Open */}
        <div className="col-md col-sm-6">
          <div className="card text-center h-100 shadow-sm" style={{ borderColor: ZEN.border }}>
            <div className="card-body py-3">
              <h6 className="card-title text-muted small text-uppercase fw-semibold mb-2">Open</h6>
              <div className="display-6 fw-bold">
                <a href="#mytickets?currentStatus=Open,New,Reopened" className="text-decoration-none" style={{ color: ZEN.primary }}>
                  {counts["Open"] || 0}
                </a>
              </div>
              <small className="text-muted" style={{ fontSize: 11 }}>New + Open</small>
            </div>
          </div>
        </div>

        {/* In Progress */}
        <div className="col-md col-sm-6">
          <div className="card text-center h-100 shadow-sm" style={{ borderColor: ZEN.border }}>
            <div className="card-body py-3">
              <h6 className="card-title text-muted small text-uppercase fw-semibold mb-2">In Progress</h6>
              <div className="display-6 fw-bold">
                <a href="#mytickets?currentStatus=In_Progress" className="text-decoration-none" style={{ color: "#B54708" }}>
                  {counts["InProgress"] || 0}
                </a>
              </div>
              <small className="text-muted" style={{ fontSize: 11 }}>Staff Working</small>
            </div>
          </div>
        </div>

        {/* Waiting for you */}
        <div className="col-md col-sm-6">
          <div className="card text-center h-100 shadow-sm" style={{ borderColor: "#F59E0B", backgroundColor: (counts["WaitingForRequester"] || 0) > 0 ? "#FFFBEB" : ZEN.white }}>
            <div className="card-body py-3">
              <h6 className="card-title text-warning small text-uppercase fw-bold mb-2">Waiting for you</h6>
              <div className="display-6 fw-bold">
                <a href="#mytickets?currentStatus=Waiting_for_Requester" className="text-decoration-none" style={{ color: "#D97706" }}>
                  {counts["WaitingForRequester"] || 0}
                </a>
              </div>
              <small className="text-muted" style={{ fontSize: 11 }}>Action Required</small>
            </div>
          </div>
        </div>

        {/* Resolved */}
        <div className="col-md col-sm-6">
          <div className="card text-center h-100 shadow-sm" style={{ borderColor: ZEN.border }}>
            <div className="card-body py-3">
              <h6 className="card-title text-muted small text-uppercase fw-semibold mb-2">Resolved</h6>
              <div className="display-6 fw-bold">
                <a href="#mytickets?currentStatus=Resolved" className="text-decoration-none" style={{ color: "#027A48" }}>
                  {counts["Resolved"] || 0}
                </a>
              </div>
              <small className="text-muted" style={{ fontSize: 11 }}>Awaiting Confirm</small>
            </div>
          </div>
        </div>

        {/* Closed */}
        <div className="col-md col-sm-6">
          <div className="card text-center h-100 shadow-sm" style={{ borderColor: ZEN.border }}>
            <div className="card-body py-3">
              <h6 className="card-title text-muted small text-uppercase fw-semibold mb-2">Closed</h6>
              <div className="display-6 fw-bold">
                <a href="#mytickets?currentStatus=Closed" className="text-decoration-none" style={{ color: "#667085" }}>
                  {counts["Closed"] || 0}
                </a>
              </div>
              <small className="text-muted" style={{ fontSize: 11 }}>Completed</small>
            </div>
          </div>
        </div>
      </div>

      {/* ── Empty State ── */}
      {totalTickets === 0 && recentTickets.length === 0 && (
        <div className="card text-center py-5 shadow-sm" style={{ borderColor: ZEN.border }} data-testid="dashboard-empty-state">
          <div style={{ fontSize: 48 }}>📭</div>
          <h5 className="mt-2" style={{ color: ZEN.neutral }}>No Tickets Submitted Yet</h5>
          <p className="text-muted small">You currently have no active or historical tickets in the system.</p>
          <div>
            <a href="#create-ticket" className="btn btn-sm text-white" style={{ backgroundColor: ZEN.primary }}>
              + Create Your First Ticket
            </a>
          </div>
        </div>
      )}

      {/* ── Recently Updated Tickets ── */}
      {recentTickets.length > 0 && (
        <div className="card shadow-sm mb-4" style={{ borderColor: ZEN.border }}>
          <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center" style={{ borderBottomColor: ZEN.border }}>
            <h5 className="mb-0 fw-bold" style={{ color: ZEN.neutral, fontSize: 16 }}>
              🕒 Recently Updated Tickets
            </h5>
            <a href="#mytickets" className="btn btn-sm btn-outline-secondary">
              View All My Tickets
            </a>
          </div>
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: 14 }}>
              <thead style={{ backgroundColor: ZEN.paleBg }}>
                <tr>
                  <th style={{ color: ZEN.primary, width: "15%" }}>Ticket ID</th>
                  <th style={{ color: ZEN.primary }}>Summary</th>
                  <th style={{ color: ZEN.primary, width: "18%" }}>Status</th>
                  <th style={{ color: ZEN.primary, width: "22%" }}>Requester Action</th>
                  <th style={{ color: ZEN.primary, width: "15%" }}>Updated</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.map((t) => {
                  const badge = statusBadgeStyle[t.currentStatus] || { bg: "#F2F4F7", color: "#344054" };
                  const isWaitingForRequester = t.currentStatus === "Waiting_for_Requester";
                  const isResolved = t.currentStatus === "Resolved";
                  return (
                    <tr key={t.id}>
                      <td className="fw-semibold">
                        <a href={`#tickets/${t.id}`} style={{ color: ZEN.primary, textDecoration: "none" }}>
                          {t.ticketNumber}
                        </a>
                      </td>
                      <td>
                        <a href={`#tickets/${t.id}`} className="text-dark text-decoration-none">
                          {t.summary}
                        </a>
                      </td>
                      <td>
                        <span style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 600,
                          backgroundColor: badge.bg,
                          color: badge.color
                        }}>
                          {t.currentStatus.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td>
                        {isWaitingForRequester && (
                          <span className="badge bg-warning text-dark px-2 py-1">
                            ⚠️ Reply / Info Needed
                          </span>
                        )}
                        {isResolved && (
                          <span className="badge bg-success text-white px-2 py-1">
                            ✓ Confirmation Pending
                          </span>
                        )}
                        {!isWaitingForRequester && !isResolved && (
                          <span className="text-muted small">— None —</span>
                        )}
                      </td>
                      <td className="text-muted small">
                        {new Date(t.updatedAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
