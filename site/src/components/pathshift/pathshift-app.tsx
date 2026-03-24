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

import { DEFAULT_INPUTS } from "@/lib/pathshift/defaults";
import { clampRate, runBoundedUncertainty, runModel } from "@/lib/pathshift/calculations";
import {
  buildCumulativeCostChartData,
  buildImpactBarChartData,
  buildPathwayShiftChartData,
  buildTornadoChartData,
  buildUncertaintyChartData,
  compactCurrencyAxis,
} from "@/lib/pathshift/charts";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRatio,
} from "@/lib/pathshift/formatters";
import {
  ASSUMPTION_META,
  ASSUMPTION_ORDER,
  getAssumptionConfidenceSummary,
} from "@/lib/pathshift/metadata";
import {
  COSTING_METHOD_OPTIONS,
  TARGETING_MODE_OPTIONS,
} from "@/lib/pathshift/scenarios";
import {
  assessUncertaintyRobustness,
  generateInterpretation,
  generateOverviewSummary,
  generateStructuredRecommendation,
  getDecisionStatus,
  getNetCostLabel,
} from "@/lib/pathshift/summaries";
import type {
  AssumptionSectionKey,
  CostingMethod,
  Inputs,
  MobileTab,
  ModelResults,
  ParameterSensitivityRow,
  SensitivitySummary,
  TargetingMode,
  UncertaintyRow,
  YearlyResultRow,
} from "@/lib/pathshift/types";

const SENSITIVITY_VARIABLES: Array<keyof Inputs> = [
  "proportion_shifted_to_lower_cost_setting",
  "reduction_in_admission_rate",
  "reduction_in_follow_up_contacts",
  "reduction_in_length_of_stay",
  "redesign_cost_per_patient",
  "implementation_reach_rate",
  "current_admission_rate",
  "qaly_gain_per_patient_improved",
  "effect_decay_rate",
  "participation_dropoff_rate",
  "cost_per_admission",
  "cost_per_follow_up_contact",
  "cost_per_bed_day",
];

