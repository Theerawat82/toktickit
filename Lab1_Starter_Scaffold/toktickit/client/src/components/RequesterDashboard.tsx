import { ZEN } from '../theme.js';
import React, { useEffect, useState } from "react";
import { getRequesterDashboard } from "../api.js";

type RequesterDashboardData = {
  myTickets: Record<string, number>;
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
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card text-center h-100">
            <div className="card-body">
              <h5 className="card-title text-muted">Open</h5>
              <h2 className="display-6"><a href="#mytickets?currentStatus=Open,New" className="text-decoration-none" style={{ color: ZEN.primary }}>{data.myTickets["Open"] || 0}</a></h2>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card text-center h-100">
            <div className="card-body">
              <h5 className="card-title text-muted">In Progress</h5>
              <h2 className="display-6"><a href="#mytickets?currentStatus=In_Progress,Waiting_for_Requester" className="text-decoration-none" style={{ color: ZEN.primary }}>{data.myTickets["InProgress"] || 0}</a></h2>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card text-center h-100">
            <div className="card-body">
              <h5 className="card-title text-muted">Resolved</h5>
              <h2 className="display-6"><a href="#mytickets?currentStatus=Resolved" className="text-decoration-none" style={{ color: ZEN.primary }}>{data.myTickets["Resolved"] || 0}</a></h2>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-sm-6 mb-3">
          <div className="card text-center h-100">
            <div className="card-body">
              <h5 className="card-title text-muted">Closed</h5>
              <h2 className="display-6"><a href="#mytickets?currentStatus=Closed" className="text-decoration-none" style={{ color: ZEN.primary }}>{data.myTickets["Closed"] || 0}</a></h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

