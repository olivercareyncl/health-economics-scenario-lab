export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return "£0";
  return `£${value.toLocaleString("en-GB", {
    maximumFractionDigits: 0,
  })}`;
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return "0.0%";
  return `${(value * 100).toFixed(1)}%`;
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return value.toLocaleString("en-GB", {
    maximumFractionDigits: 0,
  });
}

export function formatRatio(value: number): string {
  if (!Number.isFinite(value)) return "0.00x";
  return `${value.toFixed(2)}x`;
}