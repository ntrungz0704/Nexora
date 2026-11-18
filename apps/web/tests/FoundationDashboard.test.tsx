// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { FoundationDashboard } from '../src/features/system/FoundationDashboard';
import * as systemService from '../src/services/systemService';

describe('FoundationDashboard', () => {
  it('renders Single-Vendor foundation telemetry when API health & meta resolve', async () => {
    vi.spyOn(systemService, 'fetchHealthStatus').mockResolvedValue({
      status: 'ok',
      service: 'nexora-api',
      database: 'up',
      uptimeSeconds: 12,
      timestamp: '2026-11-18T15:00:00.000Z',
    });
    vi.spyOn(systemService, 'fetchSystemMeta').mockResolvedValue({
      name: 'Nexora',
      businessModel: 'single-vendor',
      roles: ['CUSTOMER', 'STAFF', 'ADMIN'],
      storeSettingsCount: 3,
      usersCount: 3,
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <FoundationDashboard />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('ONLINE')).toBeInTheDocument();
    expect(screen.getByText('UP')).toBeInTheDocument();
    expect(screen.getByText('Single-Vendor')).toBeInTheDocument();
    expect(screen.getByText('3 Users / 3 Settings')).toBeInTheDocument();
  });
});
