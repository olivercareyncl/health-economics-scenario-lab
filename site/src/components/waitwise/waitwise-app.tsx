"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  RotateCcw,
  ChevronDown,
  SlidersHorizontal,
  BarChart3,
  FileSearch,
  FileDown,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DEFAULT_INPUTS } from "@/lib/waitwise/defaults";
import {
  clampRate,
  runBoundedUncertainty,
  runModel,
} from "@/lib/waitwise/calculations";
import {
  buildBacklogReductionChartData,
  buildCumulativeCostChartData,
  buildImpactBarChartData,
  buildTornadoChartData,
  buildUncertaintyChartData,
  compactCurrencyAxis,
} from "@/lib/waitwise/charts";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRatio,
} from "@/lib/waitwise/formatters";
import {
  assessUncertaintyRobustness,
  generateInterpretation,
  generateOverviewSummary,
  generateStructuredRecommendation,
  getDecisionStatus,
  getNetCostLabel,
} from "@/lib/waitwise/summaries";
import type {
  AssumptionSectionKey,
  CostingMethod,
  Inputs,
  MobileTab,
  SensitivityRow,
  UncertaintyRow,
  YearlyResultRow,
} from "@/lib/waitwise/types";

type SensitivitySummary = {
  rows: SensitivityRow[];
  primary_driver: SensitivityRow | null;
  top_drivers: SensitivityRow[];
};

const COSTING_METHOD_OPTIONS: readonly CostingMethod[] = [
  "Escalation and admission savings only",
  "Bed-day value only",
  "Combined illustrative view",
] as const;

const SENSITIVITY_VARIABLES: Array<keyof Inputs> = [
  "intervention_reach_rate",
  "target_population_multiplier",
  "target_reach_multiplier",
  "target_escalation_risk_multiplier",
  "demand_reduction_effect",
  "throughput_increase_effect",
  "escalation_reduction_effect",
  "intervention_cost_per_patient_reached",
  "monthly_escalation_rate",
  "qaly_gain_per_escalation_avoided",
  "cost_per_admission",
  "cost_per_escalation",
  "effect_decay_rate",
  "participation_dropoff_rate",
];

const RATE_VARIABLES = new Set<keyof Inputs>([
  "intervention_reach_rate",
  "target_population_multiplier",
  "target_reach_multiplier",
  "target_escalation_risk_multiplier",
  "demand_reduction_effect",
  "throughput_increase_effect",
  "escalation_reduction_effect",
  "effect_decay_rate",
  "participation_dropoff_rate",
  "monthly_escalation_rate",
  "admission_rate_after_escalation",
  "discount_rate",
]);

const PANEL_SHELL =
  "rounded-[26px] border border-slate-200 bg-slate-50 p-4 sm:p-5 lg:p-5 xl:p-6";
const SUBCARD =
  "rounded-2xl border border-slate-200 bg-white p-4 lg:p-4 xl:p-5";
const SUBCARD_DENSE =
  "rounded-2xl border border-slate-200 bg-white p-3.5 lg:p-4";
const SECTION_KICKER =
  "text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normaliseCurrencyDisplay(value: string) {
  return value.replace(/^£-/, "-£");
}

function deriveCaseType(inputs: Inputs): string {
  if (inputs.target_escalation_risk_multiplier >= 1.35) {
    return "More concentrated high-risk case";
  }

  if (inputs.target_population_multiplier <= 0.6) {
    return "Narrower targeted case";
  }

  if (inputs.target_reach_multiplier >= 1.05) {
    return "Higher-reach targeted case";
  }

  if (
    inputs.throughput_increase_effect >
      inputs.demand_reduction_effect + 0.02 &&
    inputs.throughput_increase_effect >
      inputs.escalation_reduction_effect + 0.02
  ) {
    return "Throughput-boost case";
  }

  if (
    inputs.demand_reduction_effect >
      inputs.throughput_increase_effect + 0.02 &&
    inputs.demand_reduction_effect >
      inputs.escalation_reduction_effect + 0.02
  ) {
    return "Demand-reduction case";
  }

  if (inputs.intervention_cost_per_patient_reached <= 150) {
    return "Lower-cost delivery case";
  }

  return "Broad waiting-list case";
}

function runOneWaySensitivity(
  baseInputs: Inputs,
  variables: Array<keyof Inputs>,
  variation = 0.2,
): SensitivityRow[] {
  const baseResults = runModel(baseInputs);
  const baseOutcome = Number(baseResults.discounted_cost_per_qaly);

  const rows: SensitivityRow[] = [];

  for (const variable of variables) {
    const baseInput = Number(baseInputs[variable]);
    const isRate = RATE_VARIABLES.has(variable);

    let lowInput = baseInput * (1 - variation);
    let highInput = baseInput * (1 + variation);

    if (isRate) {
      lowInput = clampRate(lowInput);
      highInput = clampRate(highInput);
    }

    const lowInputs: Inputs = { ...baseInputs, [variable]: lowInput };
    const highInputs: Inputs = { ...baseInputs, [variable]: highInput };

    const lowOutcome = Number(runModel(lowInputs).discounted_cost_per_qaly);
    const highOutcome = Number(runModel(highInputs).discounted_cost_per_qaly);

    rows.push({
      variable,
      label: variable.replaceAll("_", " "),
      base_input: baseInput,
      low_input: lowInput,
      high_input: highInput,
      base_outcome: baseOutcome,
      low_outcome: lowOutcome,
      high_outcome: highOutcome,
      low_delta: lowOutcome - baseOutcome,
      high_delta: highOutcome - baseOutcome,
      swing: Math.abs(highOutcome - lowOutcome),
    });
  }

  return rows.sort((a, b) => b.swing - a.swing);
}

