import { useState, useEffect } from "react";
import { checkSystem, Category } from "./api.js";

// UI states you must handle for Issue 4: idle, loading, success, error.
type UiState = "idle" | "loading" | "success" | "error";

export default function App() {
  const [state, setState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function loadData() {
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
    loadData();
  }, []);

  return (
    <div className="container py-5" style={{ maxWidth: 640 }}>
      <h1 className="h3 mb-4">
        TokTickIT <span className="text-success">IT Service Desk</span>
      </h1>

      {state === "loading" && (
        <div className="alert alert-info mt-4">
          <strong>Loading...</strong>
        </div>
      )}
      
      {state === "error" && (
        <div className="alert alert-danger mt-4">
          <strong>Offline:</strong> The backend API is currently unavailable. Please try again later.
        </div>
      )}
      
      {state === "success" && (
        <div className="alert alert-success mt-4">
          <strong>Online:</strong> Connected to TokTickIT API!
          <ul className="mt-3 mb-0">
            {categories.map((c) => (
              <li key={c.id}>{c.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
