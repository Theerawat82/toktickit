import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StaffTicketDetail from '../../components/StaffTicketDetail.js';
import * as api from '../../api.js';

vi.mock('../../context/AuthContext.js', () => ({
  useAuth: () => ({ user: { id: 2, name: 'IT Bob', role: 'IT_Staff' } })
}));

vi.mock('../../api.js', () => ({
  apiFetch: vi.fn()
}));

const mockTicket = {
  id: 101,
  ticketNumber: "TIK-00101",
  summary: "Help me",
  description: "Test description",
  requestedPriority: "High",
  itPriority: "High",
  currentStatus: "Open",
  requesterUser: { name: "Alice" },
  ticketOwner: { name: "Bob" },
  category: { name: "Hardware" },
  relatedSystem: { name: "PC" },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('StaffTicketDetail Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ticket details correctly', async () => {
    (api.apiFetch as any).mockImplementation((url: string) => {
      if (url.includes('/comments')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      if (url.includes('/internal-notes')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      if (url.includes('/staff')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTicket) });
    });

    render(<StaffTicketDetail ticketId={101} />);
    
    await waitFor(() => {
      expect(screen.getByText('TIK-00101')).toBeInTheDocument();
    });
    expect(screen.getByText('Help me')).toBeInTheDocument();
  });

  it('renders tabs and allows switching to Internal Notes (amber styled)', async () => {
    (api.apiFetch as any).mockImplementation((url: string) => {
      if (url.includes('/comments')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      if (url.includes('/internal-notes')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      if (url.includes('/staff')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTicket) });
    });

    render(<StaffTicketDetail ticketId={101} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /Public Comments/i })).toBeInTheDocument());

    const notesTab = screen.getByRole('button', { name: /Internal Notes/i });
    fireEvent.click(notesTab);

    expect(screen.getByText(/Internal Notes \(Not visible to Requester\)/i)).toBeInTheDocument();
  });

  it('displays Service Actions dropdowns and interacts with API', async () => {
    (api.apiFetch as any).mockImplementation((url: string) => {
      if (url.includes('/comments')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      if (url.includes('/internal-notes')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      if (url.includes('/staff')) return Promise.resolve({ ok: true, json: () => Promise.resolve([{ id: 2, name: 'Bob' }]) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTicket) });
    });

    render(<StaffTicketDetail ticketId={101} />);
    await waitFor(() => expect(screen.getByRole('button', { name: /Service Actions/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Service Actions/i }));

    expect(screen.getByText('Ticket Owner')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /IT Priority/i })).toBeInTheDocument();
    expect(screen.getByText('Current Status')).toBeInTheDocument();

    // Change status
    const statusSelect = screen.getByDisplayValue('Open');
    fireEvent.change(statusSelect, { target: { value: 'Resolved' } });

    expect(api.apiFetch).toHaveBeenCalledWith(
      '/api/tickets/101/status',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'Resolved' })
      })
    );
  });
});
