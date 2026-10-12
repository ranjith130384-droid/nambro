import { describe, it, expect } from 'vitest';
import { calculateDepositSettlement } from '../lib/services/deposit-service';

describe('Deposit Service Settlement', () => {
  it('calculates full refund when no damages exist', () => {
    const damages = [
      { item: 'Bed', isDamaged: false, repairCost: 500 },
      { item: 'Mirror', isDamaged: false, repairCost: 200 }
    ];

    const result = calculateDepositSettlement(10000, damages, 'resident@upi', 'John Doe', 'BKG-123');

    expect(result.initialDeposit).toBe(10000);
    expect(result.totalDeductions).toBe(0);
    expect(result.netRefund).toBe(10000);
    expect(result.payoutUri).toContain('am=10000.00');
    expect(result.payoutUri).toContain('pa=resident%40upi');
  });

  it('calculates partial refund correctly with damages', () => {
    const damages = [
      { item: 'Bed', isDamaged: true, repairCost: 500 },
      { item: 'Mirror', isDamaged: false, repairCost: 200 },
      { item: 'Chair', isDamaged: true, repairCost: 300 }
    ];

    const result = calculateDepositSettlement(10000, damages, 'resident@upi', 'John Doe', 'BKG-123');

    expect(result.initialDeposit).toBe(10000);
    expect(result.totalDeductions).toBe(800);
    expect(result.netRefund).toBe(9200);
    expect(result.payoutUri).toContain('am=9200.00');
  });

  it('handles scenario where damages exceed deposit by flooring refund to 0', () => {
    const damages = [
      { item: 'TV', isDamaged: true, repairCost: 15000 }
    ];

    const result = calculateDepositSettlement(10000, damages, 'resident@upi', 'John Doe', 'BKG-123');

    expect(result.totalDeductions).toBe(15000);
    expect(result.netRefund).toBe(0);
    expect(result.payoutUri).toContain('am=0.00');
  });
});
