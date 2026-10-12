import { describe, it, expect } from 'vitest';
import { calculateProratedAddonFee, calculateTotalInvoice } from '../lib/services/billing-engine';
import { parseISO } from 'date-fns';

describe('Billing Engine Proration', () => {
  it('calculates mid-cycle prorated addon correctly', () => {
    // 30 days in November
    const cycleStart = parseISO('2023-11-01');
    const cycleEnd = parseISO('2023-11-30');

    // Subscribed for 15 days (Nov 16 to Nov 30)
    const startDate = parseISO('2023-11-16');
    const monthlyPrice = 3000;

    const result = calculateProratedAddonFee(monthlyPrice, startDate, null, cycleStart, cycleEnd);

    expect(result.daysActive).toBe(15);
    expect(result.amount).toBe(1500); // 3000 / 30 * 15
  });

  it('calculates total invoice correctly', () => {
    const cycleStart = parseISO('2023-11-01');
    const cycleEnd = parseISO('2023-11-30');

    const subs = [
      {
        id: 'sub1',
        monthlyPrice: 3000,
        startDate: parseISO('2023-11-16'),
        endDate: null,
        status: 'ACTIVE' as const,
      }
    ];

    const invoice = calculateTotalInvoice(10000, subs, 500, 200, cycleStart, cycleEnd);

    expect(invoice.baseRent).toBe(10000);
    expect(invoice.activeServiceAddons).toBe(1500);
    expect(invoice.lateFees).toBe(500);
    expect(invoice.discounts).toBe(200);
    expect(invoice.totalInvoice).toBe(11800); // 10000 + 1500 + 500 - 200
  });
});