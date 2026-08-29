import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import AttachmentSection from "../../components/AttachmentSection.js";
import { RequesterContext } from "../../context/RequesterContext.js";

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

describe("AttachmentSection Component", () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn() as any;
    globalThis.URL.createObjectURL = vi.fn();
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const attachments = [
    {
      id: 1,
      fileName: "active.png",
      fileUrl: "/uploads/active.png",
      fileType: "image/png",
      fileSize: 1024,
      isRemoved: false,
      removedAt: null,
      removalReason: null,
      createdAt: "2023-10-25T10:00:00Z"
    },
    {
      id: 2,
      fileName: "removed.pdf",
      fileUrl: "/uploads/removed.pdf",
      fileType: "application/pdf",
      fileSize: 2048,
      isRemoved: true,
      removedAt: "2023-10-25T11:00:00Z",
      removalReason: "Uploaded wrong file",
      createdAt: "2023-10-25T10:00:00Z"
    }
  ];

  it("should render active and removed attachments", () => {
    renderWithContext(<AttachmentSection ticketId={1} attachments={attachments} onAttachmentUpdated={vi.fn()} />, mockRequester);

    expect(screen.getByText(/active.png/)).toBeInTheDocument();
    expect(screen.getByText(/removed.pdf/)).toBeInTheDocument();
    expect(screen.getByText(/Uploaded wrong file/)).toBeInTheDocument();
  });

  it("should show remove modal when clicking remove", async () => {
    renderWithContext(<AttachmentSection ticketId={1} attachments={attachments} onAttachmentUpdated={vi.fn()} />, mockRequester);

    const removeBtn = screen.getByText("Remove");
    await userEvent.click(removeBtn);

    expect(screen.getByText("Are you sure you want to remove this attachment?")).toBeInTheDocument();
  });

  it("should validate removal reason in modal", async () => {
    renderWithContext(<AttachmentSection ticketId={1} attachments={attachments} onAttachmentUpdated={vi.fn()} />, mockRequester);

    await userEvent.click(screen.getByText("Remove"));
    
    // click confirm without text
    const modalRemoveBtn = screen.getAllByText("Remove")[1]; // Second 'Remove' is in the modal
    await userEvent.click(modalRemoveBtn);

    expect(screen.getByText("Removal reason is required.")).toBeInTheDocument();
  });
});
