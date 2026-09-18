import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import RequesterTicketDetail from "../../components/RequesterTicketDetail.js";

const MOCK_USER = { id: 1, role: "Requester", name: "Alice Johnson", mustChangePassword: false };
vi.mock("../../context/AuthContext.js", () => ({
  useAuth: () => ({
    user: MOCK_USER,
    loading: false,
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: any) => <>{children}</>
}));

const mockRequester = { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "Requester" };

const mockTicket = {
  id: 1,
  ticketNumber: "TIK-00001",
  summary: "Cannot login",
  description: "I am getting a 403 error when trying to login.",
  currentStatus: "New",
  requestedPriority: "High",
  category: { id: 1, name: "Access" },
  relatedSystem: { id: 1, name: "VPN" },
  requesterUser: mockRequester,
  createdAt: "2023-10-25T10:00:00Z",
  updatedAt: "2023-10-25T10:00:00Z",
  attachments: [],
  comments: [
    { id: 10, content: "First comment", createdAt: "2023-10-25T10:05:00Z", author: mockRequester }
  ],
  internalNotes: [
    { id: 99, content: "Secret IT Note", createdAt: "2023-10-25T10:06:00Z", author: { name: "Bob IT", role: "IT Staff" } }
  ]
};

describe("RequesterTicketDetail - Public Comments (Lab 3)", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn((...args: any[]) => {
      const urlStr = String(args[0] || "");
      const options = args[1] || {};
      
      if (options.method === "POST" && urlStr.includes('/comments')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 11, content: JSON.parse(options.body).content, createdAt: "2023-10-25T10:10:00Z", authorId: 1 })
        });
      }
      
      if (urlStr.includes('/comments')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTicket.comments) });
      }
      
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTicket) });
    }) as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders existing Public Comments with author, role, and timestamp", async () => {
    render(<RequesterTicketDetail ticketId={1} />);
    
    await waitFor(() => {
      expect(screen.getByText("Cannot login")).toBeInTheDocument();
    });

    await screen.findByText(/First comment/i, {}, { timeout: 3000 });
    expect(screen.getAllByText(/Alice Johnson/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Requester/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/25 Oct 2023, 17:05/i)).toBeInTheDocument();
  });

  it("renders a working 'post comment' form and calls the API on submit", async () => {
    render(<RequesterTicketDetail ticketId={1} />);
    
    await waitFor(() => {
      expect(screen.getByTestId("post-comment-btn")).toBeInTheDocument();
    });

    const input = screen.getByTestId("comment-input");
    const btn = screen.getByTestId("post-comment-btn");
    const form = input.closest('form');

    fireEvent.change(input, { target: { value: "A new public comment" } });
    
    await waitFor(() => {
      expect(btn).not.toBeDisabled();
    });
    
    fireEvent.submit(form!);
    
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/tickets/1/comments"),
        expect.objectContaining({
          method: "POST"
        })
      );
    });
  });

  it("does NOT render any Internal Notes content even if the component receives internalNotes", async () => {
    render(<RequesterTicketDetail ticketId={1} />);
    
    await waitFor(() => {
      expect(screen.getByText("First comment")).toBeInTheDocument();
    });

    expect(screen.queryByText("Secret IT Note")).not.toBeInTheDocument();
  });

  it("blocks submission of empty/whitespace-only comment text", async () => {
    render(<RequesterTicketDetail ticketId={1} />);
    
    await waitFor(() => {
      expect(screen.getByText("First comment")).toBeInTheDocument();
    });

    const btn = screen.getByTestId("post-comment-btn") as HTMLButtonElement;
    expect(btn).toBeDisabled(); 

    const input = screen.getByTestId("comment-input");
    fireEvent.change(input, { target: { value: "   " } });
    
    await waitFor(() => {
      expect(btn).toBeDisabled(); 
    });
  });

  it("does NOT render any edit/delete control next to existing comments", async () => {
    render(<RequesterTicketDetail ticketId={1} />);
    
    await waitFor(() => {
      expect(screen.getByText("First comment")).toBeInTheDocument();
    });

    const editBtns = screen.queryAllByRole("button", { name: /edit/i });
    const deleteBtns = screen.queryAllByRole("button", { name: /delete/i });
    
    expect(editBtns.length).toBe(0);
    expect(deleteBtns.length).toBe(0);
  });
});
