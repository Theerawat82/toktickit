import React, { useState, useEffect } from "react";
import { apiFetch } from "../api.js";

import { ZEN } from "../theme.js";

interface ActionTaken {
  id: number;
  ticketId: number;
  actionDateTime: string;
  actionDescription: string;
  result: string;
  performedById: number;
  performedBy: { id: number; name: string; role: string };
  followUpRequired: boolean;
  followUpNote: string | null;
  attachmentNotes: string | null;
  version: number;
}

export default function ActionsTaken({ ticketId, userRole }: { ticketId: number, userRole: string }) {
  const [actions, setActions] = useState<ActionTaken[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [createMode, setCreateMode] = useState(false);
  const [editActionId, setEditActionId] = useState<number | null>(null);

  // Form State
  const [actionDescription, setActionDescription] = useState("");
  const [result, setResult] = useState("");
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpNote, setFollowUpNote] = useState("");
  const [attachmentNotes, setAttachmentNotes] = useState("");
  const [version, setVersion] = useState<number | null>(null);
  
  const [readOnlyFields, setReadOnlyFields] = useState<{date: string, author: string} | null>(null);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [conflictMsg, setConflictMsg] = useState("");

  const isStaffOrAdmin = userRole === "IT_Staff" || userRole === "Administrator";

  const fetchActions = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/tickets/${ticketId}/actions`);
      if (res.ok) {
        const data = await res.json();
        setActions(Array.isArray(data) ? data : (data.actions || []));
      } else {
        setError("Failed to fetch actions");
      }
    } catch (e) {
      setError("Error fetching actions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, [ticketId]);

  const handleCreateOpen = () => {
    setCreateMode(true);
    setEditActionId(null);
    setActionDescription("");
    setResult("");
    setFollowUpRequired(false);
    setFollowUpNote("");
    setAttachmentNotes("");
    setFormError("");
    setConflictMsg("");
  };

  const handleEditOpen = (action: ActionTaken) => {
    setCreateMode(false);
    setEditActionId(action.id);
    setActionDescription(action.actionDescription);
    setResult(action.result);
    setFollowUpRequired(action.followUpRequired);
    setFollowUpNote(action.followUpNote || "");
    setAttachmentNotes(action.attachmentNotes || "");
    setVersion(action.version);
    setReadOnlyFields({
      date: new Date(action.actionDateTime).toLocaleString(),
      author: action.performedBy.name
    });
    setFormError("");
    setConflictMsg("");
  };

  const handleCancel = () => {
    setCreateMode(false);
    setEditActionId(null);
    setFormError("");
    setConflictMsg("");
  };

  const validate = () => {
    if (!actionDescription.trim()) return "Action Description is required.";
    if (!result.trim()) return "Result is required.";
    if (followUpRequired && !followUpNote.trim()) return "Follow-up note is required when follow-up is required.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }
    setFormLoading(true);
    setFormError("");
    setConflictMsg("");

    const payload = {
      actionDescription,
      result,
      followUpRequired,
      followUpNote,
      attachmentNotes,
      ...(editActionId && { version })
    };

    try {
      const endpoint = editActionId 
        ? `/api/tickets/${ticketId}/actions/${editActionId}`
        : `/api/tickets/${ticketId}/actions`;
      
      const res = await apiFetch(endpoint, {
        method: editActionId ? "PATCH" : "POST",
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (editActionId) {
          setActions(actions.map(a => a.id === data.id ? data : a));
        } else {
          setActions([...actions, data]);
        }
        handleCancel();
      } else if (res.status === 409) {
        const errorData = await res.json();
        setConflictMsg("This action was updated by someone else — showing the latest version");
        const currentServerRow = errorData.currentServerRow;
        if (currentServerRow) {
          setActionDescription(currentServerRow.actionDescription);
          setResult(currentServerRow.result);
          setFollowUpRequired(currentServerRow.followUpRequired);
          setFollowUpNote(currentServerRow.followUpNote || "");
          setAttachmentNotes(currentServerRow.attachmentNotes || "");
          setVersion(currentServerRow.version);
        }
      } else {
        const errorData = await res.json();
        setFormError(errorData.error || "Failed to save action");
      }
    } catch (error) {
      setFormError("Network error occurred");
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <div className="text-muted p-3">Loading Actions...</div>;
  if (error) return <div className="alert alert-danger p-2" role="alert" style={{ color: ZEN.error }}>{error}</div>;

  return (
    <div className="card mb-4" style={{ borderColor: ZEN.border, backgroundColor: ZEN.white }}>
      <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center" style={{ borderBottom: `1px solid ${ZEN.border}` }}>
        <h3 style={{ color: ZEN.primary, margin: 0, fontWeight: 700, fontSize: "1.25rem" }}>Actions Taken</h3>
        {isStaffOrAdmin && !createMode && editActionId === null && (
          <button
            className="btn btn-sm text-white fw-semibold"
            style={{ backgroundColor: ZEN.primary, borderColor: ZEN.primary }}
            onClick={handleCreateOpen}
          >
            <span>+ </span><span>Add Action Taken</span>
          </button>
        )}
      </div>

      <div className="card-body p-3">
        {actions.length === 0 ? (
          <div className="text-center text-muted py-4">No actions taken yet.</div>
        ) : (
          <>
            <div className="d-block d-md-none text-muted" style={{ fontSize: '0.85em', marginBottom: '6px' }}>
              <small className="fw-semibold">Scroll for more →</small>
            </div>
            <div style={{ overflowX: 'auto', marginBottom: '10px' }}>
              <table className="table table-hover align-middle mb-0" style={{ width: '100%', borderCollapse: 'collapse', borderColor: ZEN.border }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${ZEN.border}`, textAlign: 'left', backgroundColor: ZEN.pageBg, color: ZEN.neutral, fontSize: '0.85rem' }}>
                    <th className="py-2 px-3">Date/Time</th>
                    <th className="py-2 px-3">Performed By</th>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3">Result</th>
                    <th className="py-2 px-3">Follow-up</th>
                    <th className="py-2 px-3">Attachment Notes</th>
                    {isStaffOrAdmin && <th className="py-2 px-3 text-end">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {actions.map(action => (
                    <tr key={action.id} style={{ borderBottom: `1px solid ${ZEN.border}` }}>
                      <td className="py-2 px-3 text-nowrap" style={{ fontSize: '0.9rem', color: ZEN.neutral }}>{new Date(action.actionDateTime).toLocaleString()}</td>
                      <td className="py-2 px-3 fw-semibold" style={{ fontSize: '0.9rem', color: ZEN.primary }}>{action.performedBy.name}</td>
                      <td className="py-2 px-3" style={{ fontSize: '0.9rem' }}>{action.actionDescription}</td>
                      <td className="py-2 px-3" style={{ fontSize: '0.9rem' }}>{action.result}</td>
                      <td className="py-2 px-3 text-nowrap" style={{ fontSize: '0.9rem' }}>
                        {action.followUpRequired ? (
                          <span className="badge" style={{ backgroundColor: "#FFF7E6", color: "#B54708", border: "1px solid #FEDF89" }}>
                            Yes - {action.followUpNote}
                          </span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: "#F2F4F7", color: "#667085" }}>No</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-muted" style={{ fontSize: '0.9rem' }}>{action.attachmentNotes || "—"}</td>
                      {isStaffOrAdmin && (
                        <td className="py-2 px-3 text-end">
                          <button
                            className="btn btn-sm btn-outline-secondary py-1 px-2"
                            onClick={() => handleEditOpen(action)}
                          >
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {(createMode || editActionId !== null) && (
          <form
            onSubmit={handleSubmit}
            className="p-3 rounded mt-3"
            style={{ border: `1px solid ${ZEN.primary}`, backgroundColor: "#FAFCFA" }}
          >
            <h5 className="fw-bold mb-3" style={{ color: ZEN.primary }}>
              {createMode ? "Add Action Taken" : "Edit Action Taken"}
            </h5>
            
            {conflictMsg && (
              <div className="alert alert-warning py-2 px-3 mb-3 fw-semibold" role="alert" style={{ borderColor: ZEN.warning }}>
                ⚠️ {conflictMsg}
              </div>
            )}
            {formError && (
              <div className="alert alert-danger py-2 px-3 mb-3 fw-semibold" role="alert" style={{ borderColor: ZEN.error }}>
                {formError}
              </div>
            )}

            {editActionId && readOnlyFields && (
              <div className="p-2 mb-3 rounded bg-white" style={{ border: `1px solid ${ZEN.border}`, fontSize: '0.875rem', color: ZEN.neutral }}>
                <div><strong>Date:</strong> {readOnlyFields.date}</div>
                <div><strong>Performed By:</strong> <span className="fw-semibold text-success">{readOnlyFields.author}</span> (auto-assigned from session)</div>
              </div>
            )}

            <div className="mb-3">
              <label htmlFor="actionDescription" className="form-label fw-semibold small" style={{ color: ZEN.neutral }}>
                Action Description <span className="text-danger">*</span>
              </label>
              <textarea
                id="actionDescription"
                name="actionDescription"
                className="form-control form-control-sm"
                rows={3}
                value={actionDescription}
                onChange={e => setActionDescription(e.target.value)}
                style={{ borderColor: ZEN.border }}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="result" className="form-label fw-semibold small" style={{ color: ZEN.neutral }}>
                Result <span className="text-danger">*</span>
              </label>
              <textarea
                id="result"
                name="result"
                className="form-control form-control-sm"
                rows={2}
                value={result}
                onChange={e => setResult(e.target.value)}
                style={{ borderColor: ZEN.border }}
              />
            </div>

            <div className="form-check mb-3">
              <input
                id="followUpRequired"
                type="checkbox"
                className="form-check-input"
                checked={followUpRequired}
                onChange={e => setFollowUpRequired(e.target.checked)}
              />
              <label htmlFor="followUpRequired" className="form-check-label fw-semibold small" style={{ color: ZEN.neutral }}>
                Follow-Up Required
              </label>
            </div>

            {followUpRequired && (
              <div className="mb-3 ps-3" style={{ borderLeft: `3px solid ${ZEN.warning}` }}>
                <label htmlFor="followUpNote" className="form-label fw-semibold small text-danger">
                  Follow-up Note *
                </label>
                <textarea
                  id="followUpNote"
                  className="form-control form-control-sm"
                  rows={2}
                  value={followUpNote}
                  onChange={e => setFollowUpNote(e.target.value)}
                  placeholder="Specify what follow-up action is required..."
                  style={{ borderColor: ZEN.border }}
                />
              </div>
            )}

            <div className="mb-3">
              <label htmlFor="attachmentNotes" className="form-label fw-semibold small text-muted">
                Attachment Notes (Optional)
              </label>
              <textarea
                id="attachmentNotes"
                className="form-control form-control-sm"
                rows={2}
                value={attachmentNotes}
                onChange={e => setAttachmentNotes(e.target.value)}
                placeholder="Optional notes regarding attachments or logs..."
                style={{ borderColor: ZEN.border }}
              />
            </div>

            <div className="d-flex gap-2">
              <button
                type="submit"
                disabled={formLoading}
                className="btn btn-sm text-white px-3 fw-semibold"
                style={{ backgroundColor: ZEN.primary, borderColor: ZEN.primary }}
              >
                {formLoading ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={formLoading}
                className="btn btn-sm btn-outline-secondary px-3"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}



