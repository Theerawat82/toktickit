import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { AuthProvider } from '../../src/context/AuthContext';
import App from "../../src/App.js";
import * as api from "../../src/api.js";
vi.mock("../../src/context/AuthContext", () => ({
    useAuth: () => ({
        user: { id: 1, name: "Test User", role: "Requester" },
        token: "fake-token",
        logout: vi.fn(),
    }),
    AuthProvider: ({ children }) => children,
}));
const MOCK_REQUESTERS = [
    { id: 1, name: "Alice", email: "alice@example.com", isActive: true },
];
describe("App", () => {
    beforeEach(() => {
        // Provide a fetch mock so RequesterProvider resolves without hanging
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => MOCK_REQUESTERS,
        });
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });
    // WORKED EXAMPLE — provided for you.
    it("renders the TokTickIT heading", () => {
        render(_jsx(AuthProvider, { children: _jsx(App, {}) }));
        expect(screen.getByText(/TokTickIT/i)).toBeInTheDocument();
    });
    it("shows Online and the seeded categories on success", async () => {
        vi.spyOn(api, "checkSystem").mockResolvedValue({
            online: true,
            categories: [
                { id: 1, name: "Account and Access" },
                { id: 2, name: "Hardware" }
            ]
        });
        render(_jsx(AuthProvider, { children: _jsx(App, {}) }));
        // Button click triggers the fetch — no auto-load on mount
        fireEvent.click(screen.getByRole("button", { name: /check system/i }));
        // Use getAllByText since multiple "loading" indicators may exist momentarily
        expect(screen.getAllByText(/Loading.../i).length).toBeGreaterThan(0);
        await waitFor(() => {
            expect(screen.getByText(/Connected to TokTickIT API!/i)).toBeInTheDocument();
        });
        expect(screen.getByText("Account and Access")).toBeInTheDocument();
        expect(screen.getByText("Hardware")).toBeInTheDocument();
    });
    it("shows an Offline error message when the API is unavailable", async () => {
        vi.spyOn(api, "checkSystem").mockRejectedValue(new Error("Backend is offline"));
        render(_jsx(AuthProvider, { children: _jsx(App, {}) }));
        // Button click triggers the fetch — no auto-load on mount
        fireEvent.click(screen.getByRole("button", { name: /check system/i }));
        await waitFor(() => {
            expect(screen.getByText(/The backend API is currently unavailable/i)).toBeInTheDocument();
        });
    });
});