function buildSensitivitySummary(rows: SensitivityRow[]): SensitivitySummary {
  const topDrivers = rows.slice(0, 5);

  return {
    rows,
    primary_driver: topDrivers[0] ?? null,
    top_drivers: topDrivers,
  };
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
            {normaliseCurrencyDisplay(formatCurrency(item.value ?? 0))}
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

function SectionCard({
  title,
  description,
  action,
  children,
  dense = false,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  dense?: boolean;
}) {
  return (
    <section
      className={cx(
        PANEL_SHELL,
        dense ? "p-4 lg:p-5" : "p-4 sm:p-5 lg:p-5 xl:p-6",
      )}
    >
      <div className="mb-4 flex flex-col gap-3 lg:mb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-slate-950 lg:text-lg">
            {title}
          </h2>
          {description ? (
            <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0 self-start">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

function MetricCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "strong";
}) {
  return (
    <div className={SUBCARD_DENSE}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p
        className={cx(
          "mt-1.5 tracking-tight text-slate-950",
          tone === "strong"
            ? "text-2xl font-semibold lg:text-[1.7rem]"
            : "text-lg font-semibold lg:text-xl",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function MiniInsight({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className={SUBCARD_DENSE}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
    </div>
  );
}

function AssumptionReviewCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className={SUBCARD_DENSE}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-semibold text-slate-900">{value}</p>
      {note ? <p className="mt-1.5 text-sm leading-6 text-slate-600">{note}</p> : null}
    </div>
  );
}

function MobileTabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition",
        active
          ? "bg-slate-900 text-white"
          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function MobileAccordion({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-slate-900">{title}</span>
        <ChevronDown
          className={cx(
            "h-4 w-4 text-slate-500 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? <div className="border-t border-slate-200 p-4">{children}</div> : null}
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  step = 1,
  help,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: number;
  help?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        type="number"
        min={min}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500"
      />
      {help ? (
        <span className="mt-1.5 block text-xs leading-5 text-slate-500">
          {help}
        </span>
      ) : null}
    </label>
  );
}

function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  display,
  help,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  display: string;
  help?: string;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-4">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-sm font-semibold text-slate-900">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      {help ? <p className="mt-1.5 text-xs leading-5 text-slate-500">{help}</p> : null}
    </div>
  );
}

function SelectInput<T extends string>({
  label,
  value,
  options,
  onChange,
  help,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  help?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {help ? (
        <span className="mt-1.5 block text-xs leading-5 text-slate-500">
          {help}
        </span>
      ) : null}
    </label>
  );
}

function BacklogReductionChart({
  yearlyResults,
}: {
  yearlyResults: YearlyResultRow[];
}) {
  const data = buildBacklogReductionChartData(yearlyResults);

  return (
    <div className={SUBCARD}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 lg:text-base">
          Backlog reduction
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 lg:text-sm">
          Annual waiting list reduction across the selected horizon.
        </p>
      </div>

      <div className="h-52 w-full lg:h-64 xl:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis
              tickFormatter={(value) => formatNumber(Number(value))}
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={56}
            />
            <Tooltip content={<NumberTooltip />} />
            <Bar
              dataKey="waitingListReduction"
              name="Waiting list reduction"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CostVsSavingsChart({
  yearlyResults,
}: {
  yearlyResults: YearlyResultRow[];
}) {
  const data = buildCumulativeCostChartData(yearlyResults);

  return (
    <div className={SUBCARD}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 lg:text-base">
          Cost vs savings
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 lg:text-sm">
          Cumulative programme cost compared with cumulative gross savings.
        </p>
      </div>

      <div className="h-52 w-full lg:h-64 xl:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis
              tickFormatter={(value) => compactCurrencyAxis(Number(value))}
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={58}
            />
            <Tooltip content={<CurrencyTooltip />} />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Line
              type="monotone"
              dataKey="programmeCost"
              name="Programme cost"
              stroke="#0f172a"
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="grossSavings"
              name="Gross savings"
              stroke="#b91c1c"
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function PathwayImpactChart({
  results,
}: {
  results: ReturnType<typeof runModel>;
}) {
  const data = buildImpactBarChartData(results).map((row) => ({
    label: row.label,
    shortLabel:
      row.label === "Waiting list reduction" ? "Backlog reduction" : row.label,
    value: row.value,
  }));

  return (
    <div className={SUBCARD}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 lg:text-base">
          Pathway impact
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 lg:text-sm">
          Headline pathway changes over the selected horizon.
        </p>
      </div>

      <div className="h-56 w-full lg:h-64 xl:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 12, left: 8, bottom: 0 }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis
              type="number"
              tickFormatter={(value) => formatNumber(Number(value))}
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <YAxis
              type="category"
              dataKey="shortLabel"
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={138}
            />
            <Tooltip content={<NumberTooltip />} />
            <Bar dataKey="value" name="Impact" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function BoundedUncertaintyChart({
  uncertaintyRows,
  threshold,
}: {
  uncertaintyRows: UncertaintyRow[];
  threshold: number;
}) {
  const data = buildUncertaintyChartData(uncertaintyRows);

  return (
    <div className={SUBCARD}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 lg:text-base">
          Bounded uncertainty
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 lg:text-sm">
          Low, base, and high cases against the current threshold.
        </p>
      </div>

      <div className="h-56 w-full lg:h-64 xl:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="case" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis
              tickFormatter={(value) => compactCurrencyAxis(Number(value))}
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={58}
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

      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
          Dark bars are at or below threshold
        </span>
      </div>
    </div>
  );
}

function SensitivityChart({
  sensitivity,
}: {
  sensitivity: SensitivitySummary;
}) {
  const data = buildTornadoChartData(sensitivity.top_drivers);

  return (
    <div className={SUBCARD}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 lg:text-base">
          One-way sensitivity
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 lg:text-sm">
          Top drivers of discounted cost per QALY when varied one at a time.
        </p>
      </div>

      <div className="h-64 w-full lg:h-72 xl:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 20, left: 12, bottom: 0 }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis
              type="number"
              tickFormatter={(value) => compactCurrencyAxis(Number(value))}
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <YAxis
              type="category"
              dataKey="label"
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={220}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                normaliseCurrencyDisplay(formatCurrency(value)),
                name === "lowDelta" ? "Low case delta" : "High case delta",
              ]}
            />
            <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={1.5} />
            <Legend
              wrapperStyle={{ fontSize: "12px" }}
              formatter={(value) =>
                value === "lowDelta" ? "Low case" : "High case"
              }
            />
            <Bar
              dataKey="lowDelta"
              name="lowDelta"
              fill="#94a3b8"
              radius={[0, 6, 6, 0]}
            />
            <Bar
              dataKey="highDelta"
              name="highDelta"
              fill="#0f172a"
              radius={[0, 6, 6, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function WaitWiseApp() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS);
  const [mobileTab, setMobileTab] = useState<MobileTab>("summary");
  const [showAdvancedMobile, setShowAdvancedMobile] = useState(false);
  const [openSections, setOpenSections] = useState<
    Record<AssumptionSectionKey, boolean>
  >({
    "advanced-delivery": false,
    "advanced-pathway": false,
    "advanced-economics": false,
  });

  const results = useMemo(() => runModel(inputs), [inputs]);
  const uncertainty = useMemo(() => runBoundedUncertainty(inputs), [inputs]);
  const sensitivityRows = useMemo(
    () => runOneWaySensitivity(inputs, SENSITIVITY_VARIABLES),
    [inputs],
  );
  const sensitivity = useMemo(
    () => buildSensitivitySummary(sensitivityRows),
    [sensitivityRows],
  );

  const decisionStatus = useMemo(
    () => getDecisionStatus(results, inputs.cost_effectiveness_threshold),
    [results, inputs.cost_effectiveness_threshold],
  );

  const netCostLabel = useMemo(() => getNetCostLabel(results), [results]);
  const currentCaseType = useMemo(() => deriveCaseType(inputs), [inputs]);

  const interpretation = useMemo(
    () => generateInterpretation(results, inputs, uncertainty),
    [results, inputs, uncertainty],
  );

  const overviewSummary = useMemo(
    () => generateOverviewSummary(results, inputs, uncertainty),
    [results, inputs, uncertainty],
  );

  const structuredRecommendation = useMemo(
    () => generateStructuredRecommendation(inputs, results, uncertainty),
    [inputs, results, uncertainty],
  );

  const uncertaintyRobustness = useMemo(
    () =>
      assessUncertaintyRobustness(
        uncertainty,
        inputs.cost_effectiveness_threshold,
      ),
    [uncertainty, inputs.cost_effectiveness_threshold],
  );

  const handleExportReport = async () => {
    try {
      const response = await fetch("/api/export/waitwise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs }),
      });

      if (!response.ok) {
        throw new Error("Failed to export report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "waitwise-report.pdf";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("WaitWise export failed:", error);
    }
  };

  const updateInput = <K extends keyof Inputs>(key: K, value: Inputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const resetToBaseCase = () => {
    setInputs({ ...DEFAULT_INPUTS });
    setShowAdvancedMobile(false);
    setOpenSections({
      "advanced-delivery": false,
      "advanced-pathway": false,
      "advanced-economics": false,
    });
  };

  const toggleSection = (key: AssumptionSectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const summaryMetrics = (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MetricCard
        label="Waiting list reduction"
        value={formatNumber(results.waiting_list_reduction_total)}
      />
      <MetricCard
        label="Escalations avoided"
        value={formatNumber(results.escalations_avoided_total)}
      />
      <MetricCard
        label={netCostLabel}
        value={normaliseCurrencyDisplay(
          formatCurrency(Math.abs(results.discounted_net_cost_total)),
        )}
      />
      <MetricCard
        label="Discounted cost per QALY"
        value={normaliseCurrencyDisplay(
          formatCurrency(results.discounted_cost_per_qaly),
        )}
        tone="strong"
      />
    </div>
  );

  const thresholdMetrics = (
    <div className="grid gap-3 xl:grid-cols-3">
      <MetricCard label="Return on spend" value={formatRatio(results.roi)} />
      <MetricCard
        label="Max intervention cost per patient"
        value={normaliseCurrencyDisplay(
          formatCurrency(results.break_even_cost_per_patient),
        )}
      />
      <MetricCard
        label="Required intervention effect"
        value={formatPercent(results.break_even_effect_required)}
      />
    </div>
  );

  const interpretationPanel = (
    <div className="grid gap-3 lg:grid-cols-4">
      <MiniInsight label="Current case type" value={currentCaseType} />
      <MiniInsight
        label="What this suggests"
        value={interpretation.what_model_suggests}
      />
      <MiniInsight
        label="Main dependency"
        value={structuredRecommendation.main_dependency}
      />
      <MiniInsight
        label="Main fragility"
        value={structuredRecommendation.main_fragility}
      />
    </div>
  );

  const recommendationPanel = (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <MiniInsight
        label="What this suggests"
        value={interpretation.what_model_suggests}
      />
      <MiniInsight
        label="What is driving it"
        value={structuredRecommendation.main_dependency}
      />
      <MiniInsight
        label="What looks fragile"
        value={structuredRecommendation.main_fragility}
      />
      <MiniInsight
        label="Validate next"
        value={structuredRecommendation.best_next_step}
      />
    </div>
  );

  const quickAssumptionNotice = (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-600">
      Start from the default case, then tune targeting, reach, intervention
      effects, persistence, escalation risk, and delivery cost to fit the local
      use case.
    </div>
  );

  const assumptionsQuick = (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Core setup
        </p>
        <div className="mt-3 grid gap-4 lg:gap-3 xl:grid-cols-2">
          <NumberInput
            label="Starting waiting list"
            value={inputs.starting_waiting_list_size}
            onChange={(value) => updateInput("starting_waiting_list_size", value)}
            step={100}
            help="Baseline backlog size."
          />
          <NumberInput
            label="Average wait duration"
            value={inputs.average_wait_duration_months}
            onChange={(value) => updateInput("average_wait_duration_months", value)}
            step={0.5}
            help="Contextual wait duration proxy in months."
          />
          <SliderInput
            label="Intervention reach"
            value={inputs.intervention_reach_rate}
            onChange={(value) => updateInput("intervention_reach_rate", value)}
            min={0}
            max={1}
            step={0.01}
            display={formatPercent(inputs.intervention_reach_rate)}
            help="Share of the list effectively reached."
          />
          <NumberInput
            label="Intervention cost per patient"
            value={inputs.intervention_cost_per_patient_reached}
            onChange={(value) =>
              updateInput("intervention_cost_per_patient_reached", value)
            }
            step={10}
            help="Main delivery cost lever."
          />
          <div className="xl:col-span-2">
            <SelectInput
              label="Time horizon"
              value={String(inputs.time_horizon_years) as "1" | "3" | "5"}
              options={["1", "3", "5"]}
              onChange={(value) =>
                updateInput("time_horizon_years", Number(value) as 1 | 3 | 5)
              }
              help="Longer horizons often improve the economic picture."
            />
          </div>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Targeting approach
        </p>
        <p className="mt-1.5 text-xs leading-5 text-slate-600">
          Set how concentrated the intervention is by adjusting the size of the
          target group, likely reach within that group, and their relative
          escalation risk.
        </p>
        <div className="mt-3 grid gap-4">
          <SliderInput
            label="Target population multiplier"
            value={inputs.target_population_multiplier}
            onChange={(value) => updateInput("target_population_multiplier", value)}
            min={0.2}
            max={1}
            step={0.01}
            display={formatPercent(inputs.target_population_multiplier)}
            help="Share of the total waiting list considered in scope."
          />
          <SliderInput
            label="Target reach multiplier"
            value={inputs.target_reach_multiplier}
            onChange={(value) => updateInput("target_reach_multiplier", value)}
            min={0.5}
            max={1.5}
            step={0.01}
            display={`${inputs.target_reach_multiplier.toFixed(2)}x`}
            help="Relative reach within the targeted subgroup."
          />
          <SliderInput
            label="Target escalation risk multiplier"
            value={inputs.target_escalation_risk_multiplier}
            onChange={(value) =>
              updateInput("target_escalation_risk_multiplier", value)
            }
            min={0.5}
            max={2}
            step={0.01}
            display={`${inputs.target_escalation_risk_multiplier.toFixed(2)}x`}
            help="Relative escalation risk in the targeted subgroup."
          />
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Intervention effects
        </p>
        <p className="mt-1.5 text-xs leading-5 text-slate-600">
          These are the main levers shaping where value comes from.
        </p>
        <div className="mt-3 grid gap-4">
          <SliderInput
            label="Demand reduction effect"
            value={inputs.demand_reduction_effect}
            onChange={(value) => updateInput("demand_reduction_effect", value)}
            min={0}
            max={0.5}
            step={0.01}
            display={formatPercent(inputs.demand_reduction_effect)}
            help="Lowers new demand entering the list."
          />
          <SliderInput
            label="Throughput increase effect"
            value={inputs.throughput_increase_effect}
            onChange={(value) => updateInput("throughput_increase_effect", value)}
            min={0}
            max={0.5}
            step={0.01}
            display={formatPercent(inputs.throughput_increase_effect)}
            help="Raises the number of patients processed."
          />
          <SliderInput
            label="Escalation reduction effect"
            value={inputs.escalation_reduction_effect}
            onChange={(value) => updateInput("escalation_reduction_effect", value)}
            min={0}
            max={0.5}
            step={0.01}
            display={formatPercent(inputs.escalation_reduction_effect)}
            help="Reduces deterioration while patients wait."
          />
        </div>
      </div>
    </div>
  );

  const advancedSections = (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => toggleSection("advanced-delivery")}
          className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
          aria-expanded={openSections["advanced-delivery"]}
        >
          <span className="text-sm font-medium text-slate-900">
            Flow and persistence
          </span>
          <ChevronDown
            className={cx(
              "h-4 w-4 text-slate-500 transition-transform",
              openSections["advanced-delivery"] && "rotate-180",
            )}
          />
        </button>

        {openSections["advanced-delivery"] ? (
          <div className="border-t border-slate-200 p-4">
            <div className="grid gap-4 xl:grid-cols-2">
              <NumberInput
                label="Monthly inflow"
                value={inputs.monthly_inflow}
                onChange={(value) => updateInput("monthly_inflow", value)}
                step={25}
              />
              <NumberInput
                label="Baseline throughput"
                value={inputs.baseline_monthly_throughput}
                onChange={(value) => updateInput("baseline_monthly_throughput", value)}
                step={25}
              />
              <SliderInput
                label="Annual effect decay"
                value={inputs.effect_decay_rate}
                onChange={(value) => updateInput("effect_decay_rate", value)}
                min={0}
                max={0.5}
                step={0.01}
                display={formatPercent(inputs.effect_decay_rate)}
              />
              <SliderInput
                label="Annual participation drop-off"
                value={inputs.participation_dropoff_rate}
                onChange={(value) =>
                  updateInput("participation_dropoff_rate", value)
                }
                min={0}
                max={0.5}
                step={0.01}
                display={formatPercent(inputs.participation_dropoff_rate)}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => toggleSection("advanced-pathway")}
          className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
          aria-expanded={openSections["advanced-pathway"]}
        >
          <span className="text-sm font-medium text-slate-900">
            Escalation and pathway
          </span>
          <ChevronDown
            className={cx(
              "h-4 w-4 text-slate-500 transition-transform",
              openSections["advanced-pathway"] && "rotate-180",
            )}
          />
        </button>

        {openSections["advanced-pathway"] ? (
          <div className="border-t border-slate-200 p-4">
            <div className="grid gap-4 xl:grid-cols-2">
              <SliderInput
                label="Monthly escalation rate"
                value={inputs.monthly_escalation_rate}
                onChange={(value) => updateInput("monthly_escalation_rate", value)}
                min={0}
                max={0.2}
                step={0.005}
                display={formatPercent(inputs.monthly_escalation_rate)}
              />
              <SliderInput
                label="Admission rate after escalation"
                value={inputs.admission_rate_after_escalation}
                onChange={(value) =>
                  updateInput("admission_rate_after_escalation", value)
                }
                min={0}
                max={1}
                step={0.01}
                display={formatPercent(inputs.admission_rate_after_escalation)}
              />
              <NumberInput
                label="Average length of stay"
                value={inputs.average_length_of_stay}
                onChange={(value) => updateInput("average_length_of_stay", value)}
                step={0.5}
              />
              <NumberInput
                label="QALY gain per escalation avoided"
                value={inputs.qaly_gain_per_escalation_avoided}
                onChange={(value) =>
                  updateInput("qaly_gain_per_escalation_avoided", value)
                }
                step={0.01}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => toggleSection("advanced-economics")}
          className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
          aria-expanded={openSections["advanced-economics"]}
        >
          <span className="text-sm font-medium text-slate-900">
            Cost inputs and threshold
          </span>
          <ChevronDown
            className={cx(
              "h-4 w-4 text-slate-500 transition-transform",
              openSections["advanced-economics"] && "rotate-180",
            )}
          />
        </button>

        {openSections["advanced-economics"] ? (
          <div className="border-t border-slate-200 p-4">
            <div className="grid gap-4 xl:grid-cols-2">
              <SelectInput
                label="Costing method"
                value={inputs.costing_method}
                options={COSTING_METHOD_OPTIONS}
                onChange={(value) => updateInput("costing_method", value)}
              />
              <NumberInput
                label="Cost-effectiveness threshold"
                value={inputs.cost_effectiveness_threshold}
                onChange={(value) =>
                  updateInput("cost_effectiveness_threshold", value)
                }
                step={1000}
              />
              <NumberInput
                label="Cost per escalation"
                value={inputs.cost_per_escalation}
                onChange={(value) => updateInput("cost_per_escalation", value)}
                step={50}
              />
              <NumberInput
                label="Cost per admission"
                value={inputs.cost_per_admission}
                onChange={(value) => updateInput("cost_per_admission", value)}
                step={100}
              />
              <NumberInput
                label="Cost per bed day"
                value={inputs.cost_per_bed_day}
                onChange={(value) => updateInput("cost_per_bed_day", value)}
                step={25}
              />
              <NumberInput
                label="Discount rate"
                value={inputs.discount_rate}
                onChange={(value) => updateInput("discount_rate", value)}
                step={0.005}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  const assumptionsReview = (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <AssumptionReviewCard
        label="Starting waiting list"
        value={formatNumber(inputs.starting_waiting_list_size)}
        note="Baseline backlog size."
      />
      <AssumptionReviewCard
        label="Monthly inflow"
        value={formatNumber(inputs.monthly_inflow)}
        note="New demand entering the list each month."
      />
      <AssumptionReviewCard
        label="Baseline throughput"
        value={formatNumber(inputs.baseline_monthly_throughput)}
        note="Patients processed per month before intervention."
      />
      <AssumptionReviewCard
        label="Average wait duration"
        value={`${inputs.average_wait_duration_months.toFixed(1)} months`}
        note="Contextual wait duration proxy."
      />
      <AssumptionReviewCard
        label="Intervention reach"
        value={formatPercent(inputs.intervention_reach_rate)}
        note="Share of the list effectively reached."
      />
      <AssumptionReviewCard
        label="Target population multiplier"
        value={formatPercent(inputs.target_population_multiplier)}
        note="Relative size of the subgroup in scope."
      />
      <AssumptionReviewCard
        label="Target reach multiplier"
        value={`${inputs.target_reach_multiplier.toFixed(2)}x`}
        note="Relative reach inside the targeted subgroup."
      />
      <AssumptionReviewCard
        label="Target escalation risk multiplier"
        value={`${inputs.target_escalation_risk_multiplier.toFixed(2)}x`}
        note="Relative escalation risk in the subgroup."
      />
      <AssumptionReviewCard
        label="Demand reduction effect"
        value={formatPercent(inputs.demand_reduction_effect)}
        note="Reduction in inflow."
      />
      <AssumptionReviewCard
        label="Throughput increase effect"
        value={formatPercent(inputs.throughput_increase_effect)}
        note="Improvement in processing capacity."
      />
      <AssumptionReviewCard
        label="Escalation reduction effect"
        value={formatPercent(inputs.escalation_reduction_effect)}
        note="Reduction in deterioration while waiting."
      />
      <AssumptionReviewCard
        label="Intervention cost per patient"
        value={normaliseCurrencyDisplay(
          formatCurrency(inputs.intervention_cost_per_patient_reached),
        )}
        note="Main programme cost lever."
      />
      <AssumptionReviewCard
        label="Annual effect decay"
        value={formatPercent(inputs.effect_decay_rate)}
        note="How quickly intervention effect weakens."
      />
      <AssumptionReviewCard
        label="Annual participation drop-off"
        value={formatPercent(inputs.participation_dropoff_rate)}
        note="How quickly effective reach falls."
      />
      <AssumptionReviewCard
        label="Monthly escalation rate"
        value={formatPercent(inputs.monthly_escalation_rate)}
        note="Baseline deterioration risk while waiting."
      />
      <AssumptionReviewCard
        label="Admission rate after escalation"
        value={formatPercent(inputs.admission_rate_after_escalation)}
        note="Escalations translating into admissions."
      />
      <AssumptionReviewCard
        label="Average length of stay"
        value={`${inputs.average_length_of_stay.toFixed(1)} days`}
        note="Used to derive bed days avoided."
      />
      <AssumptionReviewCard
        label="QALY gain per escalation avoided"
        value={inputs.qaly_gain_per_escalation_avoided.toFixed(2)}
        note="Health gain assumption."
      />
      <AssumptionReviewCard
        label="Cost per escalation"
        value={normaliseCurrencyDisplay(formatCurrency(inputs.cost_per_escalation))}
        note="Unit cost of escalation."
      />
      <AssumptionReviewCard
        label="Cost per admission"
        value={normaliseCurrencyDisplay(formatCurrency(inputs.cost_per_admission))}
        note="Unit cost of admission."
      />
      <AssumptionReviewCard
        label="Cost per bed day"
        value={normaliseCurrencyDisplay(formatCurrency(inputs.cost_per_bed_day))}
        note="Illustrative bed-day value."
      />
      <AssumptionReviewCard
        label="Costing method"
        value={inputs.costing_method}
        note="Economic framing used in the model."
      />
      <AssumptionReviewCard
        label="Time horizon"
        value={`${inputs.time_horizon_years} year${inputs.time_horizon_years === 1 ? "" : "s"}`}
        note="Duration of the scenario."
      />
      <AssumptionReviewCard
        label="Discount rate"
        value={formatPercent(inputs.discount_rate)}
        note="Present-value adjustment."
      />
      <AssumptionReviewCard
        label="Cost-effectiveness threshold"
        value={normaliseCurrencyDisplay(
          formatCurrency(inputs.cost_effectiveness_threshold),
        )}
        note="Threshold used to interpret cost per QALY."
      />
    </div>
  );

  const sensitivityTop3 = (
    <div className="grid gap-3 md:grid-cols-3">
      {sensitivity.top_drivers.slice(0, 3).map((driver, index) => (
        <AssumptionReviewCard
          key={`${String(driver.variable)}-${index}`}
          label={`Driver ${index + 1}`}
          value={driver.label}
          note={`Largest ICER swing: ${normaliseCurrencyDisplay(
            formatCurrency(driver.swing),
          )}`}
        />
      ))}
    </div>
  );

  const mobileCharts = (
    <div className="space-y-4 lg:hidden">
      <CostVsSavingsChart yearlyResults={results.yearly_results} />

      <MobileAccordion title="Backlog reduction">
        <BacklogReductionChart yearlyResults={results.yearly_results} />
      </MobileAccordion>

      <MobileAccordion title="Pathway impact">
        <PathwayImpactChart results={results} />
      </MobileAccordion>

      <MobileAccordion title="Bounded uncertainty">
        <BoundedUncertaintyChart
          uncertaintyRows={uncertainty}
          threshold={inputs.cost_effectiveness_threshold}
        />
      </MobileAccordion>

      <MobileAccordion title="One-way sensitivity">
        <SensitivityChart sensitivity={sensitivity} />
      </MobileAccordion>
    </div>
  );

  const desktopCharts = (
    <div className="space-y-4">
      <CostVsSavingsChart yearlyResults={results.yearly_results} />
      <BacklogReductionChart yearlyResults={results.yearly_results} />
      <PathwayImpactChart results={results} />
      <BoundedUncertaintyChart
        uncertaintyRows={uncertainty}
        threshold={inputs.cost_effectiveness_threshold}
      />
      <SensitivityChart sensitivity={sensitivity} />
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-5 lg:mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
          Health Economics Scenario Lab
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          WaitWise
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
          Explore how waiting list interventions might reduce backlog pressure,
          escalations, admissions, bed use, and economic burden under different
          assumptions.
        </p>
      </div>

      <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
        <p className="text-sm font-medium text-slate-900">Scope and use note</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          WaitWise is an exploratory scenario sandbox. It is designed to test
          how changes in targeting, demand, throughput, escalation risk,
          persistence, and delivery cost might influence potential operational
          and economic value. It does not replace formal evaluation,
          forecasting, or business case development.
        </p>
      </div>

      <div className="sticky top-[72px] z-20 mb-5 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur lg:hidden">
        <div className="grid grid-cols-3 items-start gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Signal
            </p>
            <p className="mt-1 text-sm font-semibold leading-5 text-slate-950">
              {decisionStatus}
            </p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-[11px] text-slate-500">{netCostLabel}</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {normaliseCurrencyDisplay(
                formatCurrency(Math.abs(results.discounted_net_cost_total)),
              )}
            </p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-[11px] text-slate-500">Cost/QALY</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {normaliseCurrencyDisplay(
                formatCurrency(results.discounted_cost_per_qaly),
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-5 lg:hidden">
        <button
          type="button"
          onClick={handleExportReport}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <FileDown className="h-4 w-4" />
          Export report
        </button>
      </div>

      <div className="sticky top-[72px] z-20 mb-5 hidden rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur lg:block">
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-start gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Signal
            </p>
            <p className="mt-1 text-sm font-semibold leading-5 text-slate-950">
              {decisionStatus}
            </p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-[11px] text-slate-500">{netCostLabel}</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {normaliseCurrencyDisplay(
                formatCurrency(Math.abs(results.discounted_net_cost_total)),
              )}
            </p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-[11px] text-slate-500">Cost/QALY</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {normaliseCurrencyDisplay(
                formatCurrency(results.discounted_cost_per_qaly),
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportReport}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <FileDown className="h-4 w-4" />
            Export report
          </button>
        </div>
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
        <MobileTabButton
          active={mobileTab === "summary"}
          onClick={() => setMobileTab("summary")}
          icon={<BarChart3 className="h-4 w-4" />}
        >
          Summary
        </MobileTabButton>
        <MobileTabButton
          active={mobileTab === "assumptions"}
          onClick={() => setMobileTab("assumptions")}
          icon={<SlidersHorizontal className="h-4 w-4" />}
        >
          Assumptions
        </MobileTabButton>
        <MobileTabButton
          active={mobileTab === "analysis"}
          onClick={() => setMobileTab("analysis")}
          icon={<FileSearch className="h-4 w-4" />}
        >
          Analysis
        </MobileTabButton>
      </div>

      <div className="mb-5 hidden gap-2 overflow-x-auto pb-1 lg:flex">
        <MobileTabButton
          active={mobileTab === "summary"}
          onClick={() => setMobileTab("summary")}
          icon={<BarChart3 className="h-4 w-4" />}
        >
          Summary
        </MobileTabButton>
        <MobileTabButton
          active={mobileTab === "assumptions"}
          onClick={() => setMobileTab("assumptions")}
          icon={<SlidersHorizontal className="h-4 w-4" />}
        >
          Assumptions
        </MobileTabButton>
        <MobileTabButton
          active={mobileTab === "analysis"}
          onClick={() => setMobileTab("analysis")}
          icon={<FileSearch className="h-4 w-4" />}
        >
          Analysis
        </MobileTabButton>
      </div>

      <div className="lg:hidden">
        <div className={cx(mobileTab !== "summary" && "hidden")}>
          <SectionCard
            title="Headline view"
            description="Start with the current decision signal and the main economic outputs."
            dense
          >
            {summaryMetrics}
            <div className="mt-3">{thresholdMetrics}</div>
            <div className="mt-4">{interpretationPanel}</div>
          </SectionCard>

          <div className="mt-4">
            <SectionCard
              title="Charts"
              description="Primary chart first, with supporting views below."
              dense
            >
              {mobileCharts}
            </SectionCard>
          </div>
        </div>

        <div className={cx(mobileTab !== "assumptions" && "hidden")}>
          <SectionCard
            title="Assumptions"
            description="Start from the default case, then adjust the key inputs and advanced settings."
            action={
              <button
                type="button"
                onClick={resetToBaseCase}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            }
            dense
          >
            <div className="space-y-4">
              <div className={SUBCARD}>
                <p className="mb-3 text-sm font-semibold text-slate-900">
                  Quick assumptions
                </p>
                {quickAssumptionNotice}
                <div className="mt-4">{assumptionsQuick}</div>
              </div>

              <div className={SUBCARD}>
                <button
                  type="button"
                  onClick={() => setShowAdvancedMobile((v) => !v)}
                  className="flex w-full items-center justify-between gap-4 text-left"
                  aria-expanded={showAdvancedMobile}
                >
                  <span className="text-sm font-medium text-slate-900">
                    Show advanced assumptions
                  </span>
                  <ChevronDown
                    className={cx(
                      "h-4 w-4 text-slate-500 transition-transform",
                      showAdvancedMobile && "rotate-180",
                    )}
                  />
                </button>

                {showAdvancedMobile ? (
                  <div className="mt-4">{advancedSections}</div>
                ) : null}
              </div>
            </div>
          </SectionCard>
        </div>

        <div className={cx(mobileTab !== "analysis" && "hidden")}>
          <SectionCard
            title="Analysis"
            description="Review the current case, uncertainty, sensitivity, and practical next checks."
            dense
          >
            <div className="space-y-5">
              <div className={SUBCARD}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className={SECTION_KICKER}>Report export</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      Export a structured summary of the current assumptions,
                      results, and interpretation.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportReport}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <FileDown className="h-4 w-4" />
                    Export report
                  </button>
                </div>
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Strategic summary</h3>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {overviewSummary}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <MetricCard label="Current case type" value={currentCaseType} />
                <MetricCard label="Return on spend" value={formatRatio(results.roi)} />
                <MetricCard label="Break-even horizon" value={results.break_even_horizon} />
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Recommendation summary</h3>
                <div className="mt-3">{recommendationPanel}</div>
              </div>

              <div>
                <h3 className={SECTION_KICKER}>Uncertainty readout</h3>
                <div className="mt-3 grid gap-3">
                  {uncertainty.map((row) => (
                    <AssumptionReviewCard
                      key={row.case}
                      label={row.case}
                      value={normaliseCurrencyDisplay(
                        formatCurrency(row.discounted_cost_per_qaly),
                      )}
                      note={`${formatNumber(row.waiting_list_reduction_total)} waiting list reduction · ${row.decision_status}`}
                    />
                  ))}
                </div>
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Top sensitivity drivers</h3>
                <div className="mt-3">{sensitivityTop3}</div>
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Confidence readout</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  This sandbox combines operational assumptions, illustrative
                  intervention effects, and user-defined targeting multipliers.
                  The most decision-relevant next step is to validate local
                  reach, subgroup concentration, escalation risk, and delivery
                  cost.
                </p>
              </div>

              <MobileAccordion title="Assumption review">
                {assumptionsReview}
              </MobileAccordion>
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="hidden lg:block">
        <div className={cx(mobileTab !== "summary" && "hidden")}>
          <SectionCard
            title="Headline view"
            description="Start with the current decision signal and the main economic outputs."
            dense
          >
            {summaryMetrics}
            <div className="mt-3">{thresholdMetrics}</div>
            <div className="mt-4">{interpretationPanel}</div>
          </SectionCard>

          <div className="mt-4">
            <SectionCard
              title="Charts"
              description="Primary chart first, with supporting views below."
              dense
            >
              {desktopCharts}
            </SectionCard>
          </div>
        </div>

        <div className={cx(mobileTab !== "assumptions" && "hidden")}>
          <SectionCard
            title="Assumptions"
            description="Start from the default case, then adjust the key inputs and advanced settings."
            action={
              <button
                type="button"
                onClick={resetToBaseCase}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            }
            dense
          >
            <div className="space-y-4">
              <div className={SUBCARD}>
                <p className="mb-3 text-sm font-semibold text-slate-900">
                  Quick assumptions
                </p>
                {quickAssumptionNotice}
                <div className="mt-4">{assumptionsQuick}</div>
              </div>

              <div className={SUBCARD}>
                <p className="mb-3 text-sm font-semibold text-slate-900">
                  Advanced assumptions
                </p>
                {advancedSections}
              </div>
            </div>
          </SectionCard>
        </div>

        <div className={cx(mobileTab !== "analysis" && "hidden")}>
          <SectionCard
            title="Analysis"
            description="Review the current case, uncertainty, sensitivity, and validation prompts."
            dense
          >
            <div className="space-y-5">
              <div className={SUBCARD}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className={SECTION_KICKER}>Report export</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      Export a structured summary of the current assumptions,
                      results, and interpretation.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportReport}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <FileDown className="h-4 w-4" />
                    Export report
                  </button>
                </div>
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Strategic summary</h3>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {overviewSummary}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <MetricCard label="Current case type" value={currentCaseType} />
                <MetricCard
                  label="Admissions avoided"
                  value={formatNumber(results.admissions_avoided_total)}
                />
                <MetricCard
                  label="Bed days avoided"
                  value={formatNumber(results.bed_days_avoided_total)}
                />
                <MetricCard label="Return on spend" value={formatRatio(results.roi)} />
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Recommendation summary</h3>
                <div className="mt-3">{recommendationPanel}</div>
              </div>

              <div>
                <h3 className={SECTION_KICKER}>Uncertainty readout</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {uncertainty.map((row) => (
                    <AssumptionReviewCard
                      key={row.case}
                      label={row.case}
                      value={normaliseCurrencyDisplay(
                        formatCurrency(row.discounted_cost_per_qaly),
                      )}
                      note={`${formatNumber(row.waiting_list_reduction_total)} waiting list reduction · ${row.decision_status}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h3 className={SECTION_KICKER}>Sensitivity</h3>
                <div className="mt-3">
                  <SensitivityChart sensitivity={sensitivity} />
                </div>
                <div className="mt-3">{sensitivityTop3}</div>
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Decision readout</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <MiniInsight label="Current case type" value={currentCaseType} />
                  <MiniInsight
                    label="Uncertainty readout"
                    value={uncertaintyRobustness}
                  />
                  <MiniInsight
                    label="Interpretation summary"
                    value={interpretation.what_model_suggests}
                  />
                  <MiniInsight
                    label="Confidence readout"
                    value="Treat the result as exploratory until local subgroup concentration, reach, escalation risk, and delivery cost are validated."
                  />
                </div>
              </div>

              <div>
                <h3 className={SECTION_KICKER}>Assumption review</h3>
                <div className="mt-3">{assumptionsReview}</div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}