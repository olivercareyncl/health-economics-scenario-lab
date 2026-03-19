"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatNumber } from "@/lib/safestep/formatters";
import type { YearlyResultRow } from "@/lib/safestep/types";

type YearlyChartRow = {
  year: string;
  fallsAvoided: number;
  cumulativeProgrammeCost: number;
  cumulativeGrossSavings: number;
};

function buildYearlyChartData(yearlyResults: YearlyResultRow[]): YearlyChartRow[] {
  return yearlyResults.map((row) => ({
    year: `Year ${row.year}`,
    fallsAvoided: row.falls_avoided,
    cumulativeProgrammeCost: row.cumulative_programme_cost,
    cumulativeGrossSavings: row.cumulative_gross_savings,
  }));
}

function CurrencyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-sm font-medium text-slate-900">{label}</p>
      <div className="mt-2 space-y-1">
        {payload.map((item, index) => (
          <p key={`${item.name}-${index}`} className="text-sm text-slate-600">
            <span className="font-medium text-slate-800">{item.name}:</span>{" "}
            {formatCurrency(item.value ?? 0)}
          </p>
        ))}
      </div>
    </div>
  );
}

function NumberTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-sm font-medium text-slate-900">{label}</p>
      <div className="mt-2 space-y-1">
        {payload.map((item, index) => (
          <p key={`${item.name}-${index}`} className="text-sm text-slate-600">
            <span className="font-medium text-slate-800">{item.name}:</span>{" "}
            {formatNumber(item.value ?? 0)}
          </p>
        ))}
      </div>
    </div>
  );
}

export function FallsAvoidedChart({
  yearlyResults,
}: {
  yearlyResults: YearlyResultRow[];
}) {
  const data = buildYearlyChartData(yearlyResults);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold tracking-tight text-slate-900">
          Falls avoided by year
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          A simple view of how annual impact changes across the selected horizon.
        </p>
      </div>

      <div className="h-64 w-full md:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="year"
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <YAxis
              tickFormatter={(value) => formatNumber(Number(value))}
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={48}
            />
            <Tooltip content={<NumberTooltip />} />
            <Bar
              dataKey="fallsAvoided"
              name="Falls avoided"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CostVsSavingsChart({
  yearlyResults,
}: {
  yearlyResults: YearlyResultRow[];
}) {
  const data = buildYearlyChartData(yearlyResults);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold tracking-tight text-slate-900">
          Cumulative programme cost vs savings
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Shows how delivery cost and gross savings build over time.
        </p>
      </div>

      <div className="h-64 w-full md:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="year"
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <YAxis
              tickFormatter={(value) => {
                const numeric = Number(value);
                if (Math.abs(numeric) >= 1000000) {
                  return `£${(numeric / 1000000).toFixed(1)}m`;
                }
                if (Math.abs(numeric) >= 1000) {
                  return `£${(numeric / 1000).toFixed(0)}k`;
                }
                return formatCurrency(numeric);
              }}
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={56}
            />
            <Tooltip content={<CurrencyTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="cumulativeProgrammeCost"
              name="Programme cost"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="cumulativeGrossSavings"
              name="Gross savings"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}