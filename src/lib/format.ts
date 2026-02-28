export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}
