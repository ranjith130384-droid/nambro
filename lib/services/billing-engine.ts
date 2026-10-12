import { differenceInDays, getDaysInMonth, startOfMonth, endOfMonth, isAfter, isBefore } from 'date-fns';

export interface ServiceSubscription {
  id: string;
  monthlyPrice: number;
  startDate: Date;
  endDate: Date | null;
  status: 'ACTIVE' | 'CANCELLED';
}

export interface ProrationCalculation {
  baseRent: number;
  activeServiceAddons: number;
  lateFees: number;
  discounts: number;
  totalInvoice: number;
  proratedItems: {
    serviceId: string;
    proratedAmount: number;
    daysActive: number;
  }[];
}

export function calculateProratedAddonFee(
  monthlyPrice: number,
  startDate: Date,
  endDate: Date | null,
  cycleStart: Date,
  cycleEnd: Date
): { amount: number; daysActive: number } {
  const effectiveStartDate = isAfter(startDate, cycleStart) ? startDate : cycleStart;
  const effectiveEndDate = endDate && isBefore(endDate, cycleEnd) ? endDate : cycleEnd;

  if (isAfter(effectiveStartDate, effectiveEndDate)) {
    return { amount: 0, daysActive: 0 };
  }

  const daysActive = differenceInDays(effectiveEndDate, effectiveStartDate) + 1;
  const daysInMonth = getDaysInMonth(cycleStart);

  const amount = (monthlyPrice / daysInMonth) * daysActive;

  return {
    amount: Number(amount.toFixed(2)),
    daysActive,
  };
}

export function calculateTotalInvoice(
  baseRent: number,
  serviceSubscriptions: ServiceSubscription[],
  lateFees: number,
  discounts: number,
  cycleStart: Date,
  cycleEnd: Date
): ProrationCalculation {
  let activeServiceAddonsTotal = 0;
  const proratedItems = [];

  for (const sub of serviceSubscriptions) {
    if (sub.status === 'ACTIVE' || (sub.status === 'CANCELLED' && sub.endDate && isAfter(sub.endDate, cycleStart))) {
      const { amount, daysActive } = calculateProratedAddonFee(
        sub.monthlyPrice,
        sub.startDate,
        sub.endDate,
        cycleStart,
        cycleEnd
      );

      activeServiceAddonsTotal += amount;

      if (amount > 0) {
        proratedItems.push({
          serviceId: sub.id,
          proratedAmount: amount,
          daysActive,
        });
      }
    }
  }

  const totalInvoice = baseRent + activeServiceAddonsTotal + lateFees - discounts;

  return {
    baseRent,
    activeServiceAddons: Number(activeServiceAddonsTotal.toFixed(2)),
    lateFees,
    discounts,
    totalInvoice: Number(totalInvoice.toFixed(2)),
    proratedItems,
  };
}
