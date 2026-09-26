import React, { useState, useEffect } from "react";
import { apiFetch } from "../api.js";

const ZEN = {
  primary: "#006B3C",
  error: "#D92D20",
  warning: "#F79009",
  neutral: "#344054",
  border: "#D0D5DD",
  white: "#FFFFFF",
};

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
        setActions(data);
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

  if (loading) return <div>Loading Actions...</div>;
  if (error) return <div style={{ color: ZEN.error }}>{error}</div>;

  return (
    <div style={{ marginTop: '20px' }}>
      <h3>Actions Taken</h3>
      
      {actions.length === 0 ? (
        <p>No actions taken yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${ZEN.border}`, textAlign: 'left' }}>
              <th>Date/Time</th>
              <th>Performed By</th>
              <th>Description</th>
              <th>Result</th>
              <th>Follow-up</th>
              <th>Attachment Notes</th>
              {isStaffOrAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {actions.map(action => (
              <tr key={action.id} style={{ borderBottom: `1px solid ${ZEN.border}` }}>
                <td>{new Date(action.actionDateTime).toLocaleString()}</td>
                <td>{action.performedBy.name}</td>
                <td>{action.actionDescription}</td>
                <td>{action.result}</td>
                <td>
                  {action.followUpRequired ? (
                    <span>Yes - {action.followUpNote}</span>
                  ) : "No"}
                </td>
                <td>{action.attachmentNotes || "-"}</td>
                {isStaffOrAdmin && (
                  <td>
                    <button onClick={() => handleEditOpen(action)}>Edit</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {isStaffOrAdmin && !createMode && editActionId === null && (
        <button onClick={handleCreateOpen}>Add Action Taken</button>
      )}

      {(createMode || editActionId !== null) && (
        <form onSubmit={handleSubmit} style={{ border: `1px solid ${ZEN.border}`, padding: '10px', marginTop: '10px' }}>
          <h4>{createMode ? "Add Action Taken" : "Edit Action Taken"}</h4>
          
          {conflictMsg && <div style={{ color: ZEN.warning, marginBottom: '10px', fontWeight: 'bold' }}>{conflictMsg}</div>}
          {formError && <div style={{ color: ZEN.error, marginBottom: '10px' }}>{formError}</div>}

          {editActionId && readOnlyFields && (
            <div style={{ marginBottom: '10px', color: ZEN.neutral }}>
              <strong>Date:</strong> {readOnlyFields.date} <br/>
              <strong>Performed By:</strong> {readOnlyFields.author}
            </div>
          )}

          <div style={{ marginBottom: '10px' }}>
            <label>Action Description *</label><br/>
            <textarea value={actionDescription} onChange={e => setActionDescription(e.target.value)} style={{ width: '100%' }} />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>Result *</label><br/>
            <textarea value={result} onChange={e => setResult(e.target.value)} style={{ width: '100%' }} />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>
              <input type="checkbox" checked={followUpRequired} onChange={e => setFollowUpRequired(e.target.checked)} />
              Follow-Up Required
            </label>
          </div>

          {followUpRequired && (
            <div style={{ marginBottom: '10px' }}>
              <label>Follow-up Note *</label><br/>
              <textarea value={followUpNote} onChange={e => setFollowUpNote(e.target.value)} style={{ width: '100%' }} />
            </div>
          )}

          <div style={{ marginBottom: '10px' }}>
            <label>Attachment Notes</label><br/>
            <textarea value={attachmentNotes} onChange={e => setAttachmentNotes(e.target.value)} style={{ width: '100%' }} />
          </div>

          <button type="submit" disabled={formLoading} style={{ marginRight: '10px' }}>Save</button>
          <button type="button" onClick={handleCancel} disabled={formLoading}>Cancel</button>
        </form>
      )}
    </div>
  );
}
