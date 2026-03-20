export function formatCurrency(value: number): string {
  return `£${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function formatRatio(value: number): string {
  return `${value.toFixed(2)}x`;
}