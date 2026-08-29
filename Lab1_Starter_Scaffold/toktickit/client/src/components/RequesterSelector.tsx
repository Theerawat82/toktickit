import React from "react";
import { useRequester } from "../context/RequesterContext.js";

const ZEN_GREEN = "#006B3C";

/**
 * RequesterSelector
 *
 * A compact Bootstrap dropdown that lets a developer quickly switch the
 * "acting" requester identity used throughout the app.
 *
 * Reads/writes through RequesterContext – wrap the app in <RequesterProvider>
 * before rendering this component.
 */
export default function RequesterSelector() {
  const { requesters, activeRequester, setActiveRequester, loading, error } =
    useRequester();

  if (loading) {
    return (
      <div
        className="d-flex align-items-center gap-2 py-2"
        data-testid="loading-spinner"
      >
        <span
          className="spinner-border spinner-border-sm"
          role="status"
          aria-hidden="true"
          style={{ color: ZEN_GREEN }}
        />
        <span className="text-muted small">Fetching requesters…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="alert alert-danger py-2 mb-0 small"
        data-testid="error-message"
      >
        {error}
      </div>
    );
  }

  return (
    <div className="d-flex align-items-center gap-2 flex-wrap">
      <label
        htmlFor="requester-selector"
        className="fw-semibold mb-0 small"
        style={{ color: ZEN_GREEN }}
      >
        Acting as:
      </label>

      <select
        id="requester-selector"
        className="form-select form-select-sm"
        style={{ maxWidth: 280, borderColor: ZEN_GREEN }}
        data-testid="requester-dropdown"
        value={activeRequester?.id ?? ""}
        onChange={(e) => {
          const chosen = requesters.find(
            (r) => String(r.id) === e.target.value
          );
          if (chosen) setActiveRequester(chosen);
        }}
      >
        <option value="" disabled>
          — Select requester —
        </option>
        {requesters.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name} ({r.email})
          </option>
        ))}
      </select>

      {activeRequester && (
        <span
          className="badge"
          style={{ backgroundColor: ZEN_GREEN }}
          data-testid="active-requester-badge"
        >
          ✓ {activeRequester.name}
        </span>
      )}
    </div>
  );
}
