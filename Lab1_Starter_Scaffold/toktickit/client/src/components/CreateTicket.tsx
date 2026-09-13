import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.js";
import { apiFetch } from "../api.js";

const ZEN_GREEN = "#006B3C";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

interface Category {
  id: number;
  name: string;
}

interface System {
  id: number;
  name: string;
}

export default function CreateTicket() {
  const { user } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [systems, setSystems] = useState<System[]>([]);

  // Form State
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [systemId, setSystemId] = useState("");
  const [requestedPriority, setRequestedPriority] = useState("Medium");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [apiError, setApiError] = useState("");
  const [attachmentError, setAttachmentError] = useState("");

  // Validation State (real-time)
  const [summaryError, setSummaryError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");

  useEffect(() => {
    // Fetch reference data
    const fetchRefData = async () => {
      try {
        const [catRes, sysRes] = await Promise.all([
          apiFetch("/api/categories"),
          apiFetch("/api/related-systems")
        ]);

        if (catRes?.ok) setCategories(await catRes.json());
        if (sysRes?.ok) setSystems(await sysRes.json());
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAttachmentError("");
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      const totalFiles = selectedFiles.length + newFiles.length;
      if (totalFiles > MAX_FILES) {
        setAttachmentError(`Maximum ${MAX_FILES} files allowed.`);
        e.target.value = "";
        return;
      }

      for (const file of newFiles) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          setAttachmentError(`Invalid file type: ${file.name}. Allowed types: JPG, PNG, WEBP, PDF.`);
          e.target.value = "";
          return;
        }
        if (file.size > MAX_FILE_SIZE) {
          setAttachmentError(`File ${file.name} exceeds the 5MB limit.`);
          e.target.value = "";
          return;
        }
      }

      setSelectedFiles((prev) => [...prev, ...newFiles]);
      e.target.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setAttachmentError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    setSuccessMessage("");
    setAttachmentError("");

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
    if (!user) {
      setApiError("Active user context is missing.");
      isValid = false;
    }

    if (!isValid) return;

    setIsSubmitting(true);
    try {
      const res = await apiFetch("/api/tickets", {
        method: "POST",
        body: JSON.stringify({
          summary,
          description,
          categoryId: Number(categoryId),
          systemId: Number(systemId),
          requestedPriority
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create ticket");
      }

      const ticketId = data.id;

      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach((file) => {
          formData.append("attachments", file);
        });

        try {
          const uploadRes = await apiFetch(`/api/tickets/${ticketId}/attachments`, {
            method: "POST",
            body: formData
          });

          if (!uploadRes.ok) {
            alert("Ticket created successfully, but file upload failed. You can re-upload attachments in the ticket details page.");
            window.location.hash = `#ticket/${ticketId}`;
            return;
          }
        } catch (uploadErr) {
          console.error("Upload error:", uploadErr);
          alert("Ticket created successfully, but file upload failed. You can re-upload attachments in the ticket details page.");
          window.location.hash = `#ticket/${ticketId}`;
          return;
        }
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
      setSelectedFiles([]);

      // Redirect
      window.location.hash = `#ticket/${ticketId}`;
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null; // Do not render if no active user
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
              value={`${user.name} (${user.email})`}
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

          {/* Attachments Section */}
          <div className="mb-3">
            <div className="d-flex align-items-center mb-1">
              <label className="form-label fw-bold mb-0">Attachments</label>
              <span className="badge bg-secondary rounded-pill ms-2">
                {selectedFiles.length}/{MAX_FILES}
              </span>
            </div>

            <div 
              className="border rounded p-4 bg-white d-flex flex-column align-items-center text-center" 
              style={{ borderStyle: "dashed", borderColor: "#ccc" }}
            >
              <input 
                type="file" 
                id="file-upload-input" 
                multiple 
                accept=".jpg,.jpeg,.png,.webp,.pdf" 
                onChange={handleFileChange} 
                style={{ display: "none" }} 
                disabled={isSubmitting || selectedFiles.length >= MAX_FILES} 
              />
              <label 
                htmlFor="file-upload-input" 
                className={`btn ${selectedFiles.length >= MAX_FILES ? "disabled" : ""}`} 
                style={{ borderColor: ZEN_GREEN, borderStyle: "solid", borderWidth: 1, color: ZEN_GREEN, cursor: "pointer" }}
              >
                + Upload Attachment
              </label>
              <p className="text-muted small mt-2 mb-0">Max 5MB. JPG, PNG, WEBP, PDF only.</p>
            </div>

            {attachmentError && (
              <div className="text-danger small mt-1">{attachmentError}</div>
            )}

            {selectedFiles.length > 0 && (
              <ul className="list-group mt-2">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                    <span className="text-truncate" style={{ maxWidth: "85%" }}>
                      📄 {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="btn btn-link text-danger p-0 border-0 text-decoration-none"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
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
