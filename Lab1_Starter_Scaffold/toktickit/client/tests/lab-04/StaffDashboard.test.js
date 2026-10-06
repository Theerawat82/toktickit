import { jsx as _jsx } from "react/jsx-runtime";
import { cleanup } from "@testing-library/react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import StaffDashboard from "../../src/components/StaffDashboard.js";
import * as api from "../../src/api.js";
vi.mock("../../src/api.js");
const mockStaffDashboardData = {
    unassignedCount: 5,
    myAssignedCount: 12,
    statusBreakdown: { "New": 2, "Open": 4, "InProgress": 3, "Waiting for Requester": 1, "Resolved": 10, "Closed": 6, "Cancelled": 0 },
    priorityBreakdown: { "Urgent": 22, "Low": 8, "Unprioritized": 9 },
    recentlyUpdated: [
        {
            id: 101,
            ticketNumber: "T-001",
            summary: "Cannot access email",
            currentStatus: "Open",
            updatedAt: new Date().toISOString(),
            ticketOwnerId: 2,
        },
    ],
    activeUserCount: 15,
    inactiveUserCount: 2,
};
afterEach(() => {
    cleanup();
});
describe("Issue 5: StaffDashboard Component", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });
    it("renders loading and error states without crashing", async () => {
        vi.spyOn(api, "getStaffDashboard").mockImplementation(() => new Promise(() => { })); // Hangs for loading
        render(_jsx(StaffDashboard, {}));
        expect(screen.getAllByText(/Loading dashboard/i)[0]).toBeInTheDocument();
        vi.spyOn(api, "getStaffDashboard").mockRejectedValue(new Error("API Failed"));
        render(_jsx(StaffDashboard, {}));
        await waitFor(() => expect(screen.getAllByText("API Failed")[0]).toBeInTheDocument());
    });
    it("renders all 5 metric sections with mock data", async () => {
        vi.spyOn(api, "getStaffDashboard").mockResolvedValue(mockStaffDashboardData);
        render(_jsx(StaffDashboard, {}));
        await waitFor(() => expect(screen.getAllByText("Dashboard")[0]).toBeInTheDocument());
        // Check counts
        expect(screen.getAllByText("5")[0]).toBeInTheDocument(); // Unassigned
        expect(screen.getAllByText("12")[0]).toBeInTheDocument(); // Assigned
        expect(screen.getAllByText("2")[0]).toBeInTheDocument(); // New
        // Check Recently Updated
        expect(screen.getAllByText("T-001")[0]).toBeInTheDocument();
        expect(screen.getAllByText("Cannot access email")[0]).toBeInTheDocument();
    });
    it("metric card links to the correct filtered queue URL", async () => {
        vi.spyOn(api, "getStaffDashboard").mockResolvedValue(mockStaffDashboardData);
        render(_jsx(StaffDashboard, {}));
        await waitFor(() => expect(screen.getAllByText("Dashboard")[0]).toBeInTheDocument());
        const unassignedLink = screen.getByRole("link", { name: "5" });
        expect(unassignedLink).toHaveAttribute("href", "#queue?ownerId=unassigned");
        const newLink = screen.getByRole("link", { name: "2" });
        expect(newLink).toHaveAttribute("href", "#queue?status=New");
        const myAssignedLink = screen.getByRole("link", { name: "12" });
        expect(myAssignedLink).toHaveAttribute("href", "#queue?ownerId=me");
        // priority link
        const urgentLink = screen.getByRole("link", { name: "22" });
        expect(urgentLink).toHaveAttribute("href", "#queue?itPriority=Urgent");
    });
    it("recentlyUpdated list renders and links to Ticket Detail", async () => {
        vi.spyOn(api, "getStaffDashboard").mockResolvedValue(mockStaffDashboardData);
        render(_jsx(StaffDashboard, {}));
        await waitFor(() => expect(screen.getAllByText("Dashboard")[0]).toBeInTheDocument());
        const detailLink = screen.getByRole("link", { name: "T-001" });
        expect(detailLink).toHaveAttribute("href", "#ticket/101");
    });
    it("empty state renders per-metric when a metric's data is empty", async () => {
        vi.spyOn(api, "getStaffDashboard").mockResolvedValue({
            ...mockStaffDashboardData,
            recentlyUpdated: [],
        });
        render(_jsx(StaffDashboard, {}));
        await waitFor(() => expect(screen.getAllByText("Dashboard")[0]).toBeInTheDocument());
        expect(screen.getAllByText("No recently updated tickets.")[0]).toBeInTheDocument();
    });
    it("admin-only block renders when present in mock response, absent otherwise", async () => {
        vi.spyOn(api, "getStaffDashboard").mockResolvedValue(mockStaffDashboardData);
        render(_jsx(StaffDashboard, {}));
        await waitFor(() => expect(screen.getAllByText("Dashboard")[0]).toBeInTheDocument());
        expect(screen.getAllByText(/Active Users:/i)[0]).toBeInTheDocument();
        expect(screen.getAllByText("15")[0]).toBeInTheDocument();
        cleanup();
        vi.spyOn(api, "getStaffDashboard").mockResolvedValue({
            ...mockStaffDashboardData,
            activeUserCount: undefined,
            inactiveUserCount: undefined,
        });
        render(_jsx(StaffDashboard, {}));
        await waitFor(() => expect(screen.getAllByText("Dashboard")[0]).toBeInTheDocument());
        expect(screen.queryByText(/Active Users:/i)).not.toBeInTheDocument();
    });
});
