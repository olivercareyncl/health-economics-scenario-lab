import type { AssumptionFormatter } from "./types";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

export function formatRatio(value: number): string {
  return `${value.toFixed(2)}x`;
}

export function formatDecimal1(value: number): string {
  return value.toFixed(1);
}

export function formatDecimal2(value: number): string {
  return value.toFixed(2);
}

export function formatInteger(value: number): string {
  return `${Math.round(value)}`;
}

export function formatByType(
  value: string | number,
  formatter: AssumptionFormatter,
): string {
  switch (formatter) {
    case "currency":
      return formatCurrency(Number(value));
    case "percent":
      return formatPercent(Number(value));
    case "number":
      return formatNumber(Number(value));
    case "decimal1":
      return formatDecimal1(Number(value));
    case "decimal2":
      return formatDecimal2(Number(value));
    case "integer":
      return formatInteger(Number(value));
    case "text":
    default:
      return String(value);
  }
}