import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import MyTickets from "../../components/MyTickets.js";
import { RequesterContext } from "../../context/RequesterContext.js";

// ── Helpers ──

const mockRequester = {
  id: 1,
  name: "Alice Johnson",
  email: "alice@example.com",
  isActive: true,
};

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
    meta: { totalTickets, page: 1, totalPages: Math.ceil(totalTickets / 8), limit: 8 },
  };
}

const renderWithContext = (
  ui: React.ReactElement,
  activeRequester: any = null
) => {
  return render(
    <RequesterContext.Provider
      value={{
        activeRequester,
        requesters: [mockRequester],
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

// ── Tests ──

describe("MyTickets Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should not render if there is no active requester", () => {
    renderWithContext(<MyTickets />);
    expect(screen.queryByTestId("my-tickets")).not.toBeInTheDocument();
  });

  it("should show loading state initially", async () => {
    // Mock fetch that never resolves during the check
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/categories")) {
        return Promise.resolve({ ok: true, json: async () => mockCategories });
      }
      // Delay the tickets response
      return new Promise(() => {}); // never resolves
    }) as any;

    renderWithContext(<MyTickets />, mockRequester);
    expect(screen.getByTestId("loading-state")).toBeInTheDocument();
    expect(screen.getByText("Loading tickets...")).toBeInTheDocument();
  });

  it("should render ticket table when data is loaded", async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/categories")) {
        return Promise.resolve({ ok: true, json: async () => mockCategories });
      }
      return Promise.resolve({
        ok: true,
        json: async () => buildResponse(mockTickets),
      });
    }) as any;

    renderWithContext(<MyTickets />, mockRequester);

    await waitFor(() => {
      expect(screen.getByTestId("desktop-table")).toBeInTheDocument();
    });

    expect(screen.getAllByText("TIK-00001").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("TIK-00002").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Laptop keyboard not working").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("VPN connection timeout").length).toBeGreaterThanOrEqual(1);
  });

  it("should display empty state when requester has no tickets", async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/categories")) {
        return Promise.resolve({ ok: true, json: async () => mockCategories });
      }
      return Promise.resolve({
        ok: true,
        json: async () => buildResponse([]),
      });
    }) as any;

    renderWithContext(<MyTickets />, mockRequester);

    await waitFor(() => {
      expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    });

    expect(screen.getByText("No tickets yet")).toBeInTheDocument();
    expect(screen.getByText("+ Create Your First Ticket")).toBeInTheDocument();
  });

  it("should display no-results state when filters yield zero", async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/categories")) {
        return Promise.resolve({ ok: true, json: async () => mockCategories });
      }
      callCount++;
      // First call: return some tickets so hasEverLoaded becomes true
      if (callCount === 1) {
        return Promise.resolve({
          ok: true,
          json: async () => buildResponse(mockTickets),
        });
      }
      // Subsequent calls (after filter change): return empty
      return Promise.resolve({
        ok: true,
        json: async () => buildResponse([]),
      });
    }) as any;

    renderWithContext(<MyTickets />, mockRequester);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId("desktop-table")).toBeInTheDocument();
    });

    // Trigger a filter change to produce no results
    const searchInput = screen.getByTestId("search-input");
    await userEvent.type(searchInput, "nonexistent-xyz");

    await waitFor(() => {
      expect(screen.getByTestId("no-results-state")).toBeInTheDocument();
    });

    expect(screen.getByText("No matching tickets")).toBeInTheDocument();
  });

  it("should render filter controls", async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/categories")) {
        return Promise.resolve({ ok: true, json: async () => mockCategories });
      }
      return Promise.resolve({
        ok: true,
        json: async () => buildResponse(mockTickets),
      });
    }) as any;

    renderWithContext(<MyTickets />, mockRequester);

    await waitFor(() => {
      expect(screen.getByTestId("filter-controls")).toBeInTheDocument();
    });

    expect(screen.getByTestId("search-input")).toBeInTheDocument();
    expect(screen.getByTestId("filter-category")).toBeInTheDocument();
    expect(screen.getByTestId("filter-priority")).toBeInTheDocument();
    expect(screen.getByTestId("filter-status")).toBeInTheDocument();
    expect(screen.getByTestId("sort-select")).toBeInTheDocument();
  });

  it("should render pagination bar with correct info", async () => {
    const lotsOfTickets = buildResponse(mockTickets, 20);
    lotsOfTickets.meta.totalPages = 3;

    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/categories")) {
        return Promise.resolve({ ok: true, json: async () => mockCategories });
      }
      return Promise.resolve({
        ok: true,
        json: async () => lotsOfTickets,
      });
    }) as any;

    renderWithContext(<MyTickets />, mockRequester);

    await waitFor(() => {
      expect(screen.getByTestId("pagination-bar")).toBeInTheDocument();
    });

    expect(screen.getByTestId("pagination-info")).toHaveTextContent("Showing 1 to 8 of 20 tickets");
    expect(screen.getByTestId("prev-page-btn")).toBeDisabled();
    expect(screen.getByTestId("next-page-btn")).toBeEnabled();
  });

  it("should show Clear Filters button in header when filters are active", async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/categories")) {
        return Promise.resolve({ ok: true, json: async () => mockCategories });
      }
      return Promise.resolve({
        ok: true,
        json: async () => buildResponse(mockTickets),
      });
    }) as any;

    renderWithContext(<MyTickets />, mockRequester);

    await waitFor(() => {
      expect(screen.getByTestId("desktop-table")).toBeInTheDocument();
    });

    // Initially no clear filters button
    expect(screen.queryByTestId("clear-filters-btn")).not.toBeInTheDocument();

    // Type into search
    const searchInput = screen.getByTestId("search-input");
    await userEvent.type(searchInput, "test");

    await waitFor(() => {
      expect(screen.getByTestId("clear-filters-btn")).toBeInTheDocument();
    });
  });
});
