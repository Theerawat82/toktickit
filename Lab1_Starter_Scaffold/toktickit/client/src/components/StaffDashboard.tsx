import { ZEN } from '../theme.js';
import React, { useEffect, useState } from "react";
import { getStaffDashboard } from "../api.js";

type StaffDashboardData = {
  unassignedCount: number;
  myAssignedCount: number;
  statusBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  recentlyUpdated: any[];
  activeUserCount?: number;
  inactiveUserCount?: number;
};

export default function StaffDashboard() {
  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await getStaffDashboard();
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to fetch staff dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (error) {
    return (
      <div className="alert alert-danger">
        <p>{error}</p>
        <button className="btn btn-sm btn-outline-danger" onClick={fetchDashboard}>Retry</button>
      </div>
    );
  }

  if (!data) return null;

    const openStatusCount = data.statusBreakdown["Open"] || 0;
  const inProgressStatusCount = data.statusBreakdown["InProgress"] || 0;
  const waitingStatusCount = data.statusBreakdown["Waiting for Requester"] || 0;
  const newStatusCount = data.statusBreakdown["New"] || 0;

  return (
    <div>
      <h2 className="mb-4">Dashboard</h2>

      <div className="row mb-4">
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card text-center h-100">
            <div className="card-body">
              <h5 className="card-title text-muted">New</h5>
              <h2 className="display-6"><a href="#queue?status=New" className="text-decoration-none" style={{ color: ZEN.primary }}>{newStatusCount}</a></h2>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card text-center h-100">
            <div className="card-body">
              <h5 className="card-title text-muted">Open</h5>
              <h2 className="display-6"><a href="#queue?status=Open" className="text-decoration-none" style={{ color: ZEN.primary }}>{openStatusCount}</a></h2>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card text-center h-100">
            <div className="card-body">
              <h5 className="card-title text-muted">In Progress</h5>
              <h2 className="display-6"><a href="#queue?status=In_Progress" className="text-decoration-none" style={{ color: ZEN.primary }}>{inProgressStatusCount}</a></h2>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card text-center h-100">
            <div className="card-body">
              <h5 className="card-title text-muted">Waiting</h5>
              <h2 className="display-6"><a href="#queue?status=Waiting_for_Requester" className="text-decoration-none" style={{ color: ZEN.primary }}>{waitingStatusCount}</a></h2>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-6 mb-3">
          <div className="card h-100">
            <div className="card-body d-flex justify-content-between align-items-center">
              <h5 className="card-title text-muted mb-0">Unassigned</h5>
              <h2 className="display-6 mb-0"><a href="#queue?ownerId=unassigned" className="text-decoration-none" style={{ color: ZEN.primary }}>{data.unassignedCount}</a></h2>
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-3">
          <div className="card h-100">
            <div className="card-body d-flex justify-content-between align-items-center">
              <h5 className="card-title text-muted mb-0">My Assigned</h5>
              <h2 className="display-6 mb-0"><a href="#queue?ownerId=me" className="text-decoration-none" style={{ color: ZEN.primary }}>{data.myAssignedCount}</a></h2>
            </div>
          </div>
        </div>
      </div>
      
      {data.priorityBreakdown && Object.keys(data.priorityBreakdown).length > 0 && (
         <div className="mb-4">
           <h5>Priority Breakdown (Active)</h5>
           <div className="d-flex gap-3 flex-wrap">
             {Object.entries(data.priorityBreakdown).map(([priority, count]) => (
                <div key={priority} className="card px-3 py-2 text-center">
                  <div className="small text-muted">{priority}</div>
                  <div className="fw-bold"><a href={`#queue?itPriority=${priority}`} className="text-decoration-none" style={{ color: ZEN.primary }}>{count}</a></div>
                </div>
             ))}
           </div>
         </div>
      )}

      {data.activeUserCount !== undefined && data.inactiveUserCount !== undefined && (
        <div className="card mb-4 bg-light">
          <div className="card-body py-2 d-flex justify-content-around">
            <div><span className="text-muted small">Active Users:</span> <span className="fw-bold">{data.activeUserCount}</span></div>
            <div><span className="text-muted small">Inactive Users:</span> <span className="fw-bold">{data.inactiveUserCount}</span></div>
          </div>
        </div>
      )}

      <h4>Recently Updated</h4>
      {data.recentlyUpdated.length === 0 ? (
        <p className="text-muted">No recently updated tickets.</p>
      ) : (
        <ul className="list-group">
          {data.recentlyUpdated.map((ticket) => (
            <li key={ticket.id} className="list-group-item">
              <div className="d-flex w-100 justify-content-between">
                <a href={`#ticket/${ticket.id}`} data-testid={`ticket-link-${ticket.id}`} className="fw-bold text-decoration-none">{ticket.ticketNumber}</a>
                <small className="text-muted">{new Date(ticket.updatedAt).toLocaleDateString()}</small>
              </div>
              <p className="mb-1">{ticket.summary}</p>
              <small className="badge bg-secondary">{ticket.currentStatus.replace(/_/g, " ")}</small>
            </li>
          ))}
        </ul>
      )}

    </div>
  );
}

