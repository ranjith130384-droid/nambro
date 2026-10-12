import { describe, it, expect, vi } from 'vitest';
import { generateGatePassToken } from '../lib/services/gate-pass';

describe('Gate Pass Token Generator', () => {
  it('generates a 6-digit numeric token', () => {
    const token = generateGatePassToken('res-1234');
    expect(token).toMatch(/^\d{6}$/);
  });

  it('generates the same token within the same time step', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2023, 1, 1, 12, 0, 0)); // Set a fixed time

    const token1 = generateGatePassToken('res-1234');
    const token2 = generateGatePassToken('res-1234');

    expect(token1).toBe(token2);
    vi.useRealTimers();
  });

  it('generates different tokens for different time steps', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2023, 1, 1, 12, 0, 0));
    const token1 = generateGatePassToken('res-1234');

    vi.setSystemTime(new Date(2023, 1, 1, 12, 1, 0)); // 1 minute later
    const token2 = generateGatePassToken('res-1234');

    expect(token1).not.toBe(token2);
    vi.useRealTimers();
  });

  it('generates different tokens for different residents at the same time', () => {
    const token1 = generateGatePassToken('res-1234');
    const token2 = generateGatePassToken('res-5678');

    expect(token1).not.toBe(token2);
  });
});
