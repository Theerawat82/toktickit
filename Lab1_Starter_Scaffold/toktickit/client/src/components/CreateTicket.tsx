import React, { useState, useEffect } from "react";
import { useRequester } from "../context/RequesterContext.js";

const ZEN_GREEN = "#006B3C";

interface Category {
  id: number;
  name: string;
}

interface System {
  id: number;
  name: string;
}

export default function CreateTicket() {
  const { activeRequester } = useRequester();

  const [categories, setCategories] = useState<Category[]>([]);
  const [systems, setSystems] = useState<System[]>([]);

  // Form State
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [systemId, setSystemId] = useState("");
  const [requestedPriority, setRequestedPriority] = useState("Medium");

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [apiError, setApiError] = useState("");

  // Validation State (real-time)
  const [summaryError, setSummaryError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");

  useEffect(() => {
    // Fetch reference data
    const fetchRefData = async () => {
      try {
        const [catRes, sysRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/related-systems")
        ]);

        if (catRes.ok) setCategories(await catRes.json());
        if (sysRes.ok) setSystems(await sysRes.json());
      } catch (error) {
        console.error("Failed to load reference data", error);
      }
    };
    fetchRefData();
  }, []);

  // Real-time validation
  useEffect(() => {
    if (summary !== "") {
      if (summary.trim().length === 0) setSummaryError("Summary cannot be empty");
      else if (summary.length > 200) setSummaryError("Summary cannot exceed 200 characters");
      else setSummaryError("");
    } else {
      setSummaryError("");
    }
  }, [summary]);

  useEffect(() => {
    if (description !== "") {
      if (description.trim().length < 20) setDescriptionError("Description must be at least 20 characters long");
      else setDescriptionError("");
    } else {
      setDescriptionError("");
    }
  }, [description]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    setSuccessMessage("");

    // Final validation before submit
    let isValid = true;
    if (summary.trim().length === 0 || summary.length > 200) {
      setSummaryError(summary.length > 200 ? "Summary cannot exceed 200 characters" : "Summary cannot be empty");
      isValid = false;
    }
    if (description.trim().length < 20) {
      setDescriptionError("Description must be at least 20 characters long");
      isValid = false;
    }
    if (!categoryId || !systemId) {
      setApiError("Please select a category and related system.");
      isValid = false;
    }
    if (!activeRequester) {
      setApiError("Active requester context is missing.");
      isValid = false;
    }

    if (!isValid) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary,
          description,
          categoryId: Number(categoryId),
          systemId: Number(systemId),
          requestedPriority,
          requesterId: activeRequester!.id
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create ticket");
      }

      setSuccessMessage(`Ticket created successfully! Ticket Number: ${data.ticketNumber}`);
      
      // Reset form
      setSummary("");
      setDescription("");
      setCategoryId("");
      setSystemId("");
      setRequestedPriority("Medium");
      setSummaryError("");
      setDescriptionError("");
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activeRequester) {
    return null; // Do not render if no active requester
  }

  return (
    <div className="card mb-4" style={{ borderColor: ZEN_GREEN }}>
      <div
        className="card-header text-white d-flex align-items-center gap-2"
        style={{ backgroundColor: ZEN_GREEN }}
      >
        <span role="img" aria-label="ticket">🎟️</span>
        <strong>Create New Ticket</strong>
      </div>
      <div className="card-body">
        {successMessage && (
          <div className="alert alert-success" data-testid="success-banner">
            {successMessage}
          </div>
        )}
        
        {apiError && (
          <div className="alert alert-danger" data-testid="error-banner">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} data-testid="create-ticket-form">
          <div className="mb-3">
            <label className="form-label fw-bold">Requester</label>
            <input
              type="text"
              className="form-control"
              value={`${activeRequester.name} (${activeRequester.email})`}
              disabled
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold">Summary *</label>
            <input
              type="text"
              className={`form-control ${summaryError ? "is-invalid" : ""}`}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief description of the issue"
              data-testid="input-summary"
            />
            {summaryError && <div className="invalid-feedback">{summaryError}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold">Description *</label>
            <textarea
              className={`form-control ${descriptionError ? "is-invalid" : ""}`}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide detailed information (at least 20 characters)"
              data-testid="input-description"
            ></textarea>
            {descriptionError && <div className="invalid-feedback">{descriptionError}</div>}
          </div>

          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label fw-bold">Category *</label>
              <select
                className="form-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                data-testid="select-category"
              >
                <option value="" disabled>Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label fw-bold">Related System *</label>
              <select
                className="form-select"
                value={systemId}
                onChange={(e) => setSystemId(e.target.value)}
                data-testid="select-system"
              >
                <option value="" disabled>Select System</option>
                {systems.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label fw-bold">Priority *</label>
              <select
                className="form-select"
                value={requestedPriority}
                onChange={(e) => setRequestedPriority(e.target.value)}
                data-testid="select-priority"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn text-white"
            style={{ backgroundColor: ZEN_GREEN }}
            disabled={isSubmitting}
            data-testid="submit-ticket-btn"
          >
            {isSubmitting ? "Submitting..." : "Submit Ticket"}
          </button>
        </form>
      </div>
    </div>
  );
}
