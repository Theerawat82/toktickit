import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DevelopmentRequesterSelection from '../../components/DevelopmentRequesterSelection.js';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('DevelopmentRequesterSelection', () => {
  beforeEach(() => {
    localStorage.clear();
    globalThis.fetch = vi.fn() as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state initially', () => {
    globalThis.fetch = vi.fn(() => new Promise(() => {})) as any; // Never resolves
    render(<DevelopmentRequesterSelection />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('shows error state when fetch fails', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error')) as any;
    render(<DevelopmentRequesterSelection />);
    
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
    expect(screen.getByTestId('error-message')).toHaveTextContent('Network error');
  });

  it('renders dropdown and populates it on successful fetch', async () => {
    const mockRequesters = [
      { id: 1, name: 'Alice', email: 'alice@example.com', isActive: true },
      { id: 2, name: 'Bob', email: 'bob@example.com', isActive: true },
    ];
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockRequesters,
    }) as any;

    render(<DevelopmentRequesterSelection />);

    await waitFor(() => {
      expect(screen.getByTestId('requester-dropdown')).toBeInTheDocument();
    });

    const dropdown = screen.getByTestId('requester-dropdown') as HTMLSelectElement;
    expect(dropdown.children.length).toBe(3); // 1 placeholder + 2 options
    expect(screen.getByText('Alice (alice@example.com)')).toBeInTheDocument();
  });

  it('saves to localStorage when a requester is selected and continue is clicked', async () => {
    const mockRequesters = [
      { id: 1, name: 'Alice', email: 'alice@example.com', isActive: true },
    ];
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockRequesters,
    }) as any;

    render(<DevelopmentRequesterSelection />);

    await waitFor(() => {
      expect(screen.getByTestId('requester-dropdown')).toBeInTheDocument();
    });

    const dropdown = screen.getByTestId('requester-dropdown');
    await userEvent.selectOptions(dropdown, '1');

    const button = screen.getByTestId('continue-btn');
    expect(button).not.toBeDisabled();
    await userEvent.click(button);

    expect(localStorage.getItem('dev_requester_id')).toBe('1');
    expect(screen.getByTestId('saved-message')).toBeInTheDocument();
  });
});
