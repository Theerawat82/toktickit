import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  RequesterProvider,
  useRequester,
} from "../../context/RequesterContext.js";

// ---------------------------------------------------------------------------
// Helper: simple consumer component
// ---------------------------------------------------------------------------
function TestConsumer() {
  const { requesters, activeRequester, setActiveRequester, loading, error } =
    useRequester();

  if (loading) return <div data-testid="loading">Loading…</div>;
  if (error) return <div data-testid="error">{error}</div>;

  return (
    <div>
      <ul>
        {requesters.map((r) => (
          <li key={r.id} data-testid={`requester-${r.id}`}>
            {r.name}
          </li>
        ))}
      </ul>

      {activeRequester && (
        <div data-testid="active-name">{activeRequester.name}</div>
      )}

      {requesters.length > 0 && (
        <button
          data-testid="select-btn"
          onClick={() => setActiveRequester(requesters[0])}
        >
          Select first
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
const MOCK_REQUESTERS = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com", isActive: true },
  { id: 2, name: "Bob Smith", email: "bob@example.com", isActive: true },
];

describe("RequesterContext", () => {
  beforeEach(() => {
    localStorage.clear();
    globalThis.fetch = vi.fn() as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading state while fetching", () => {
    globalThis.fetch = vi.fn(() => new Promise(() => {})) as any;
    render(
      <RequesterProvider>
        <TestConsumer />
      </RequesterProvider>
    );
    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });

  it("shows error when fetch fails", async () => {
    globalThis.fetch = vi
      .fn()
      .mockRejectedValue(new Error("Network error")) as any;
    render(
      <RequesterProvider>
        <TestConsumer />
      </RequesterProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId("error")).toBeInTheDocument()
    );
    expect(screen.getByTestId("error")).toHaveTextContent("Network error");
  });

  it("fetches and renders requester list", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_REQUESTERS,
    }) as any;

    render(
      <RequesterProvider>
        <TestConsumer />
      </RequesterProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("requester-1")).toBeInTheDocument()
    );
    expect(screen.getByTestId("requester-1")).toHaveTextContent("Alice Johnson");
    expect(screen.getByTestId("requester-2")).toHaveTextContent("Bob Smith");
  });

  it("sets active requester and saves to localStorage", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_REQUESTERS,
    }) as any;

    render(
      <RequesterProvider>
        <TestConsumer />
      </RequesterProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("select-btn")).toBeInTheDocument()
    );

    await userEvent.click(screen.getByTestId("select-btn"));

    expect(screen.getByTestId("active-name")).toHaveTextContent("Alice Johnson");
    expect(localStorage.getItem("dev_requester_id")).toBe("1");
  });

  it("restores active requester from localStorage on load", async () => {
    localStorage.setItem("dev_requester_id", "2");

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => MOCK_REQUESTERS,
    }) as any;

    render(
      <RequesterProvider>
        <TestConsumer />
      </RequesterProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId("active-name")).toBeInTheDocument()
    );
    expect(screen.getByTestId("active-name")).toHaveTextContent("Bob Smith");
  });
});
