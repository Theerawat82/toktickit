import React, { useEffect, useState } from "react";
import { getRequesterDashboard } from "../api.js";

type RequesterDashboardData = {
  myOpenCount: number;
  waitingForRequesterCount: number;
  recentlyUpdated: any[];
  recentlyResolved: any[];
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
      setError(err.message || "Failed to fetch requester dashboard");
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

  return (
    <div>
      <h2 className="mb-4">My Dashboard</h2>

      <div className="row mb-4">
        <div className="col-md-6 mb-3">
          <div className="card text-center h-100">
            <div className="card-body">
              <h5 className="card-title text-muted">My Open Tickets</h5>
              <h2 className="display-6"><a href="#mytickets?status=open" className="text-decoration-none">{data.myOpenCount}</a></h2>
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-3">
          <div className="card text-center h-100">
            <div className="card-body">
              <h5 className="card-title text-muted">Waiting For Me</h5>
              <h2 className="display-6"><a href="#mytickets?status=Waiting_for_Requester" className="text-decoration-none">{data.waitingForRequesterCount}</a></h2>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-6 mb-4">
          <h4>My Recent Tickets</h4>
          {data.recentlyUpdated.length === 0 ? (
            <p className="text-muted">No recently updated tickets.</p>
          ) : (
            <ul className="list-group">
              {data.recentlyUpdated.map((ticket) => (
                <li key={ticket.id} className="list-group-item">
                  <div className="d-flex w-100 justify-content-between">
                    <a href={`#ticket/${ticket.id}`} className="fw-bold text-decoration-none">{ticket.ticketNumber}</a>
                    <small className="text-muted">{new Date(ticket.updatedAt).toLocaleDateString()}</small>
                  </div>
                  <p className="mb-1 text-truncate">{ticket.summary}</p>
                  <small className="badge bg-secondary">{ticket.currentStatus.replace(/_/g, " ")}</small>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="col-lg-6 mb-4">
          <h4>Recently Resolved</h4>
          {data.recentlyResolved.length === 0 ? (
            <p className="text-muted">No recently resolved tickets.</p>
          ) : (
            <ul className="list-group">
              {data.recentlyResolved.map((ticket) => (
                <li key={ticket.id} className="list-group-item">
                  <div className="d-flex w-100 justify-content-between">
                    <a href={`#ticket/${ticket.id}`} className="fw-bold text-decoration-none">{ticket.ticketNumber}</a>
                    <small className="text-muted">{new Date(ticket.updatedAt).toLocaleDateString()}</small>
                  </div>
                  <p className="mb-1 text-truncate">{ticket.summary}</p>
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <small className="badge bg-success">{ticket.currentStatus.replace(/_/g, " ")}</small>
                    {ticket.currentStatus.replace(/_/g, " ") === "Resolved" && !ticket.requesterConfirmedResolved && (
                      <a href={`#ticket/${ticket.id}`} className="btn btn-sm btn-outline-success">Confirm Resolution</a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
