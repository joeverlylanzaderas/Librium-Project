export const formatCurrency = (amount: string | number) =>
  `₱${Number(amount).toFixed(2)}`;

export const computeFine = (
  dueDate: string,
  ratePerDay: number = 5
): number => {
  const due = new Date(dueDate);
  const now = new Date();
  if (now <= due) return 0;
  const diffMs = now.getTime() - due.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays * ratePerDay;
};
