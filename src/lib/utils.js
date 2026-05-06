export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US').format(new Date(date));
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
