import { describe, it, expect } from 'vitest';
import { calculateElectricitySplit } from '../lib/services/electricity-billing';

describe('Electricity Billing Split Calculation', () => {
  it('calculates the split correctly with valid readings', () => {
    const result = calculateElectricitySplit(100, 200, 10, 4);

    expect(result.unitsConsumed).toBe(100);
    expect(result.totalRoomCost).toBe(1000);
    expect(result.perBedShare).toBe(250);
    expect(result.requiresManualReview).toBe(false);
  });

  it('handles zero active occupants gracefully', () => {
    const result = calculateElectricitySplit(100, 200, 10, 0);

    expect(result.unitsConsumed).toBe(100);
    expect(result.totalRoomCost).toBe(1000);
    expect(result.perBedShare).toBe(0); // Should not throw divide by zero
    expect(result.requiresManualReview).toBe(false);
  });

  it('flags manual review when current reading is less than previous', () => {
    const result = calculateElectricitySplit(200, 100, 10, 4);

    expect(result.unitsConsumed).toBe(0); // Max with 0
    expect(result.totalRoomCost).toBe(0);
    expect(result.perBedShare).toBe(0);
    expect(result.requiresManualReview).toBe(true);
  });

  it('handles negative decimals properly rounding to 2 decimal places', () => {
    const result = calculateElectricitySplit(100.25, 200.75, 8.33, 3);

    expect(result.unitsConsumed).toBe(100.50);
    expect(result.totalRoomCost).toBe(837.16);
    expect(result.perBedShare).toBe(279.06);
  });
});
