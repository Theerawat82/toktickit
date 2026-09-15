import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import RequesterTicketDetail from "../../components/RequesterTicketDetail.js";

const MOCK_USER = { id: 1, role: "Requester", name: "Test User", mustChangePassword: false };
vi.mock("../../context/AuthContext.js", () => ({
  useAuth: () => ({
    user: MOCK_USER,
    loading: false,
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: any) => <>{children}</>
}));
import { RequesterContext } from "../../context/RequesterContext.js";

const renderWithContext = (ui: React.ReactElement, activeRequester: any = null) => {
  return render(
    <RequesterContext.Provider
      value={{
        activeRequester,
        requesters: [],
        setActiveRequester: vi.fn(),
        loading: false,
        error: "",
        refetch: vi.fn(),
      } as any}
    >
      {ui}
    </RequesterContext.Provider>
  );
};

const mockRequester = {
  id: 1,
  name: "Alice Johnson",
  email: "alice@example.com",
  isActive: true,
};

const mockTicket = {
  id: 1,
  ticketNumber: "TIK-00001",
  summary: "Cannot login",
  description: "I am getting a 403 error when trying to login.",
  currentStatus: "New",
  requestedPriority: "High",
  category: { id: 1, name: "Access" },
  relatedSystem: { id: 1, name: "VPN" },
  requesterUser: mockRequester,
  createdAt: "2023-10-25T10:00:00Z",
  updatedAt: "2023-10-25T10:00:00Z",
  attachments: []
};

describe("RequesterTicketDetail Component", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn() as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should display loading state initially", () => {
    globalThis.fetch = vi.fn(() => new Promise(() => {})) as any; // Never resolves
    renderWithContext(<RequesterTicketDetail ticketId={1} />, mockRequester);
    expect(screen.getByText("Loading ticket details...")).toBeInTheDocument();
  });

  it("should display ticket details when data is loaded", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTicket,
    }) as any;

    renderWithContext(<RequesterTicketDetail ticketId={1} />, mockRequester);

    await waitFor(() => {
      expect(screen.getByText("TIK-00001")).toBeInTheDocument();
      expect(screen.getByText("Cannot login")).toBeInTheDocument();
      expect(screen.getByText("I am getting a 403 error when trying to login.")).toBeInTheDocument();
      expect(screen.getByText("Access")).toBeInTheDocument(); // Category
      expect(screen.getByText("VPN")).toBeInTheDocument(); // System
    });
  });

  it("should display error state if fetch fails", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Forbidden: You do not own this ticket" }),
    }) as any;

    renderWithContext(<RequesterTicketDetail ticketId={1} />, mockRequester);

    await waitFor(() => {
      expect(screen.getByText("Forbidden: You do not own this ticket")).toBeInTheDocument();
    });
  });
});
