import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import App from "../../src/App.js";
import * as api from "../../src/api.js";
describe("App", () => {
    // WORKED EXAMPLE — provided for you.
    it("renders the TokTickIT heading", () => {
        render(_jsx(App, {}));
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
        render(_jsx(App, {}));
        // Button click triggers the fetch — no auto-load on mount
        fireEvent.click(screen.getByRole("button", { name: /check system/i }));
        expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByText(/Connected to TokTickIT API!/i)).toBeInTheDocument();
        });
        expect(screen.getByText("Account and Access")).toBeInTheDocument();
        expect(screen.getByText("Hardware")).toBeInTheDocument();
    });
    it("shows an Offline error message when the API is unavailable", async () => {
        vi.spyOn(api, "checkSystem").mockRejectedValue(new Error("Backend is offline"));
        render(_jsx(App, {}));
        // Button click triggers the fetch — no auto-load on mount
        fireEvent.click(screen.getByRole("button", { name: /check system/i }));
        await waitFor(() => {
            expect(screen.getByText(/The backend API is currently unavailable/i)).toBeInTheDocument();
        });
    });
});
