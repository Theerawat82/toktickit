import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface Requester {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

interface RequesterContextValue {
  /** List of active requesters fetched from the API */
  requesters: Requester[];
  /** Currently selected requester (null = not yet chosen) */
  activeRequester: Requester | null;
  /** Select a requester and persist to localStorage */
  setActiveRequester: (requester: Requester) => void;
  /** Loading state while fetching requesters */
  loading: boolean;
  /** Error message if the fetch failed */
  error: string;
  /** Re-fetch requesters from the API */
  refetch: () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
export const RequesterContext = createContext<RequesterContextValue | undefined>(
  undefined
);

// localStorage key – shared with the legacy DevelopmentRequesterSelection component
const STORAGE_KEY = "dev_requester_id";

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function RequesterProvider({ children }: { children: ReactNode }) {
  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [activeRequester, setActiveRequesterState] =
    useState<Requester | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchRequesters = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/requesters?active=true");
      if (!res.ok) throw new Error("Failed to fetch requesters");
      const data: Requester[] = await res.json();
      setRequesters(data);

      // Restore previously saved selection from localStorage
      const savedId = localStorage.getItem(STORAGE_KEY);
      if (savedId) {
        const found = data.find((r) => String(r.id) === savedId);
        if (found) setActiveRequesterState(found);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequesters();
  }, [fetchRequesters]);

  const setActiveRequester = useCallback((requester: Requester) => {
    setActiveRequesterState(requester);
    localStorage.setItem(STORAGE_KEY, String(requester.id));
  }, []);

  return (
    <RequesterContext.Provider
      value={{
        requesters,
        activeRequester,
        setActiveRequester,
        loading,
        error,
        refetch: fetchRequesters,
      }}
    >
      {children}
    </RequesterContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useRequester(): RequesterContextValue {
  const ctx = useContext(RequesterContext);
  if (!ctx) {
    throw new Error("useRequester must be used inside <RequesterProvider>");
  }
  return ctx;
}
