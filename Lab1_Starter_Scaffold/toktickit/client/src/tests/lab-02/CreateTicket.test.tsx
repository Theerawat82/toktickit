import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import CreateTicket from "../../components/CreateTicket.js";
import { RequesterContext } from "../../context/RequesterContext.js";

// Mock RequesterProvider
const renderWithContext = (ui: React.ReactElement, activeRequester: any = null) => {
  return render(
    <RequesterContext.Provider
      value={{
        activeRequester,
        requesters: [],
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

const mockRequester = {
  id: 1,
  name: "Alice Johnson",
  email: "alice@example.com",
  isActive: true,
};

describe("CreateTicket Component", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn() as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should not render if there is no active requester", () => {
    renderWithContext(<CreateTicket />);
    expect(screen.queryByTestId("create-ticket-form")).not.toBeInTheDocument();
  });

  it("should render form correctly when active requester exists", async () => {
    // Mock the reference data fetch
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 1, name: "Test Item" }],
    }) as any;

    renderWithContext(<CreateTicket />, mockRequester);
    expect(screen.getByTestId("create-ticket-form")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Alice Johnson (alice@example.com)")).toBeInTheDocument();
  });

  it("should show validation errors when fields are empty or invalid", async () => {
    renderWithContext(<CreateTicket />, mockRequester);

    const submitBtn = screen.getByTestId("submit-ticket-btn");
    
    // Submit empty form
    await userEvent.click(submitBtn);

    expect(screen.getByText("Summary cannot be empty")).toBeInTheDocument();
    expect(screen.getByText("Description must be at least 20 characters long")).toBeInTheDocument();
    expect(screen.getByTestId("error-banner")).toHaveTextContent("Please select a category and related system");
  });

  it("should submit successfully when form is valid", async () => {
    globalThis.fetch = vi.fn((url: string) => {
      if (url === "/api/tickets") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ticketNumber: "TIK-00001" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => [{ id: 1, name: "Test Item" }],
      });
    }) as any;

    renderWithContext(<CreateTicket />, mockRequester);

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
