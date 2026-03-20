"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatNumber } from "@/lib/safestep/formatters";
import type { UncertaintyRow, YearlyResultRow } from "@/lib/safestep/types";

type YearlyChartRow = {
  year: string;
  fallsAvoided: number;
  cumulativeProgrammeCost: number;
  cumulativeGrossSavings: number;
};

type UncertaintyChartRow = {
  case: string;
  discountedCostPerQaly: number;
  decisionStatus: string;
};

function buildYearlyChartData(yearlyResults: YearlyResultRow[]): YearlyChartRow[] {
  return yearlyResults.map((row) => ({
    year: `Y${row.year}`,
    fallsAvoided: row.falls_avoided,
    cumulativeProgrammeCost: row.cumulative_programme_cost,
    cumulativeGrossSavings: row.cumulative_gross_savings,
  }));
}

function buildUncertaintyChartData(
  uncertaintyRows: UncertaintyRow[],
): UncertaintyChartRow[] {
  return uncertaintyRows.map((row) => ({
    case: row.case,
    discountedCostPerQaly: row.discounted_cost_per_qaly,
    decisionStatus: row.decision_status,
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:p-4 xl:p-5">
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 lg:text-base">
          Falls avoided
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 lg:text-sm">
          Annual impact across the horizon.
        </p>
      </div>

      <div className="h-48 w-full lg:h-64 xl:h-72">
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
              width={46}
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:p-4 xl:p-5">
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 lg:text-base">
          Cost vs savings
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 lg:text-sm">
          Cumulative delivery cost against gross savings.
        </p>
      </div>

      <div className="h-48 w-full lg:h-64 xl:h-72">
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
              width={54}
            />
            <Tooltip content={<CurrencyTooltip />} />
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

export function BoundedUncertaintyChart({
  uncertaintyRows,
  threshold,
}: {
  uncertaintyRows: UncertaintyRow[];
  threshold: number;
}) {
  const data = buildUncertaintyChartData(uncertaintyRows);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:p-4 xl:p-5">
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 lg:text-base">
          Uncertainty
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 lg:text-sm">
          Low, base, and high cases against the threshold.
        </p>
      </div>

      <div className="h-56 w-full lg:h-64 xl:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="case"
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <YAxis
              tickFormatter={(value) => {
                const numeric = Number(value);
                if (Math.abs(numeric) >= 1000) {
                  return `£${(numeric / 1000).toFixed(0)}k`;
                }
                return formatCurrency(numeric);
              }}
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={54}
            />
            <Tooltip content={<CurrencyTooltip />} />
            <ReferenceLine
              y={threshold}
              stroke="#c2410c"
              strokeWidth={2}
              strokeDasharray="4 4"
              ifOverflow="extendDomain"
            />
            <Bar
              dataKey="discountedCostPerQaly"
              name="Discounted cost per QALY"
              radius={[8, 8, 0, 0]}
            >
              {data.map((entry) => {
                const belowThreshold = entry.discountedCostPerQaly <= threshold;
                return (
                  <Cell
                    key={`cell-${entry.case}`}
                    fill={belowThreshold ? "#0f172a" : "#94a3b8"}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-[11px] leading-5 text-slate-600">
        Dark bars are at or below threshold.
      </p>
    </div>
  );
}