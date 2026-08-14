import { useState } from "react";
import { checkSystem, Category } from "./api.js";

// UI states you must handle for Issue 4: idle, loading, success, error.
type UiState = "idle" | "loading" | "success" | "error";

export default function App() {
  const [state, setState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  void categories;

  async function handleCheck() {
    setState("loading");
    try {
      const status = await checkSystem();
      if (status.online) {
        setState("success");
        setCategories(status.categories);
      }
    } catch (err) {
      setState("error");
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: 640 }}>
      <h1 className="h3 mb-4">
        TokTickIT <span className="text-success">IT Service Desk</span>
      </h1>

      <button className="btn btn-success" onClick={handleCheck} disabled={state === "loading"}>
        {state === "loading" ? "Loading…" : "Check System"}
      </button>

      {state === "error" && (
        <div className="alert alert-danger mt-4">
          <strong>Offline:</strong> The backend API is currently unavailable. Please try again later.
        </div>
      )}
      {state === "success" && (
        <div className="alert alert-success mt-4">
          <strong>Online:</strong> Connected to TokTickIT API!
        </div>
      )}
    </div>
  );
}
