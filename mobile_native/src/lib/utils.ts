export const formatCurrency = (val: number | string): string => {
  return new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(Number(val) || 0);
};
