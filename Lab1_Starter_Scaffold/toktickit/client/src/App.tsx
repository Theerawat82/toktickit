import React, { useState, useCallback, useEffect } from "react";
import { checkSystem, Category } from "./api.js";
import { useAuth } from "./context/AuthContext.js";
import Login from "./components/Login.js";
import ChangePassword from "./components/ChangePassword.js";
import CreateTicket from "./components/CreateTicket.js";
import MyTickets from "./components/MyTickets.js";
import RequesterTicketDetail from "./components/RequesterTicketDetail.js";
import ProtectedRoute from "./components/ProtectedRoute.js";

type UiState = "idle" | "loading" | "success" | "error";

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const [state, setState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [currentHash, setCurrentHash] = useState(window.location.hash);

  useEffect(() => {
    const onHashChange = () => setCurrentHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const ticketMatch = currentHash.match(/^#ticket\/(\d+)$/);
  const ticketId = ticketMatch ? Number(ticketMatch[1]) : null;

  const loadData = useCallback(async () => {
    setState("loading");
    setCategories([]);
    setErrorMsg("");
    try {
      const [status] = await Promise.all([
        checkSystem(),
        new Promise<void>((res) => setTimeout(res, 700)),
      ]);
      if (status.online) {
        setState("success");
        setCategories(status.categories);
      }
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
    }
  }, []);

  return (
    <ProtectedRoute>
      <div className="container py-5" style={{ maxWidth: 640 }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="h3 mb-1">
              TokTickIT <span className="text-success">IT Service Desk</span>
            </h1>
            <p className="text-muted mb-0">IT Support Request System</p>
          </div>
          <div className="text-end">
            <div className="fw-bold">{user?.name}</div>
            <div className="small text-muted mb-2">{user?.role}</div>
            <button className="btn btn-sm btn-outline-danger" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        <>
          {ticketId ? (
            <RequesterTicketDetail ticketId={ticketId} />
          ) : (
            <>
              <CreateTicket />
              <MyTickets />
            </>
          )}

          <hr className="my-4" />

          <button
            className="btn btn-primary mb-3"
            onClick={loadData}
            disabled={state === "loading"}
          >
            [Check System]
          </button>

          {state === "loading" && (
            <div className="alert alert-info d-flex align-items-center gap-2">
              <span role="img" aria-label="hourglass">⏳</span>
              <strong>Loading...</strong>
            </div>
          )}

          {state === "error" && (
            <div className="alert alert-danger">
              <h5 className="alert-heading mb-1">❌ System Status: Offline</h5>
              <hr className="my-2" />
              <p className="mb-1">
                The backend API is currently unavailable. Please try again later.
              </p>
              <p className="mb-0">
                <small className="text-danger-emphasis">
                  Unable to connect to TokTickIT API
                  {errorMsg ? ` — ${errorMsg}` : ""}
                </small>
              </p>
            </div>
          )}

          {state === "success" && (
            <div className="card border-success">
              <div className="card-header bg-success text-white d-flex align-items-center gap-2">
                <span role="img" aria-label="check">✅</span>
                <strong>System Status: Online</strong>
              </div>
              <div className="card-body">
                <p className="text-muted small mb-3">Connected to TokTickIT API!</p>
                <h6 className="fw-semibold mb-2">Supported Request Categories</h6>
                <ul className="list-group list-group-flush">
                  {categories.map((c) => (
                    <li key={c.id} className="list-group-item px-0">
                      {c.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      </div>
    </ProtectedRoute>
  );
}
