import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import MyTickets from "../../components/MyTickets";

// ── Mock apiFetch ──
const apiFetchMock = vi.fn();
vi.mock("../../api", () => ({
  apiFetch: (...args: any[]) => apiFetchMock(...args),
}));

// ── Mock useAuth – every test gets an authenticated Requester ──
const mockUser = { id: 1, role: "Requester", name: "Alice Johnson", email: "alice@example.com", mustChangePassword: false };
const mockAuth = { user: mockUser, loading: false, logout: vi.fn() };
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => mockAuth,
}));

// ── Helpers ──

const mockCategories = [
  { id: 1, name: "Hardware" },
  { id: 2, name: "Network" },
];

const mockTickets = [
  {
    id: 1,
    ticketNumber: "TIK-00001",
    summary: "Laptop keyboard not working",
    requestedPriority: "High",
    currentStatus: "New",
    createdAt: "2026-08-01T10:00:00Z",
    updatedAt: "2026-08-02T10:00:00Z",
    requesterUserId: 1,
    categoryId: 1,
    category: { id: 1, name: "Hardware" },
    requesterUser: { id: 1, name: "Alice Johnson", email: "alice@example.com" },
  },
  {
    id: 2,
    ticketNumber: "TIK-00002",
    summary: "VPN connection timeout",
    requestedPriority: "Medium",
    currentStatus: "Open",
    createdAt: "2026-08-03T10:00:00Z",
    updatedAt: "2026-08-04T10:00:00Z",
    requesterUserId: 1,
    categoryId: 2,
    category: { id: 2, name: "Network" },
    requesterUser: { id: 1, name: "Alice Johnson", email: "alice@example.com" },
  },
];

function buildResponse(data: any[], total?: number) {
  const totalTickets = total ?? data.length;
  return {
    data,
    meta: { totalTickets, page: 1, totalPages: Math.ceil(totalTickets / 8) || 1, limit: 8 },
  };
}

/**
 * Default apiFetch stub: categories → mockCategories, tickets → given payload.
 */
function setupApiFetch(ticketPayload: any = buildResponse(mockTickets)) {
  apiFetchMock.mockImplementation((url: string) => {
    if (url.includes("/api/categories")) {
      return Promise.resolve({ ok: true, json: async () => mockCategories });
    }
    // tickets endpoint
    return Promise.resolve({ ok: true, json: async () => ticketPayload });
  });
}

// ── Tests ──

describe("MyTickets Component", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should show loading state initially", async () => {
    apiFetchMock.mockImplementation((url: string) => {
      if (url.includes("/api/categories")) {
        return Promise.resolve({ ok: true, json: async () => mockCategories });
      }
      // Delay the tickets response – never resolves
      return new Promise(() => {});
    });

    render(<MyTickets />);
    expect(screen.getByTestId("loading-state")).toBeInTheDocument();
    expect(screen.getByText("Loading tickets...")).toBeInTheDocument();
  });

  it("should render ticket table when data is loaded", async () => {
    setupApiFetch();
    render(<MyTickets />);

    await waitFor(() => {
      expect(screen.getByTestId("desktop-table")).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getAllByText("TIK-00001").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("TIK-00002").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Laptop keyboard not working").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("VPN connection timeout").length).toBeGreaterThanOrEqual(1);
  });

  it("should display empty state when requester has no tickets", async () => {
    setupApiFetch(buildResponse([]));
    render(<MyTickets />);

    await waitFor(() => {
      expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText("No tickets yet")).toBeInTheDocument();
    expect(screen.getByText("+ Create Your First Ticket")).toBeInTheDocument();
  });

  it("should display no-results state when filters yield zero", async () => {
    let callCount = 0;
    apiFetchMock.mockImplementation((url: string) => {
      if (url.includes("/api/categories")) {
        return Promise.resolve({ ok: true, json: async () => mockCategories });
      }
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({ ok: true, json: async () => buildResponse(mockTickets) });
      }
      return Promise.resolve({ ok: true, json: async () => buildResponse([]) });
    });

    render(<MyTickets />);

    await waitFor(() => {
      expect(screen.getByTestId("desktop-table")).toBeInTheDocument();
    }, { timeout: 3000 });

    const searchInput = screen.getByTestId("search-input");
    await userEvent.type(searchInput, "nonexistent-xyz");

    await waitFor(() => {
      expect(screen.getByTestId("no-results-state")).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByText("No matching tickets")).toBeInTheDocument();
  });

  it("should render filter controls", async () => {
    setupApiFetch();
    render(<MyTickets />);

    await waitFor(() => {
      expect(screen.getByTestId("filter-controls")).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByTestId("search-input")).toBeInTheDocument();
    expect(screen.getByTestId("filter-category")).toBeInTheDocument();
    expect(screen.getByTestId("filter-priority")).toBeInTheDocument();
    expect(screen.getByTestId("filter-status")).toBeInTheDocument();
    expect(screen.getByTestId("sort-select")).toBeInTheDocument();
  });

  it("should render pagination bar with correct info", async () => {
    const lotsOfTickets = buildResponse(mockTickets, 20);
    lotsOfTickets.meta.totalPages = 3;

    setupApiFetch(lotsOfTickets);
    render(<MyTickets />);

    await waitFor(() => {
      expect(screen.getByTestId("pagination-bar")).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByTestId("pagination-info")).toHaveTextContent("Showing 1 to 8 of 20 tickets");
    expect(screen.getByTestId("prev-page-btn")).toBeDisabled();
    expect(screen.getByTestId("next-page-btn")).toBeEnabled();
  });

  it("should show Clear Filters button in header when filters are active", async () => {
    setupApiFetch();
    render(<MyTickets />);

    await waitFor(() => {
      expect(screen.getByTestId("desktop-table")).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.queryByTestId("clear-filters-btn")).not.toBeInTheDocument();

    const searchInput = screen.getByTestId("search-input");
    await userEvent.type(searchInput, "test");

    await waitFor(() => {
      expect(screen.getByTestId("clear-filters-btn")).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
