import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RequesterDashboard from "../../src/components/RequesterDashboard.js";
import * as api from "../../src/api.js";
vi.mock("../../src/api.js");
const mockRequesterDashboardData = {
    myTickets: {
        Open: 2,
        InProgress: 1,
        Resolved: 1,
        Closed: 0
    }
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
    it("renders myTickets with mock data", async () => {
        vi.spyOn(api, "getRequesterDashboard").mockResolvedValue(mockRequesterDashboardData);
        render(_jsx(RequesterDashboard, {}));
        await waitFor(() => expect(screen.getByText("My Dashboard")).toBeInTheDocument());
        expect(screen.getByText("2")).toBeInTheDocument();
        expect(screen.getAllByText("1").length).toBeGreaterThan(0);
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