const RATE_VARIABLES = new Set<keyof Inputs>([
  "current_acute_managed_rate",
  "current_admission_rate",
  "proportion_shifted_to_lower_cost_setting",
  "reduction_in_admission_rate",
  "reduction_in_follow_up_contacts",
  "reduction_in_length_of_stay",
  "implementation_reach_rate",
  "effect_decay_rate",
  "participation_dropoff_rate",
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

function formatAssumptionValue(
  formatter: (value: string | number) => string,
  value: string | number,
) {
  return normaliseCurrencyDisplay(formatter(value));
}

function deriveCaseType(inputs: Inputs): string {
  if (inputs.proportion_shifted_to_lower_cost_setting >= 0.35) {
    return "Lower-cost setting shift case";
  }

  if (inputs.reduction_in_follow_up_contacts >= 0.3) {
    return "Follow-up reduction case";
  }

  if (inputs.reduction_in_admission_rate >= 0.16) {
    return "Admission reduction case";
  }

  if (inputs.targeting_mode === "High-utiliser targeting") {
    return "High-utiliser targeting case";
  }

  if (inputs.targeting_mode === "Higher-risk targeting") {
    return "Higher-risk targeting case";
  }

  return "Broad pathway redesign case";
}

function runOneWaySensitivity(
  baseInputs: Inputs,
  variables: Array<keyof Inputs>,
  variation = 0.2,
) {
  const baseResults = runModel(baseInputs);
  const baseOutcome = Number(baseResults.discounted_cost_per_qaly);

  return variables
    .map((variable) => {
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

      return {
        variable,
        label: ASSUMPTION_META[variable].label,
        base_input: baseInput,
        low_input: lowInput,
        high_input: highInput,
        base_outcome: baseOutcome,
        low_outcome: lowOutcome,
        high_outcome: highOutcome,
        low_delta: lowOutcome - baseOutcome,
        high_delta: highOutcome - baseOutcome,
        swing: Math.abs(highOutcome - lowOutcome),
      };
    })
    .sort((a, b) => b.swing - a.swing);
}

function buildSensitivitySummary(inputs: Inputs): SensitivitySummary {
  const rawRows = runOneWaySensitivity(inputs, SENSITIVITY_VARIABLES);

  const rows: ParameterSensitivityRow[] = rawRows.map((row) => ({
    parameter_key: row.variable,
    parameter_label: row.label,
    base_value: row.base_input,
    low_value: row.low_input,
    high_value: row.high_input,
    low_value_label: formatAssumptionValue(
      ASSUMPTION_META[row.variable].formatter,
      row.low_input,
    ),
    high_value_label: formatAssumptionValue(
      ASSUMPTION_META[row.variable].formatter,
      row.high_input,
    ),
    base_icer: row.base_outcome,
    low_icer: row.low_outcome,
    high_icer: row.high_outcome,
    low_delta: row.low_delta,
    high_delta: row.high_delta,
    max_abs_icer_change: Math.max(
      Math.abs(row.low_delta),
      Math.abs(row.high_delta),
    ),
  }));

  return {
    rows,
    primary_driver: rows[0] ?? null,
    top_drivers: rows.slice(0, 3),
  };
}

function buildSensitivityTakeaways(rows: ParameterSensitivityRow[]): string[] {
  if (!rows.length) {
    return [
      "One-way sensitivity has not highlighted a clear set of dominant drivers yet.",
      "At this stage, the case should still be treated as dependent on the core assumptions around redesign effect, reach, and delivery cost.",
      "Further validation should focus on the most decision-relevant operational and cost inputs locally.",
    ];
  }

  const first = rows[0]?.parameter_label.toLowerCase();
  const second = rows[1]?.parameter_label.toLowerCase();
  const third = rows[2]?.parameter_label.toLowerCase();

  const line1 = second
    ? `The result is most sensitive to ${first} and ${second}.`
    : `The result is most sensitive to ${first}.`;

  const line2 = third
    ? `In practical terms, the case is strongest when ${first}, ${second}, and ${third} remain favourable under locally credible assumptions.`
    : `In practical terms, the case is strongest when ${first} remains favourable under locally credible assumptions.`;

  const line3 =
    "The case weakens fastest when pathway shift is smaller than expected, redesign costs are higher, or downstream admission and follow-up benefits are less pronounced locally.";

  return [line1, line2, line3];
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
        {normaliseCurrencyDisplay(value)}
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
      <p className="mt-1.5 text-sm font-semibold text-slate-900">
        {normaliseCurrencyDisplay(value)}
      </p>
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

function PathwayShiftChart({
  yearlyResults,
}: {
  yearlyResults: YearlyResultRow[];
}) {
  const data = buildPathwayShiftChartData(yearlyResults);

  return (
    <div className={SUBCARD}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 lg:text-base">
          Patients shifted in pathway
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 lg:text-sm">
          Annual pathway shift across the selected horizon.
        </p>
      </div>

      <div className="h-52 w-full lg:h-64 xl:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
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
              dataKey="patientsShiftedInPathway"
              name="Patients shifted"
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
          Cumulative delivery cost compared with gross savings.
        </p>
      </div>

      <div className="h-52 w-full lg:h-64 xl:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
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
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="grossSavings"
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

function ImpactChart({
  results,
}: {
  results: ModelResults;
}) {
  const data = buildImpactBarChartData(results);

  return (
    <div className={SUBCARD}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 lg:text-base">
          Pathway impact
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 lg:text-sm">
          Headline operational impact over the selected horizon.
        </p>
      </div>

      <div className="h-52 w-full overflow-x-auto lg:h-64 xl:h-72">
        <div className="h-full min-w-[460px] sm:min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 16 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                fontSize={12}
                interval={0}
              />
              <YAxis
                tickFormatter={(value) => formatNumber(Number(value))}
                tickLine={false}
                axisLine={false}
                fontSize={12}
                width={54}
              />
              <Tooltip content={<NumberTooltip />} />
              <Bar dataKey="value" name="Impact" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
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
          <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
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
  const data = buildTornadoChartData(
    sensitivity.rows.map((row) => ({
      variable: row.parameter_key,
      label: row.parameter_label,
      base_input: row.base_value,
      low_input: row.low_value,
      high_input: row.high_value,
      base_outcome: row.base_icer,
      low_outcome: row.low_icer,
      high_outcome: row.high_icer,
      low_delta: row.low_delta,
      high_delta: row.high_delta,
      swing: row.max_abs_icer_change,
    })),
  );

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
              width={190}
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
              formatter={(value) => (value === "lowDelta" ? "Low case" : "High case")}
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

export default function PathShiftApp() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS);
  const [mobileTab, setMobileTab] = useState<MobileTab>("summary");
  const [showAdvancedMobile, setShowAdvancedMobile] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [openSections, setOpenSections] = useState<
    Record<AssumptionSectionKey, boolean>
  >({
    "advanced-pathway": false,
    "advanced-costs": false,
    "advanced-outcomes": false,
  });

  const results = useMemo(() => runModel(inputs), [inputs]);
  const uncertainty = useMemo(() => runBoundedUncertainty(inputs), [inputs]);
  const sensitivity = useMemo(() => buildSensitivitySummary(inputs), [inputs]);

  const decisionStatus = useMemo(
    () => getDecisionStatus(results, inputs.cost_effectiveness_threshold),
    [results, inputs.cost_effectiveness_threshold],
  );

  const netCostLabel = useMemo(() => getNetCostLabel(results), [results]);
  const caseTypeLabel = useMemo(() => deriveCaseType(inputs), [inputs]);

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

  const sensitivityTakeaways = useMemo(
    () => buildSensitivityTakeaways(sensitivity.rows),
    [sensitivity],
  );

  const confidenceSummary = useMemo(() => getAssumptionConfidenceSummary(), []);

  const handleExportReport = async () => {
    try {
      setIsExporting(true);

      const response = await fetch("/api/export/pathshift", {
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
      const link = document.createElement("a");
      link.href = url;
      link.download = "pathshift-report.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Failed to export report.");
    } finally {
      setIsExporting(false);
    }
  };

  const updateInput = <K extends keyof Inputs>(key: K, value: Inputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const resetToBaseCase = () => {
    setInputs({ ...DEFAULT_INPUTS });
    setShowAdvancedMobile(false);
    setOpenSections({
      "advanced-pathway": false,
      "advanced-costs": false,
      "advanced-outcomes": false,
    });
  };

  const toggleSection = (key: AssumptionSectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const summaryMetrics = (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MetricCard
        label="Patients shifted"
        value={formatNumber(results.patients_shifted_total)}
      />
      <MetricCard
        label="Admissions avoided"
        value={formatNumber(results.admissions_avoided_total)}
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
        label="Break-even cost per patient"
        value={normaliseCurrencyDisplay(
          formatCurrency(results.break_even_cost_per_patient),
        )}
      />
      <MetricCard
        label="Required redesign effect"
        value={formatPercent(results.break_even_effect_required)}
      />
    </div>
  );

  const interpretationPanel = (
    <div className="grid gap-3 lg:grid-cols-4">
      <MiniInsight label="Current case type" value={caseTypeLabel} />
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
      Start from the default case, then tune pathway shift, admission effect, follow-up effect, persistence, and redesign cost to fit the local use case.
    </div>
  );

  const assumptionsQuick = (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Core setup
        </p>
        <div className="mt-3 grid gap-4 lg:gap-3 xl:grid-cols-2">
          <SelectInput
            label="Targeting mode"
            value={inputs.targeting_mode}
            options={TARGETING_MODE_OPTIONS as readonly TargetingMode[]}
            onChange={(value) => updateInput("targeting_mode", value)}
            help="Changes where value is concentrated."
          />

          <NumberInput
            label="Annual cohort size"
            value={inputs.annual_cohort_size}
            onChange={(value) => updateInput("annual_cohort_size", value)}
            step={50}
            help="Baseline pathway scale."
          />

          <SliderInput
            label="Implementation reach"
            value={inputs.implementation_reach_rate}
            onChange={(value) => updateInput("implementation_reach_rate", value)}
            min={0}
            max={1}
            step={0.01}
            display={formatPercent(inputs.implementation_reach_rate)}
            help="Share of the pathway effectively reached."
          />

          <NumberInput
            label="Redesign cost per patient"
            value={inputs.redesign_cost_per_patient}
            onChange={(value) => updateInput("redesign_cost_per_patient", value)}
            step={10}
            help="Main implementation cost lever."
          />

          <SliderInput
            label="Shift to lower-cost setting"
            value={inputs.proportion_shifted_to_lower_cost_setting}
            onChange={(value) =>
              updateInput("proportion_shifted_to_lower_cost_setting", value)
            }
            min={0}
            max={0.8}
            step={0.01}
            display={formatPercent(inputs.proportion_shifted_to_lower_cost_setting)}
            help="Core pathway shift assumption."
          />

          <SliderInput
            label="Admission reduction"
            value={inputs.reduction_in_admission_rate}
            onChange={(value) => updateInput("reduction_in_admission_rate", value)}
            min={0}
            max={0.5}
            step={0.01}
            display={formatPercent(inputs.reduction_in_admission_rate)}
            help="Relative reduction in admissions."
          />

          <SliderInput
            label="Follow-up reduction"
            value={inputs.reduction_in_follow_up_contacts}
            onChange={(value) =>
              updateInput("reduction_in_follow_up_contacts", value)
            }
            min={0}
            max={0.7}
            step={0.01}
            display={formatPercent(inputs.reduction_in_follow_up_contacts)}
            help="Reduction in follow-up burden."
          />

          <SliderInput
            label="Length of stay reduction"
            value={inputs.reduction_in_length_of_stay}
            onChange={(value) => updateInput("reduction_in_length_of_stay", value)}
            min={0}
            max={0.5}
            step={0.01}
            display={formatPercent(inputs.reduction_in_length_of_stay)}
            help="Reduction in inpatient stay."
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
    </div>
  );

  const advancedSections = (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => toggleSection("advanced-pathway")}
          className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
          aria-expanded={openSections["advanced-pathway"]}
        >
          <span className="text-sm font-medium text-slate-900">
            Pathway baseline
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
                label="Current acute-managed rate"
                value={inputs.current_acute_managed_rate}
                onChange={(value) => updateInput("current_acute_managed_rate", value)}
                min={0}
                max={1}
                step={0.01}
                display={formatPercent(inputs.current_acute_managed_rate)}
                help="Baseline acute pathway share."
              />
              <SliderInput
                label="Current admission rate"
                value={inputs.current_admission_rate}
                onChange={(value) => updateInput("current_admission_rate", value)}
                min={0}
                max={1}
                step={0.01}
                display={formatPercent(inputs.current_admission_rate)}
                help="Baseline admission risk."
              />
              <NumberInput
                label="Current follow-up contacts per patient"
                value={inputs.current_follow_up_contacts_per_patient}
                onChange={(value) =>
                  updateInput("current_follow_up_contacts_per_patient", value)
                }
                step={0.1}
                help="Baseline follow-up intensity."
              />
              <NumberInput
                label="Current average length of stay"
                value={inputs.current_average_length_of_stay}
                onChange={(value) =>
                  updateInput("current_average_length_of_stay", value)
                }
                step={0.5}
                help="Baseline inpatient stay."
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => toggleSection("advanced-costs")}
          className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
          aria-expanded={openSections["advanced-costs"]}
        >
          <span className="text-sm font-medium text-slate-900">
            Cost inputs and threshold
          </span>
          <ChevronDown
            className={cx(
              "h-4 w-4 text-slate-500 transition-transform",
              openSections["advanced-costs"] && "rotate-180",
            )}
          />
        </button>

        {openSections["advanced-costs"] ? (
          <div className="border-t border-slate-200 p-4">
            <div className="grid gap-4 xl:grid-cols-2">
              <SelectInput
                label="Costing method"
                value={inputs.costing_method}
                options={COSTING_METHOD_OPTIONS as readonly CostingMethod[]}
                onChange={(value) => updateInput("costing_method", value)}
                help="Defines how redesign value is counted."
              />
              <NumberInput
                label="Cost-effectiveness threshold"
                value={inputs.cost_effectiveness_threshold}
                onChange={(value) =>
                  updateInput("cost_effectiveness_threshold", value)
                }
                step={1000}
                help="Used to interpret discounted cost per QALY."
              />
              <NumberInput
                label="Cost per acute-managed patient"
                value={inputs.cost_per_acute_managed_patient}
                onChange={(value) =>
                  updateInput("cost_per_acute_managed_patient", value)
                }
                step={50}
              />
              <NumberInput
                label="Cost per community-managed patient"
                value={inputs.cost_per_community_managed_patient}
                onChange={(value) =>
                  updateInput("cost_per_community_managed_patient", value)
                }
                step={50}
              />
              <NumberInput
                label="Cost per follow-up contact"
                value={inputs.cost_per_follow_up_contact}
                onChange={(value) =>
                  updateInput("cost_per_follow_up_contact", value)
                }
                step={10}
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

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => toggleSection("advanced-outcomes")}
          className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
          aria-expanded={openSections["advanced-outcomes"]}
        >
          <span className="text-sm font-medium text-slate-900">
            Persistence and outcomes
          </span>
          <ChevronDown
            className={cx(
              "h-4 w-4 text-slate-500 transition-transform",
              openSections["advanced-outcomes"] && "rotate-180",
            )}
          />
        </button>

        {openSections["advanced-outcomes"] ? (
          <div className="border-t border-slate-200 p-4">
            <div className="grid gap-4 xl:grid-cols-2">
              <SliderInput
                label="Annual effect decay"
                value={inputs.effect_decay_rate}
                onChange={(value) => updateInput("effect_decay_rate", value)}
                min={0}
                max={0.5}
                step={0.01}
                display={formatPercent(inputs.effect_decay_rate)}
                help="How quickly redesign effect weakens."
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
                help="How quickly effective reach falls."
              />
              <NumberInput
                label="QALY gain per patient improved"
                value={inputs.qaly_gain_per_patient_improved}
                onChange={(value) =>
                  updateInput("qaly_gain_per_patient_improved", value)
                }
                step={0.01}
                help="Health gain used in the economic case."
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  const assumptionsReview = (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {ASSUMPTION_ORDER.map((key) => {
        const meta = ASSUMPTION_META[key];
        const value = inputs[key as keyof Inputs] as string | number;
        return (
          <AssumptionReviewCard
            key={key}
            label={meta.label}
            value={formatAssumptionValue(meta.formatter, value)}
            note={`${meta.source_type} · ${meta.confidence}`}
          />
        );
      })}
    </div>
  );

  const sensitivityTop3 = (
    <div className="grid gap-3 md:grid-cols-3">
      {sensitivity.top_drivers.slice(0, 3).map((driver, index) => (
        <AssumptionReviewCard
          key={driver.parameter_key}
          label={`Driver ${index + 1}`}
          value={driver.parameter_label}
          note={`Largest ICER swing: ${normaliseCurrencyDisplay(
            formatCurrency(driver.max_abs_icer_change),
          )}`}
        />
      ))}
    </div>
  );

  const mobileCharts = (
    <div className="space-y-4 lg:hidden">
      <PathwayShiftChart yearlyResults={results.yearly_results} />

      <MobileAccordion title="Cost vs savings">
        <CostVsSavingsChart yearlyResults={results.yearly_results} />
      </MobileAccordion>

      <MobileAccordion title="Pathway impact">
        <ImpactChart results={results} />
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
      <PathwayShiftChart yearlyResults={results.yearly_results} />
      <CostVsSavingsChart yearlyResults={results.yearly_results} />
      <ImpactChart results={results} />
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
          PathShift
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
          Explore how pathway redesign might change activity, admissions,
          follow-up burden, bed use, and value under different assumptions
          about reach, service shift, effectiveness, and delivery cost.
        </p>
      </div>

      <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
        <p className="text-sm font-medium text-slate-900">Scope and use note</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          PathShift is an exploratory scenario sandbox. It is designed to test how
          pathway redesign, lower-cost setting shift, reduced admissions, and reduced
          follow-up burden might influence operational and economic value. It does not
          replace formal evaluation, forecasting, or business case development.
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
          disabled={isExporting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FileDown className="h-4 w-4" />
          {isExporting ? "Exporting..." : "Export report"}
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
            disabled={isExporting}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FileDown className="h-4 w-4" />
            {isExporting ? "Exporting..." : "Export report"}
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
                      Export a structured summary of the current assumptions, results, and interpretation.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportReport}
                    disabled={isExporting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FileDown className="h-4 w-4" />
                    {isExporting ? "Exporting..." : "Export report"}
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
                <MetricCard label="Current case type" value={caseTypeLabel} />
                <MetricCard
                  label="Return on spend"
                  value={formatRatio(results.roi)}
                />
                <MetricCard
                  label="Break-even horizon"
                  value={results.break_even_horizon}
                />
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
                      note={`${formatNumber(row.patients_shifted_total)} patients shifted · ${row.decision_status}`}
                    />
                  ))}
                </div>
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Top sensitivity drivers</h3>
                <div className="mt-3">{sensitivityTop3}</div>
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Sensitivity interpretation</h3>
                <div className="mt-3 grid gap-3">
                  {sensitivityTakeaways.map((item, index) => (
                    <MiniInsight
                      key={`${item}-${index}`}
                      label={`Takeaway ${index + 1}`}
                      value={item}
                    />
                  ))}
                </div>
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Confidence summary</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {confidenceSummary.summary_text}
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
                      Export a structured summary of the current assumptions, results, and interpretation.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportReport}
                    disabled={isExporting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FileDown className="h-4 w-4" />
                    {isExporting ? "Exporting..." : "Export report"}
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
                <MetricCard label="Current case type" value={caseTypeLabel} />
                <MetricCard
                  label="Follow-ups avoided"
                  value={formatNumber(results.follow_ups_avoided_total)}
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
                      note={`${formatNumber(row.patients_shifted_total)} patients shifted · ${row.decision_status}`}
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
                <h3 className={SECTION_KICKER}>Sensitivity interpretation</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {sensitivityTakeaways.map((item, index) => (
                    <MiniInsight
                      key={`${item}-${index}`}
                      label={`Takeaway ${index + 1}`}
                      value={item}
                    />
                  ))}
                </div>
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Decision readout</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <MiniInsight label="Current case type" value={caseTypeLabel} />
                  <MiniInsight
                    label="Uncertainty readout"
                    value={uncertaintyRobustness}
                  />
                  <MiniInsight
                    label="Interpretation summary"
                    value={interpretation.what_model_suggests}
                  />
                  <MiniInsight
                    label="Confidence summary"
                    value={confidenceSummary.summary_text}
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