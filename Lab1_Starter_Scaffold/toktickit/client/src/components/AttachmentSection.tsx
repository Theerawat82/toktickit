import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext.js";
import { apiFetch } from "../api.js";

import { ZEN } from '../theme.js';

export interface Attachment {
  id: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  isRemoved: boolean;
  removedAt: string | null;
  removalReason: string | null;
  createdAt: string;
}

interface AttachmentSectionProps {
  ticketId: number;
  attachments: Attachment[];
  onAttachmentUpdated: () => void;
}

export default function AttachmentSection({ ticketId, attachments, onAttachmentUpdated }: AttachmentSectionProps) {
  const { user } = useAuth();
  
  // Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Soft Remove State
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [removalReason, setRemovalReason] = useState("");
  const [removeError, setRemoveError] = useState("");

  // Download Error Modal State
  const [errorModal, setErrorModal] = useState<{
    show: boolean;
    title: string;
    message: string;
  }>({ show: false, title: "", message: "" });

  const activeAttachments = attachments.filter(a => !a.isRemoved);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError("");

    // Validate client-side first
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size exceeds 5MB limit.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (activeAttachments.length >= 5) {
      setUploadError("Maximum of 5 active attachments allowed.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiFetch(`/api/tickets/${ticketId}/attachments`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload file");
      }

      onAttachmentUpdated();
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openRemoveModal = (id: number) => {
    setRemovingId(id);
    setRemovalReason("");
    setRemoveError("");
  };

  const closeRemoveModal = () => {
    setRemovingId(null);
  };

  const confirmRemove = async () => {
    if (!removalReason.trim()) {
      setRemoveError("Removal reason is required.");
      return;
    }

    try {
      const res = await apiFetch(`/api/attachments/${removingId}/remove`, {
        method: "POST",
        body: JSON.stringify({ removalReason }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove attachment");
      }

      closeRemoveModal();
      onAttachmentUpdated();
    } catch (err: unknown) {
      setRemoveError(err instanceof Error ? err.message : "Remove failed");
    }
  };

  const downloadAttachment = async (attachment: Attachment) => {
    try {
      const res = await apiFetch(`/api/attachments/${attachment.id}/download`, {
        method: "GET",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData.error || `HTTP ${res.status}: Download Blocked`;
        
        setErrorModal({
          show: true,
          title: "[Blocked Removed Download]",
          message: `Failed to download "${attachment.fileName}".\nReason: ${errorMsg}`,
        });
        return;
      }

      // Trigger normal browser download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setErrorModal({
        show: true,
        title: "Download Error",
        message: err.message || "Unable to process download request",
      });
    }
  };

  return (
    <div className="card mb-4" style={{ borderColor: ZEN.border }}>
      <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
        <strong style={{ color: ZEN.primary }}>Attachments</strong>
        <span className="badge bg-secondary rounded-pill">
          {activeAttachments.length} / 5
        </span>
      </div>
      <div className="card-body">
        {uploadError && <div className="alert alert-danger py-2 px-3 small">{uploadError}</div>}
        
        {/* Upload Button */}
        {activeAttachments.length < 5 && (
          <div className="mb-3">
            <input
              type="file"
              className="d-none"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.webp,.pdf"
            />
            <button 
              className="btn btn-sm btn-outline-primary w-100 fw-semibold"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{ color: ZEN.primary, borderColor: ZEN.primary }}
            >
              {uploading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Uploading...
                </>
              ) : (
                <>+ Upload Attachment</>
              )}
            </button>
            <div className="text-muted small mt-1 text-center" style={{ fontSize: 11 }}>
              Max 5MB. JPG, PNG, WEBP, PDF only.
            </div>
          </div>
        )}

        {attachments.length === 0 ? (
          <div className="text-center text-muted small py-3">No attachments yet.</div>
        ) : (
          <ul className="list-group list-group-flush">
            {attachments.map(att => (
              <li 
                key={att.id} 
                className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center"
                style={{ opacity: att.isRemoved ? 0.6 : 1 }}
              >
                <div className="text-truncate" style={{ maxWidth: '70%' }}>
                  {att.isRemoved ? (
                    <span 
                      className="text-decoration-line-through text-muted small"
                      style={{ cursor: "pointer" }}
                      onClick={() => downloadAttachment(att)}
                      title="Test Blocked Download"
                    >
                      📄 {att.fileName}
                    </span>
                  ) : (
                    <span 
                      className="small fw-medium text-primary text-decoration-none" 
                      style={{ cursor: "pointer" }}
                      onClick={() => downloadAttachment(att)}
                      title="Download"
                    >
                      📄 {att.fileName}
                    </span>
                  )}
                  {att.isRemoved && (
                    <div className="small text-danger mt-1" style={{ fontSize: 11 }}>
                      Removed: {att.removalReason}
                    </div>
                  )}
                </div>
                {!att.isRemoved && (
                  <button 
                    className="btn btn-sm btn-link text-danger p-0"
                    onClick={() => openRemoveModal(att.id)}
                    title="Remove attachment"
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Remove Modal */}
      {removingId !== null && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal d-block" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title">Remove Attachment</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={closeRemoveModal}></button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to remove this attachment?</p>
                  {removeError && <div className="alert alert-danger py-2">{removeError}</div>}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Reason for removal *</label>
                    <input 
                      type="text"
                      className="form-control"
                      value={removalReason}
                      onChange={e => setRemovalReason(e.target.value)}
                      placeholder="Enter a reason"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeRemoveModal}>Cancel</button>
                  <button type="button" className="btn btn-danger" onClick={confirmRemove}>Remove</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {/* Custom Blocked Download Error Modal */}
      {errorModal.show && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow rounded-3 overflow-hidden">
              {/* Red Header Bar */}
              <div className="modal-header bg-danger text-white py-3 px-4">
                <h5 className="modal-title fw-bold fs-5">{errorModal.title}</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setErrorModal({ show: false, title: "", message: "" })}
                ></button>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4 text-start">
                <p
                  className="mb-0 text-dark fs-6"
                  style={{ whiteSpace: "pre-line", lineHeight: "1.5" }}
                >
                  {errorModal.message}
                </p>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer border-0 bg-light px-4 py-2">
                <button
                  type="button"
                  className="btn btn-secondary px-4 fw-semibold"
                  onClick={() => setErrorModal({ show: false, title: "", message: "" })}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


