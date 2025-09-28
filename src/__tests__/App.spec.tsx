/** @jest-environment jsdom */

import { TextDecoder, TextEncoder } from 'util';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

if (!(global as any).TextEncoder) {
  (global as any).TextEncoder = TextEncoder;
}
if (!(global as any).TextDecoder) {
  (global as any).TextDecoder = TextDecoder as unknown as typeof globalThis.TextDecoder;
}

// react-router relies on TextEncoder/TextDecoder during module evaluation, so require it after the polyfill.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { MemoryRouter } = require('react-router-dom');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const App = require('../App').default as typeof import('../App').default;

const mockCheckBackendHealth = jest.fn();

jest.mock('../hooks/useReferral', () => ({
  useReferral: () => ({ registerPendingReferral: jest.fn() }),
}));

jest.mock('../components/layout/Header', () => () => <div data-testid="header" />);
jest.mock('../components/layout/Footer', () => () => <div data-testid="footer" />);
jest.mock('../components/common/FloatingParticles', () => () => <div data-testid="particles" />);

jest.mock('../pages/HomePage', () => () => <div>Home Page</div>);
jest.mock('../pages/GamePage', () => () => <div>Game Page</div>);
jest.mock('../pages/InventoryPage', () => () => <div>Inventory Page</div>);
jest.mock('../pages/ShopPage', () => () => <div>Shop Page</div>);
jest.mock('../pages/ProfilePage', () => () => <div>Profile Page</div>);
jest.mock('../pages/LeaderboardPage', () => () => <div>Leaderboard Page</div>);
jest.mock('../pages/AboutPage', () => () => <div>About Page</div>);
jest.mock('../pages/TokenomicsPage', () => () => <div>Tokenomics Page</div>);
jest.mock('../pages/RoadmapPage', () => () => <div>Roadmap Page</div>);
jest.mock('../pages/VideosPage', () => () => <div>Videos Page</div>);
jest.mock('../pages/AdminPage', () => () => <div>Admin Page</div>);

jest.mock('../components/ai/AIAgent', () => () => <div data-testid="ai-agent" />);

jest.mock('../config/api.config', () => ({
  API_CONFIG: {
    BASE_URL: 'https://api.goalplay.test',
    DEFAULT_HEADERS: {},
  },
  checkBackendHealth: (...args: unknown[]) => mockCheckBackendHealth(...args),
}));

describe('App backend status indicator', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockCheckBackendHealth.mockReset();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('shows offline indicator and recovers after manual retry', async () => {
    mockCheckBackendHealth
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false);

    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() => expect(mockCheckBackendHealth).toHaveBeenCalled());
    await waitFor(() => screen.getByText('Sin conexión al servidor'));

    mockCheckBackendHealth.mockResolvedValueOnce(true);
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/i }));

    await waitFor(() => expect(screen.queryByText('Sin conexión al servidor')).toBeNull());
  });
});
