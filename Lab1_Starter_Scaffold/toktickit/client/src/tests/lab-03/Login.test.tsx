import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "../../components/Login.js";

// Mock the API fetch
vi.mock("../../api.js", () => ({
  apiFetch: vi.fn()
}));

// Mock the Auth Context
const mockLogin = vi.fn();
vi.mock("../../context/AuthContext.js", () => ({
  useAuth: () => ({
    login: mockLogin,
  })
}));

import { apiFetch } from "../../api.js";

describe("Login Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render login form with email, password fields and submit button", () => {
    render(<Login />);
    
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Log In/i })).toBeInTheDocument();
  });

  it("should show loading state and disable button when submitting", async () => {
    // Make apiFetch never resolve so we can see the loading state
    (apiFetch as any).mockImplementation(() => new Promise(() => {}));

    render(<Login />);
    
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByRole("button", { name: /Log In/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitBtn);

    expect(submitBtn).toBeDisabled();
    expect(submitBtn).toHaveTextContent(/Logging in/i);
  });

  it("should display generic error message on invalid credentials", async () => {
    (apiFetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Invalid email or password." })
    });

    render(<Login />);
    
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByRole("button", { name: /Log In/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "wrongpass" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password.")).toBeInTheDocument();
    });
  });

  it("should display notification for inactive user accounts", async () => {
    (apiFetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Account is inactive. Please contact your administrator." })
    });

    render(<Login />);
    
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByRole("button", { name: /Log In/i });

    fireEvent.change(emailInput, { target: { value: "inactive@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Account is inactive. Please contact your administrator.")).toBeInTheDocument();
    });
  });

  it("should call login function on successful authentication", async () => {
    const mockUser = { id: 1, email: "test@example.com", name: "Test User" };
    (apiFetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: "fake-jwt-token", user: mockUser })
    });

    render(<Login />);
    
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByRole("button", { name: /Log In/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("fake-jwt-token", mockUser);
    });
  });
});
