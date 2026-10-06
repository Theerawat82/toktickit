import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
afterEach(cleanup);
import '@testing-library/jest-dom';
import ActionsTaken from '../../components/ActionsTaken.js';
import * as api from '../../api.js';

// Mock apiFetch
vi.mock('../../api.js', () => ({
  apiFetch: vi.fn()
}));

const mockAction = {
  id: 1,
  ticketId: 100,
  actionDateTime: '2023-01-01T10:00:00Z',
  actionDescription: 'Test action',
  result: 'Test result',
  performedById: 2,
  performedBy: { id: 2, name: 'Staff User', role: 'IT_Staff' },
  followUpRequired: false,
  followUpNote: null,
  attachmentNotes: null,
  version: 1
};

describe('ActionsTaken Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (api.apiFetch as any).mockImplementation(() => new Promise(() => {}));
    render(<ActionsTaken ticketId={100} userRole="IT_Staff" />);
    expect(screen.getByText('Loading Actions...')).toBeInTheDocument();
  });

  it('renders empty list and no edit button for Requester', async () => {
    (api.apiFetch as any).mockResolvedValue({
      ok: true,
      json: async () => []
    });
    
    render(<ActionsTaken ticketId={100} userRole="Requester" />);
    await waitFor(() => expect(screen.getByText('No actions taken yet.')).toBeInTheDocument());
    expect(screen.queryByText('Add Action Taken')).not.toBeInTheDocument();
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('renders actions list and Edit button for IT Staff', async () => {
    (api.apiFetch as any).mockResolvedValue({
      ok: true,
      json: async () => [mockAction]
    });
    
    render(<ActionsTaken ticketId={100} userRole="IT_Staff" />);
    await waitFor(() => expect(screen.getByText('Test action')).toBeInTheDocument());
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Add Action Taken')).toBeInTheDocument();
  });

  it('opens edit form, pre-fills values, and successfully updates', async () => {
    (api.apiFetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [mockAction]
    });
    
    render(<ActionsTaken ticketId={100} userRole="IT_Staff" />);
    await waitFor(() => expect(screen.getByText('Edit')).toBeInTheDocument());
    
    fireEvent.click(screen.getByText('Edit'));
    
    expect(screen.getByText('Edit Action Taken')).toBeInTheDocument();
    expect((screen.getByLabelText(/Action Description/i) as HTMLTextAreaElement).value).toBe('Test action');
    expect(screen.getAllByText(/Staff User/)[0]).toBeInTheDocument(); // Read-only field
    
    // Simulate changing text
    fireEvent.change(screen.getByLabelText(/Action Description/i), { target: { value: 'Edited action' } });
    
    // Setup mock for successful update
    (api.apiFetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockAction, actionDescription: 'Edited action', version: 2 })
    });
    
    fireEvent.click(screen.getByText('Save'));
    
    await waitFor(() => expect(screen.getByText('Edited action')).toBeInTheDocument());
    expect(screen.queryByText('Edit Action Taken')).not.toBeInTheDocument(); // form closed
  });

  it('handles 409 conflict during edit', async () => {
    (api.apiFetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [mockAction]
    });
    
    render(<ActionsTaken ticketId={100} userRole="IT_Staff" />);
    await waitFor(() => expect(screen.getByText('Edit')).toBeInTheDocument());
    
    fireEvent.click(screen.getByText('Edit'));
    
    // Simulate 409 conflict
    (api.apiFetch as any).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({
        error: 'Conflict',
        currentServerRow: { ...mockAction, actionDescription: 'Stolen action', version: 2 }
      })
    });
    
    fireEvent.click(screen.getByText('Save'));
    
    await waitFor(() => {
      expect(screen.getByText(/updated by someone else/i)).toBeInTheDocument();
    });
    // Form should stay open but values should be refreshed to server's state
    expect((screen.getByLabelText(/Action Description/i) as HTMLTextAreaElement).value).toBe('Stolen action');
  });
});
