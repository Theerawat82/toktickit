import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import CreateTicket from "../../components/CreateTicket";

// ── Mock apiFetch ──
const apiFetchMock = vi.fn();
vi.mock("../../api", () => ({
  apiFetch: (...args: any[]) => apiFetchMock(...args),
}));

// ── Mock useAuth ──
vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 1, role: "Requester", name: "Alice Johnson", email: "alice@example.com", mustChangePassword: false },
    loading: false,
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: any) => <>{children}</>
}));

describe("CreateTicket Component", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => [{ id: 1, name: "Test Item" }],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render form correctly when user exists", async () => {
    render(<CreateTicket />);
    expect(screen.getByTestId("create-ticket-form")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Alice Johnson (alice@example.com)")).toBeInTheDocument();
  });

  it("should show validation errors when fields are empty or invalid", async () => {
    render(<CreateTicket />);

    const submitBtn = screen.getByTestId("submit-ticket-btn");
    
    // Submit empty form
    await userEvent.click(submitBtn);

    expect(screen.getByText("Summary cannot be empty")).toBeInTheDocument();
    expect(screen.getByText("Description must be at least 20 characters long")).toBeInTheDocument();
    expect(screen.getByTestId("error-banner")).toHaveTextContent("Please select a category and related system");
  });

  it("should submit successfully when form is valid", async () => {
    apiFetchMock.mockImplementation((url: string) => {
      if (url === "/api/tickets") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ticketNumber: "TIK-00001", id: 1 }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => [{ id: 1, name: "Test Item" }],
      });
    });

    render(<CreateTicket />);

    const summaryInput = screen.getByTestId("input-summary");
    const descInput = screen.getByTestId("input-description");
    const categorySelect = screen.getByTestId("select-category");
    const systemSelect = screen.getByTestId("select-system");
    const submitBtn = screen.getByTestId("submit-ticket-btn");

    await userEvent.type(summaryInput, "Valid summary text");
    await userEvent.type(descInput, "This is a valid description that has more than twenty characters.");
    
    // Wait for reference data to populate
    await waitFor(() => {
      expect(categorySelect.children.length).toBeGreaterThan(1);
    });

    await userEvent.selectOptions(categorySelect, "1");
    await userEvent.selectOptions(systemSelect, "1");

    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId("success-banner")).toHaveTextContent("Ticket created successfully! Ticket Number: TIK-00001");
    });
  });
});
