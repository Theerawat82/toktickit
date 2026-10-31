import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import StaffTicketQueue from "../../src/components/StaffTicketQueue.js";
import { apiFetch } from "../../src/api.js";

vi.mock("../../src/api.js", () => ({
  apiFetch: vi.fn(),
}));

vi.mock("../../src/context/AuthContext.js", () => ({
  useAuth: () => ({
    user: { id: 1, name: "IT Staff 1", email: "staff1@toktickit.com", role: "IT_Staff", mustChangePassword: false },
  }),
}));

const now = new Date().toISOString();
const unassignedTicket = {
  id: 101, ticketNumber: "TKT-101", summary: "Fake Unassigned", categoryId: 1, category: { id: 1, name: "Hardware" },
  requestedPriority: "Low", itPriority: "Low", currentStatus: "New", requester: { id: 9, name: "Req" }, owner: null,
  createdAt: now, updatedAt: now,
};
const myTicket = {
  id: 102, ticketNumber: "TKT-102", summary: "Fake Assigned", categoryId: 1, category: { id: 1, name: "Software" },
  requestedPriority: "High", itPriority: "High", currentStatus: "In_Progress", requester: { id: 9, name: "Req" }, owner: { id: 1, name: "IT Staff 1" },
  createdAt: now, updatedAt: now,
};

// Returns tickets according to the ownerId the component actually sent
function mockApi() {
  (apiFetch as any).mockImplementation(async (url: string) => {
    if (url === "/api/categories" || url === "/api/users/staff") {
      return { ok: true, json: async () => [] };
    }
    if (url.startsWith("/api/tickets/queue")) {
      const ownerId = new URLSearchParams(url.split("?")[1]).get("ownerId");
      const data = ownerId === "unassigned" ? [unassignedTicket] : ownerId === "me" ? [myTicket] : [unassignedTicket, myTicket];
      return { ok: true, json: async () => ({ data, pagination: { totalItems: data.length, page: 1, pageSize: 20, totalPages: 1 } }) };
    }
    return { ok: false, json: async () => ({}) };
  });
}

function queueCalls(): string[] {
  return (apiFetch as any).mock.calls.map((c: any[]) => c[0]).filter((u: string) => u.startsWith("/api/tickets/queue"));
}

describe("Lab 4: StaffTicketQueue drill-down from dashboard hash", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi();
  });

  afterEach(() => {
    window.location.hash = "";
  });

  it("#queue?ownerId=unassigned selects Unassigned and sends ownerId=unassigned", async () => {
    window.location.hash = "#queue?ownerId=unassigned";
    render(<StaffTicketQueue />);

    expect(await screen.findByTestId("filter-owner")).toHaveValue("unassigned");
    await waitFor(() => expect(queueCalls().some((u) => u.includes("ownerId=unassigned"))).toBe(true));
    expect((await screen.findAllByText("Fake Unassigned")).length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Fake Assigned")).toHaveLength(0);
  });

  it("#queue?ownerId=me selects My Assigned and sends ownerId=me", async () => {
    window.location.hash = "#queue?ownerId=me";
    render(<StaffTicketQueue />);

    expect(await screen.findByTestId("filter-owner")).toHaveValue("me");
    await waitFor(() => expect(queueCalls().some((u) => u.includes("ownerId=me"))).toBe(true));
    expect((await screen.findAllByText("Fake Assigned")).length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Fake Unassigned")).toHaveLength(0);
  });

  it("#queue?status=In_Progress and #queue?itPriority=High apply status / priority filters", async () => {
    window.location.hash = "#queue?status=In_Progress";
    const { unmount } = render(<StaffTicketQueue />);
    expect(await screen.findByTestId("filter-status")).toHaveValue("In_Progress");
    await waitFor(() => expect(queueCalls().some((u) => u.includes("status=In_Progress"))).toBe(true));
    unmount();

    window.location.hash = "#queue?itPriority=High";
    render(<StaffTicketQueue />);
    expect(await screen.findByTestId("filter-priority")).toHaveValue("High");
    await waitFor(() => expect(queueCalls().some((u) => u.includes("itPriority=High"))).toBe(true));
  });

  it("re-applies filters on hashchange while mounted", async () => {
    window.location.hash = "#queue";
    render(<StaffTicketQueue />);
    expect(await screen.findByTestId("filter-owner")).toHaveValue("");

    window.location.hash = "#queue?ownerId=unassigned";
    window.dispatchEvent(new HashChangeEvent("hashchange"));

    await waitFor(() => expect(screen.getByTestId("filter-owner")).toHaveValue("unassigned"));
    await waitFor(() => expect(queueCalls().some((u) => u.includes("ownerId=unassigned"))).toBe(true));
  });

  it("Clear Filters resets the owner dropdown and the hash back to #queue", async () => {
    window.location.hash = "#queue?ownerId=unassigned";
    render(<StaffTicketQueue />);
    expect(await screen.findByTestId("filter-owner")).toHaveValue("unassigned");

    fireEvent.click(await screen.findByTestId("clear-filters-btn"));

    await waitFor(() => expect(screen.getByTestId("filter-owner")).toHaveValue(""));
    expect(window.location.hash).toBe("#queue");
  });
});
