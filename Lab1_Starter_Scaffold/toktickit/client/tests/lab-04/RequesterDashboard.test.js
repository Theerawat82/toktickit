import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RequesterDashboard from "../../src/components/RequesterDashboard.js";
import * as api from "../../src/api.js";
vi.mock("../../src/api.js");
const mockRequesterDashboardData = {
    myOpenCount: 2,
    waitingForRequesterCount: 1,
    recentlyUpdated: [
        {
            id: 201,
            ticketNumber: "T-201",
            summary: "Printer broken",
            currentStatus: "Open",
            updatedAt: new Date().toISOString(),
            ticketOwnerId: 2,
        },
    ],
    recentlyResolved: [
        {
            id: 202,
            ticketNumber: "T-202",
            summary: "Mouse broken",
            currentStatus: "Resolved",
            updatedAt: new Date().toISOString(),
            ticketOwnerId: 2,
            requesterConfirmedResolved: false,
        },
    ],
};
describe("Issue 5: RequesterDashboard Component", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });
    it("renders loading and error states without crashing", async () => {
        vi.spyOn(api, "getRequesterDashboard").mockImplementation(() => new Promise(() => { })); // Hangs for loading
        render(_jsx(RequesterDashboard, {}));
        expect(screen.getByText(/Loading dashboard/i)).toBeInTheDocument();
        vi.spyOn(api, "getRequesterDashboard").mockRejectedValue(new Error("API Failed"));
        render(_jsx(RequesterDashboard, {}));
        await waitFor(() => expect(screen.getByText("API Failed")).toBeInTheDocument());
    });
    it("renders myOpenCount, waitingForRequesterCount, recentlyUpdated, recentlyResolved with mock data", async () => {
        vi.spyOn(api, "getRequesterDashboard").mockResolvedValue(mockRequesterDashboardData);
        render(_jsx(RequesterDashboard, {}));
        await waitFor(() => expect(screen.getByText("My Dashboard")).toBeInTheDocument());
        expect(screen.getByText("2")).toBeInTheDocument();
        expect(screen.getByText("1")).toBeInTheDocument();
        expect(screen.getByText("T-201")).toBeInTheDocument();
        expect(screen.getByText("Printer broken")).toBeInTheDocument();
        expect(screen.getByText("T-202")).toBeInTheDocument();
        expect(screen.getByText("Mouse broken")).toBeInTheDocument();
        expect(screen.getByText("Confirm Resolution")).toBeInTheDocument();
    });
    it("empty state renders correctly for a zero-ticket Requester", async () => {
        vi.spyOn(api, "getRequesterDashboard").mockResolvedValue({
            myTickets: {
                Open: 0,
                InProgress: 0,
                Resolved: 0,
                Closed: 0
            }
        });
        render(_jsx(RequesterDashboard, {}));
        await waitFor(() => expect(screen.getByText("My Dashboard")).toBeInTheDocument());
        expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(4);
    });
});
