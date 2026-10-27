import { PlanType } from "@prisma/client";

export function addPeriod(date: Date, planType: PlanType): Date {
  const d = new Date(date);
  if (planType === PlanType.MONTHLY) d.setMonth(d.getMonth() + 1);
  else d.setDate(d.getDate() + 1);
  return d;
}

export function makeTxnRef(): string {
  return `TXN-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;
}
