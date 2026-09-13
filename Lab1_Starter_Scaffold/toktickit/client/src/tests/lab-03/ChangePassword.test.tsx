import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ChangePassword from "../../components/ChangePassword.js";

// Mock the API fetch
vi.mock("../../api.js", () => ({
  apiFetch: vi.fn()
}));

// Mock the Auth Context
const mockUpdateUser = vi.fn();
vi.mock("../../context/AuthContext.js", () => ({
  useAuth: () => ({
    user: { id: 1, email: "test@example.com", name: "Test User", mustChangePassword: true },
    updateUser: mockUpdateUser,
  })
}));

import { apiFetch } from "../../api.js";

describe("ChangePassword Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render first-time password change form and notice", () => {
    render(<ChangePassword />);
    
    expect(screen.getByText(/You must change your password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Current Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^New Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm New Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Update Password/i })).toBeInTheDocument();
  });

  it("should validate that new passwords match", async () => {
    render(<ChangePassword />);
    
    fireEvent.change(screen.getByLabelText(/Current Password/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/^New Password$/i), { target: { value: "NewPassword1!" } });
    fireEvent.change(screen.getByLabelText(/Confirm New Password/i), { target: { value: "DifferentPassword1!" } });
    fireEvent.click(screen.getByRole("button", { name: /Update Password/i }));

    expect(screen.getByText("New passwords do not match.")).toBeInTheDocument();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("should display API error on failure (e.g. complexity requirements)", async () => {
    (apiFetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({
        errors: [{ message: "Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character." }]
      })
    });

    render(<ChangePassword />);
    
    fireEvent.change(screen.getByLabelText(/Current Password/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/^New Password$/i), { target: { value: "weak" } });
    fireEvent.change(screen.getByLabelText(/Confirm New Password/i), { target: { value: "weak" } });
    fireEvent.click(screen.getByRole("button", { name: /Update Password/i }));

    await waitFor(() => {
      expect(screen.getByText(/Password must contain at least 8 characters/)).toBeInTheDocument();
    });
  });

  it("should submit successfully and call updateUser", async () => {
    (apiFetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: "Password changed successfully." })
    });

    render(<ChangePassword />);
    
    fireEvent.change(screen.getByLabelText(/Current Password/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/^New Password$/i), { target: { value: "NewSecurePassword1!" } });
    fireEvent.change(screen.getByLabelText(/Confirm New Password/i), { target: { value: "NewSecurePassword1!" } });
    fireEvent.click(screen.getByRole("button", { name: /Update Password/i }));

    await waitFor(() => {
      expect(screen.getByText(/Password changed successfully!/i)).toBeInTheDocument();
    });

    expect(mockUpdateUser).toHaveBeenCalledWith(expect.objectContaining({
      mustChangePassword: false
    }));
  });
});
