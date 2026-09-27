import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import StaffTicketDetail from '../../components/StaffTicketDetail.js';
import RequesterTicketDetail from '../../components/RequesterTicketDetail.js';
import { useAuth } from '../../context/AuthContext.js';
import * as api from '../../api.js';

vi.mock('../../api.js', () => ({
  apiFetch: vi.fn(),
  getUserInfo: vi.fn()
}));

vi.mock('../../context/AuthContext.js', () => ({
  useAuth: vi.fn()
}));

const mockTicket = {
  id: 100,
  ticketNumber: "TKT-100",
  summary: "Test Ticket",
  currentStatus: "New",
  requestedPriority: "Low",
  itPriority: "Low",
  version: 1,
  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2023-01-01T00:00:00Z",
  requesterConfirmedResolved: false,
  requester: { name: "User" },
  category: { name: "Cat" },
  relatedSystem: { name: "Sys" },
  attachments: [],
  comments: [],
  actionsTaken: [],
  internalNotes: []
};

const staffUserMock = {
  user: { id: 2, role: 'IT_Staff', name: 'Staff User', email: 'staff@tt.com' },
  loading: false,
  login: vi.fn(),
  logout: vi.fn()
};

const requesterUserMock = {
  user: { id: 1, role: 'Requester', name: 'Requester User', email: 'req@tt.com' },
  loading: false,
  login: vi.fn(),
  logout: vi.fn()
};

// Custom mock for apiFetch to return different data based on URL
const setupApiMock = (overrides: any = {}) => {
  (api.apiFetch as any).mockImplementation((url: string, options?: any) => {
    // If it's a mutation (PATCH, POST), return success or mapped error
    if (options && options.method && options.method !== 'GET') {
       if (overrides[options.method]) return overrides[options.method](url, options);
       return Promise.resolve({ ok: true, json: async () => ({ ...mockTicket, currentStatus: "Open" }) });
    }
    
    // GET requests
    if (url.includes('/comments')) return Promise.resolve({ ok: true, json: async () => [] });
    if (url.includes('/internal-notes')) return Promise.resolve({ ok: true, json: async () => [] });
    if (url.includes('/users')) return Promise.resolve({ ok: true, json: async () => [] });
    if (url.includes('/actions')) return Promise.resolve({ ok: true, json: async () => [] });
    if (url.includes('/tickets/')) return Promise.resolve({ ok: true, json: async () => mockTicket });
    
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
};

describe('TicketWorkflow Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('StaffTicketDetail', () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue(staffUserMock);
    });

    it('Status control renders only valid transitions', async () => {
      setupApiMock();
      (api.getUserInfo as any).mockResolvedValue([]);
      
      render(<StaffTicketDetail ticketId={100} />);
      
      await waitFor(() => expect(screen.getByText(/Test Ticket/)).toBeInTheDocument());
      fireEvent.click(screen.getByText(/Service Actions/i));
      
      const statusSelect = screen.getByLabelText(/Current Status/i) as HTMLSelectElement;
      const options = Array.from(statusSelect.options).map(o => o.value);
      expect(options).toEqual(['New', 'Open', 'Cancelled']);
    });

    it('handles 400 BR-06 error specific message', async () => {
      setupApiMock({
        PATCH: (url: string, options: any) => Promise.resolve({
          ok: false,
          status: 400,
          json: async () => ({ error: "Cannot resolve a ticket without at least one Action Taken recorded" })
        })
      });
      
      render(<StaffTicketDetail ticketId={100} />);
      
      await waitFor(() => expect(screen.getByText(/Test Ticket/)).toBeInTheDocument());
      fireEvent.click(screen.getByText(/Service Actions/i));
      
      const statusSelect = screen.getByLabelText(/Current Status/i) as HTMLSelectElement;
      fireEvent.change(statusSelect, { target: { value: 'Resolved' } });
      
      await waitFor(() => expect(screen.getByText(/Cannot resolve a ticket without at least one Action Taken/)).toBeInTheDocument());
    });

    it('handles 409 conflict and refreshes', async () => {
      setupApiMock({
        PATCH: (url: string, options: any) => Promise.resolve({
          ok: false,
          status: 409,
          json: async () => ({ error: "Conflict", currentServerRow: { ...mockTicket, currentStatus: "Open", version: 2 } })
        })
      });
      
      render(<StaffTicketDetail ticketId={100} />);
      
      await waitFor(() => expect(screen.getByText(/Test Ticket/)).toBeInTheDocument());
      fireEvent.click(screen.getByText(/Service Actions/i));
      
      const statusSelect = screen.getByLabelText(/Current Status/i) as HTMLSelectElement;
      fireEvent.change(statusSelect, { target: { value: 'Open' } });
      
      await waitFor(() => expect(screen.getByText(/refreshing to the latest state/)).toBeInTheDocument());
      
      // Select should now have "Open" as value
      expect((screen.getByLabelText(/Current Status/i) as HTMLSelectElement).value).toBe('Open');
    });
  });

  describe('RequesterTicketDetail', () => {
    beforeEach(() => {
      (useAuth as any).mockReturnValue(requesterUserMock);
    });

    it('shows Confirm Resolved button only when Resolved and not confirmed', async () => {
      (api.apiFetch as any).mockImplementation((url: string) => {
        if (url.includes('/comments')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/actions')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/tickets/')) return Promise.resolve({ ok: true, json: async () => ({ ...mockTicket, currentStatus: "Resolved", requesterConfirmedResolved: false }) });
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });
      
      render(<RequesterTicketDetail ticketId={100} />);
      
      await waitFor(() => expect(screen.getByText('Confirm this is resolved')).toBeInTheDocument());
      expect(screen.queryByLabelText(/Current Status/i)).not.toBeInTheDocument(); // No status control
    });

    it('disappears and shows message after successful confirm', async () => {
      let isConfirmed = false;
      (api.apiFetch as any).mockImplementation((url: string, options: any) => {
        if (options && options.method === 'PATCH') {
          isConfirmed = true;
          return Promise.resolve({ ok: true, json: async () => ({ ...mockTicket, currentStatus: "Resolved", requesterConfirmedResolved: true }) });
        }
        if (url.includes('/comments')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/actions')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/tickets/')) return Promise.resolve({ ok: true, json: async () => ({ ...mockTicket, currentStatus: "Resolved", requesterConfirmedResolved: isConfirmed }) });
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });
      
      render(<RequesterTicketDetail ticketId={100} />);
      
      await waitFor(() => expect(screen.getByText('Confirm this is resolved')).toBeInTheDocument());
      fireEvent.click(screen.getByText('Confirm this is resolved'));
      
      await waitFor(() => expect(screen.getByText(/You confirmed this resolution/)).toBeInTheDocument());
      expect(screen.queryByText('Confirm this is resolved')).not.toBeInTheDocument();
    });
  });
});
