/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PostItem } from '@postforge/core';
import { ScheduleQueue } from './ScheduleQueue';
import { OFFLINE_STATUS } from '../lib/api/client';

vi.mock('../lib/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/api/client')>();
  return {
    ...actual,
    api: {
      ...actual.api,
      dispatch: vi.fn(),
      approve: vi.fn(),
      logs: vi.fn().mockResolvedValue([]),
      getPerformance: vi.fn().mockResolvedValue({}),
      logPerformance: vi.fn(),
    },
    LINKEDIN_CONNECT_URL: 'http://localhost:3001/api/auth/linkedin',
  };
});

const { api } = await import('../lib/api/client');

const makePost = (overrides: Partial<PostItem> = {}): PostItem => ({
  id: 'post-1',
  projectId: 'demo',
  platform: 'x',
  slot: 'morning',
  framework: 'contrarian-engineering',
  frameworkName: 'Morning Velocity',
  hook: 'Most developers overcomplicate state.',
  mainContent: 'Most developers overcomplicate state management.\n\nWhat is your rule?',
  hasRootLink: false,
  replyContent: 'Source code: https://example.com',
  scheduledDate: new Date(Date.now() + 3600_000).toISOString(),
  jitterMinutes: 12,
  status: 'draft',
  whyAlgorithmLikes: '',
  algorithmScore: {
    netScore: 82,
    replyMultiplier: 150,
    dwellTimeSeconds: 9,
    rootLinkPenalty: false,
    hashtagCount: 0,
    simClusterAlignment: 71,
    impressionMultiplierEst: 2.4,
  },
  linterChecks: [],
  ...overrides,
});

const props = (overrides: Partial<Parameters<typeof ScheduleQueue>[0]> = {}) => ({
  posts: [makePost()],
  onRemovePost: vi.fn(),
  onUpdateStatus: vi.fn(),
  onReschedulePost: vi.fn(),
  backend: OFFLINE_STATUS,
  ...overrides,
});

describe('<ScheduleQueue />', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the empty state when there is nothing queued', () => {
    render(<ScheduleQueue {...props({ posts: [] })} />);
    expect(screen.getByText(/queue empty/i)).toBeInTheDocument();
  });

  it('reports the zero-cost mode when the backend is offline', () => {
    render(<ScheduleQueue {...props()} />);
    expect(screen.getByText(/1-click native intent \(zero-cost\)/i)).toBeInTheDocument();
  });

  it('reports backend auto-dispatch when the backend is live', () => {
    render(<ScheduleQueue {...props({ backend: { ...OFFLINE_STATUS, available: true, dryRun: true } })} />);
    expect(screen.getByText(/backend auto-dispatch \(dry-run\)/i)).toBeInTheDocument();
  });

  it('marks a post pending — never published — when a native intent launches', () => {
    const onUpdateStatus = vi.fn();
    // window.open must not actually fire in the DOM environment.
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<ScheduleQueue {...props({ onUpdateStatus })} />);
    fireEvent.click(screen.getByRole('button', { name: /launch in x/i }));

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(onUpdateStatus).toHaveBeenCalledWith('post-1', 'pending');
    expect(onUpdateStatus).not.toHaveBeenCalledWith('post-1', 'published');

    openSpy.mockRestore();
  });

  it('confirms publishing only when the user explicitly marks it posted', async () => {
    const user = userEvent.setup();
    const onUpdateStatus = vi.fn();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    const { rerender } = render(<ScheduleQueue {...props({ onUpdateStatus })} />);
    await user.click(screen.getByRole('button', { name: /launch in x/i }));
    expect(onUpdateStatus).toHaveBeenLastCalledWith('post-1', 'pending');

    rerender(<ScheduleQueue {...props({ onUpdateStatus, posts: [makePost({ status: 'pending' })] })} />);
    await user.click(screen.getByRole('button', { name: /mark as posted/i }));
    expect(onUpdateStatus).toHaveBeenLastCalledWith('post-1', 'published');

    openSpy.mockRestore();
  });

  it('dispatches through the backend and records the result', async () => {
    const user = userEvent.setup();
    const onUpdateStatus = vi.fn();
    vi.mocked(api.dispatch).mockResolvedValue({ ok: true, remoteId: '123', simulated: true });

    render(
      <ScheduleQueue
        {...props({ onUpdateStatus, backend: { ...OFFLINE_STATUS, available: true, dryRun: true } })}
      />
    );
    await user.click(screen.getByRole('button', { name: /auto-dispatch/i }));

    expect(api.dispatch).toHaveBeenCalledWith('post-1');
    expect(onUpdateStatus).toHaveBeenCalledWith('post-1', 'published');
  });

  it('surfaces a dispatch failure inline instead of swallowing it', async () => {
    const user = userEvent.setup();
    vi.mocked(api.dispatch).mockRejectedValue(new Error('x api down'));

    render(
      <ScheduleQueue
        {...props({ backend: { ...OFFLINE_STATUS, available: true, dryRun: true } })}
      />
    );
    await user.click(screen.getByRole('button', { name: /auto-dispatch/i }));

    expect(await screen.findByText(/error: x api down/i)).toBeInTheDocument();
  });

  it('approves a draft for the scheduler when the backend is up', async () => {
    const user = userEvent.setup();
    const onUpdateStatus = vi.fn();
    vi.mocked(api.approve).mockResolvedValue(makePost({ status: 'approved' }));

    render(
      <ScheduleQueue
        {...props({ onUpdateStatus, backend: { ...OFFLINE_STATUS, available: true, dryRun: true } })}
      />
    );
    await user.click(screen.getByRole('button', { name: /approve/i }));

    expect(api.approve).toHaveBeenCalledWith('post-1');
    expect(onUpdateStatus).toHaveBeenCalledWith('post-1', 'approved');
  });

  it('offers the performance form on published posts', async () => {
    const user = userEvent.setup();
    render(<ScheduleQueue {...props({ posts: [makePost({ status: 'published' })] })} />);

    const toggle = screen.getByRole('button', { name: /log results/i });
    expect(toggle).toBeInTheDocument();
    await user.click(toggle);
    expect(screen.getByRole('button', { name: /save results/i })).toBeInTheDocument();
  });
});
