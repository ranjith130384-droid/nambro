export function generateUpiUri(
  vpa: string,
  payeeName: string,
  amount: number,
  invoiceId: string,
  transactionRef: string
): string {
  const params = new URLSearchParams({
    pa: vpa,
    pn: payeeName,
    am: amount.toFixed(2),
    cu: 'INR',
    tn: invoiceId,
    tr: transactionRef,
  });

  return `upi://pay?${params.toString()}`;
}
