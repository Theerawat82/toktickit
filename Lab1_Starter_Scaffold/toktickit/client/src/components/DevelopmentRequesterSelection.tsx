import React, { useEffect, useState } from 'react';

export interface Requester {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

export default function DevelopmentRequesterSelection() {
  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    // Load initial from local storage if exists
    const stored = localStorage.getItem('dev_requester_id');
    if (stored) {
      setSelectedId(stored);
    }

    const fetchRequesters = async () => {
      try {
        const response = await fetch('/api/requesters');
        if (!response.ok) {
          throw new Error('Failed to fetch requesters');
        }
        const data = await response.json();
        setRequesters(data);
      } catch (err: any) {
        setError(err.message || 'Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchRequesters();
  }, []);

  const handleContinue = () => {
    if (selectedId) {
      localStorage.setItem('dev_requester_id', selectedId);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  const zenGreen = '#006B3C';

  return (
    <div className="card mt-4" style={{ borderColor: zenGreen }}>
      <div className="card-header text-white" style={{ backgroundColor: zenGreen }}>
        <h5 className="mb-0">Development Requester Context</h5>
      </div>
      <div className="card-body">
        {loading ? (
          <div className="d-flex align-items-center gap-2" data-testid="loading-spinner">
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ color: zenGreen }}></span>
            <span>Fetching requesters...</span>
          </div>
        ) : error ? (
          <div className="alert alert-danger" data-testid="error-message">
            {error}
          </div>
        ) : (
          <div className="mb-3">
            <label htmlFor="requesterSelect" className="form-label fw-bold" style={{ color: zenGreen }}>
              Select Requester
            </label>
            <select
              id="requesterSelect"
              className="form-select"
              data-testid="requester-dropdown"
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                setIsSaved(false);
              }}
            >
              <option value="" disabled>-- Choose a requester --</option>
              {requesters.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.email})
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          className="btn text-white mt-2"
          style={{ backgroundColor: zenGreen, borderColor: zenGreen }}
          data-testid="continue-btn"
          onClick={handleContinue}
          disabled={loading || !selectedId}
        >
          Continue
        </button>

        {isSaved && (
          <div className="mt-3 text-success fw-bold" data-testid="saved-message">
            ✅ Requester ID {selectedId} saved to development context!
          </div>
        )}
      </div>
    </div>
  );
}

