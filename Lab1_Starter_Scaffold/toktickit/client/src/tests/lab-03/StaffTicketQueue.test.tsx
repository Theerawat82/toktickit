import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import StaffTicketQueue from "../../components/StaffTicketQueue.js";
import * as api from "../../api.js";
import * as authContext from "../../context/AuthContext.js";

vi.mock("../../api.js", () => ({
  apiFetch: vi.fn(),
}));

vi.mock("../../context/AuthContext.js", () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: any) => <>{children}</>,
}));

vi.mock("../../components/MyTickets.js", () => ({
  ZEN: {
    primary: "#006B3C",
    secondary: "#0B7A46",
    paleBg: "#EAF6EF",
    pageBg: "#F9FAFB",
    white: "#FFFFFF",
    neutral: "#344054",
    border: "#EAECF0"
  }
}));

const mockUser = {
  id: 1,
  name: "Test Staff",
  email: "staff@test.com",
  role: "IT_Staff",
};

const renderWithContext = (ui: React.ReactNode) => {
  return render(ui);
};

describe("StaffTicketQueue Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (authContext.useAuth as any).mockReturnValue({
      user: mockUser
    });
  });

  const mockCategories = [{ id: 1, name: "Hardware" }];
  const mockStaff = [{ id: 1, name: "Admin" }];
  const mockQueueResponse = {
    data: [
      {
        id: 1,
        ticketNumber: "TIK-001",
        summary: "Broken laptop",
        categoryId: 1,
        category: { id: 1, name: "Hardware" },
        requestedPriority: "High",
        itPriority: "Urgent",
        currentStatus: "Open",
        requester: { id: 2, name: "User" },
        owner: { id: 1, name: "Admin" },
        createdAt: "2023-10-01T00:00:00.000Z",
        updatedAt: "2023-10-01T00:00:00.000Z"
      }
    ],
    pagination: {
      totalItems: 1,
      page: 1,
      totalPages: 1,
      pageSize: 20
    }
  };

  const setupMocks = (queueRes: any, queueOk = true) => {
    (api.apiFetch as any).mockImplementation((url: string) => {
      if (url.includes("/api/auth/me")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ user: mockUser }) });
      }
      if (url.includes("/api/categories")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockCategories) });
      }
      if (url.includes("/api/users/staff")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaff) });
      }
      if (url.includes("/api/tickets/queue")) {
        return Promise.resolve({ 
          ok: queueOk, 
          json: () => Promise.resolve(queueRes) 
        });
      }
      return Promise.reject(new Error("Not mocked"));
    });
  };

  it("renders filters including Category and Owner", async () => {
    setupMocks(mockQueueResponse);
    renderWithContext(<StaffTicketQueue />);

    await waitFor(() => {
      expect(screen.getByTestId("filter-category")).toBeTruthy();
      expect(screen.getByTestId("filter-owner")).toBeTruthy();
    });
  });

  it("renders table rows when data is present", async () => {
    setupMocks(mockQueueResponse);
    renderWithContext(<StaffTicketQueue />);

    await waitFor(() => {
      expect(screen.getByTestId("ticket-row-1")).toBeTruthy();
      expect(screen.getAllByText(/TIK-001/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Broken laptop/i).length).toBeGreaterThan(0);
    });
  });

  it("displays empty state when there are no tickets at all", async () => {
    setupMocks({ data: [], pagination: { totalItems: 0, page: 1, totalPages: 0, pageSize: 20 } });
    renderWithContext(<StaffTicketQueue />);

    await waitFor(() => {
      expect(screen.getByTestId("empty-state")).toBeTruthy();
      expect(screen.getByText(/No tickets in queue/i)).toBeTruthy();
    });
  });

  it("displays no-results state when filters yield no matches", async () => {
    setupMocks(mockQueueResponse);
    renderWithContext(<StaffTicketQueue />);

    await waitFor(() => {
      expect(screen.getByTestId("filter-status")).toBeTruthy();
    });

    (api.apiFetch as any).mockImplementation((url: string) => {
      if (url.includes("/api/auth/me")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ user: mockUser }) });
      }
      if (url.includes("/api/categories")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockCategories) });
      }
      if (url.includes("/api/users/staff")) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStaff) });
      }
      if (url.includes("/api/tickets/queue")) {
        return Promise.resolve({ 
          ok: true, 
          json: () => Promise.resolve({ data: [], pagination: { totalItems: 0, page: 1, totalPages: 0, pageSize: 20 } }) 
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    const statusFilter = screen.getByTestId("filter-status");
    fireEvent.change(statusFilter, { target: { value: "Closed" } });

    await waitFor(() => {
      expect(screen.getByTestId("no-results-state")).toBeTruthy();
      expect(screen.getByText(/No matching tickets/i)).toBeTruthy();
    });
  });

  it("displays error state when API fails", async () => {
    setupMocks({ error: "Failed to load queue" }, false);
    renderWithContext(<StaffTicketQueue />);

    await waitFor(() => {
      expect(screen.getByTestId("error-state")).toBeTruthy();
      expect(screen.getByText(/Failed to load queue/i)).toBeTruthy();
    });
  });
});
