import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserManagement from '../../components/UserManagement';
import * as api from '../../api';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../api', () => ({
  apiFetch: vi.fn(),
}));

describe('UserManagement Component (Lab 3)', () => {
  const mockUsers = [
    { id: 1, name: 'Admin One', email: 'admin@tok.com', role: 'Administrator', isActive: true },
    { id: 2, name: 'Requester Two', email: 'req@tok.com', role: 'Requester', isActive: false },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders list of users successfully', async () => {
    (api.apiFetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockUsers }),
    });

    render(<UserManagement />);
    
    expect(screen.getByText('Loading users...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Admin One')).toBeInTheDocument();
      expect(screen.getByText('req@tok.com')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });

  it('handles search and role filtering', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });
    (api.apiFetch as any).mockImplementation(fetchMock);

    render(<UserManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('No users found.')).toBeInTheDocument();
    });

    // Type in search
    fireEvent.change(screen.getByPlaceholderText('Search by Name or Email'), { target: { value: 'Admin' } });
    
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/admin/users?search=Admin');
    });

    // Change role filter
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'IT_Staff' } });
    
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/admin/users?search=Admin&role=IT_Staff');
    });
  });

  it('handles forbidden error state gracefully', async () => {
    (api.apiFetch as any).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ error: 'Forbidden' }),
    });

    render(<UserManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('Forbidden: You do not have permission to access this page.')).toBeInTheDocument();
    });
  });

  it('creates a new user successfully', async () => {
    (api.apiFetch as any).mockImplementation((url: string, options: any) => {
      if (options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 3, name: 'New Guy', email: 'new@guy.com', role: 'Requester', isActive: true, mustChangePassword: true }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });
    });

    render(<UserManagement />);
    await waitFor(() => expect(screen.queryByText('Loading users...')).not.toBeInTheDocument());

    fireEvent.click(screen.getByText('+ Create User'));
    
    expect(screen.getByText('Initial Password')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'New Guy' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@guy.com' } });
    fireEvent.change(screen.getByLabelText('Initial Password'), { target: { value: 'Password123!' } });
    
    fireEvent.click(screen.getByRole('button', { name: 'Save User' }));

    await waitFor(() => {
      expect(screen.getByText('User created successfully')).toBeInTheDocument();
    });
  });

  it('edits a user and resets password', async () => {
    (api.apiFetch as any).mockImplementation((url: string, options: any) => {
      if (options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'User password reset successfully.' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockUsers }),
      });
    });

    render(<UserManagement />);
    await waitFor(() => expect(screen.getByText('Admin One')).toBeInTheDocument());

    const editBtns = screen.getAllByText('Edit');
    fireEvent.click(editBtns[0]);

    expect(screen.getByText('Edit User')).toBeInTheDocument();
    expect(screen.getByText('Danger Zone')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('New Password'), { target: { value: 'StrongPass1!' } });
    fireEvent.click(screen.getByText('Reset'));

    await waitFor(() => {
      expect(screen.getByText('Password reset successfully')).toBeInTheDocument();
    });
  });
});
