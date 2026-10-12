import { describe, it, expect } from 'vitest';
import { generateUpiUri } from '../lib/payments/upi';

describe('UPI String Builder', () => {
  it('generates a valid UPI string format', () => {
    const vpa = 'test@ybl';
    const payee = 'Test PG';
    const amount = 1500.50;
    const invId = 'INV123';
    const txnRef = 'TXN123';

    const uri = generateUpiUri(vpa, payee, amount, invId, txnRef);

    // upi://pay?pa=test%40ybl&pn=Test+PG&am=1500.50&cu=INR&tn=INV123&tr=TXN123
    expect(uri).toContain('upi://pay?');
    expect(uri).toContain('pa=test%40ybl'); // url encoded @
    expect(uri).toContain('pn=Test+PG');
    expect(uri).toContain('am=1500.50');
    expect(uri).toContain('cu=INR');
    expect(uri).toContain('tn=INV123');
    expect(uri).toContain('tr=TXN123');
  });
});
