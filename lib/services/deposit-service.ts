export interface DamageReport {
  item: string;
  isDamaged: boolean;
  repairCost: number;
}

export interface DepositSettlement {
  initialDeposit: number;
  totalDeductions: number;
  netRefund: number;
  payoutUri: string;
}

/**
 * Calculates deductions and generates the zero-fee UPI payout link.
 */
export function calculateDepositSettlement(
  initialDeposit: number,
  damages: DamageReport[],
  residentVpa: string,
  residentName: string,
  bookingId: string
): DepositSettlement {
  const totalDeductions = damages
    .filter(d => d.isDamaged)
    .reduce((sum, d) => sum + d.repairCost, 0);

  const netRefund = Math.max(0, initialDeposit - totalDeductions);

  // Zero-Cost Refund / Payout Guardrail
  const params = new URLSearchParams({
    pa: residentVpa,
    pn: residentName,
    am: netRefund.toFixed(2),
    cu: 'INR',
    tn: `DepositRefund_${bookingId}`
  });

  const payoutUri = `upi://pay?${params.toString()}`;

  return {
    initialDeposit,
    totalDeductions,
    netRefund,
    payoutUri
  };
}
