"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  RotateCcw,
  ChevronDown,
  SlidersHorizontal,
  BarChart3,
  FileSearch,
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

import { DEFAULT_INPUTS } from "@/lib/clearpath/defaults";
import {
  buildComparatorCase,
  runBoundedUncertainty,
  runModel,
} from "@/lib/clearpath/calculations";
import {
  buildCasesShiftedChartData,
  buildComparatorDeltaChartData,
  buildCumulativeCostChartData,
  buildImpactBarChartData,
  buildScenarioNetCostChartData,
  buildScenarioOutcomeChartData,
  buildUncertaintyChartData,
  compactCurrencyAxis,
} from "@/lib/clearpath/charts";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRatio,
} from "@/lib/clearpath/formatters";
import {
  ASSUMPTION_META,
  ASSUMPTION_ORDER,
  getAssumptionConfidenceSummary,
} from "@/lib/clearpath/metadata";
import {
  COMPARATOR_OPTIONS,
  COSTING_METHOD_OPTIONS,
  SCENARIO_MAP,
  TARGETING_MODE_OPTIONS,
} from "@/lib/clearpath/scenarios";
import {
  buildSensitivityTakeaways,
  runOneWaySensitivity,
  SENSITIVITY_VARIABLES,
} from "@/lib/clearpath/sensitivity";
import {
  assessUncertaintyRobustness,
  generateInterpretation,
  generateOverviewSummary,
  generateOverallSignal,
  generateStructuredRecommendation,
  getDecisionStatus,
  getMainDriverText,
  getNetCostLabel,
  summariseScenarioStrengths,
} from "@/lib/clearpath/summaries";
import type {
  AssumptionSectionKey,
  ComparatorOption,
  Inputs,
  MobileTab,
  ModelResults,
  ScenarioComparisonRow,
  SensitivityRow,
  UncertaintyRow,
  YearlyResultRow,
} from "@/lib/clearpath/types";

type PresetOption =
  | "Base case"
  | "Conservative case"
  | "Optimistic case"
  | "High late-diagnosis burden"
  | "High-reach case-finding"
  | "Emergency-pressure reduction focus";

type PresetDefinition = {
  description: string;
  apply: (defaults: Inputs) => Partial<Inputs>;
};

const PRESET_OPTIONS: readonly PresetOption[] = [
  "Base case",
  "Conservative case",
  "Optimistic case",
  "High late-diagnosis burden",
  "High-reach case-finding",
  "Emergency-pressure reduction focus",
];

const CLEARPATH_PRESETS: Record<PresetOption, PresetDefinition> = {
  "Base case": {
    description: "Restores the standard earlier-diagnosis starting point.",
    apply: () => ({}),
  },
  "Conservative case": {
    description:
      "Lower reach and smaller diagnosis shift with slightly higher delivery friction.",
    apply: () => ({
      intervention_reach_rate: 0.5,
      achievable_reduction_in_late_diagnosis: 0.08,
      intervention_cost_per_case_reached:
        DEFAULT_INPUTS.intervention_cost_per_case_reached * 1.15,
      effect_decay_rate: 0.12,
      participation_dropoff_rate: 0.1,
    }),
  },
  "Optimistic case": {
    description:
      "Higher reach and stronger pathway shift with more persistent performance.",
    apply: () => ({
      intervention_reach_rate: 0.78,
      achievable_reduction_in_late_diagnosis: 0.18,
      intervention_cost_per_case_reached:
        DEFAULT_INPUTS.intervention_cost_per_case_reached * 0.92,
      effect_decay_rate: 0.05,
      participation_dropoff_rate: 0.04,
    }),
  },
  "High late-diagnosis burden": {
    description:
      "Represents a service where later diagnosis is common and the opportunity is concentrated.",
    apply: () => ({
      targeting_mode: DEFAULT_INPUTS.targeting_mode,
      current_late_diagnosis_rate: 0.52,
      achievable_reduction_in_late_diagnosis: 0.14,
      late_emergency_presentation_rate: 0.42,
      early_emergency_presentation_rate: 0.16,
      intervention_reach_rate: 0.65,
    }),
  },
  "High-reach case-finding": {
    description:
      "Emphasises wider operational reach and stronger programme penetration.",
    apply: () => ({
      targeting_mode: DEFAULT_INPUTS.targeting_mode,
      intervention_reach_rate: 0.82,
      achievable_reduction_in_late_diagnosis: 0.13,
      participation_dropoff_rate: 0.04,
      effect_decay_rate: 0.05,
    }),
  },
  "Emergency-pressure reduction focus": {
    description:
      "Pushes value toward avoided emergency presentations and acute pressure.",
    apply: () => ({
      achievable_reduction_in_late_diagnosis: 0.13,
      late_emergency_presentation_rate: 0.45,
      early_emergency_presentation_rate: 0.14,
      admissions_per_emergency_presentation: 1.2,
      cost_per_emergency_admission:
        DEFAULT_INPUTS.cost_per_emergency_admission * 1.1,
      intervention_reach_rate: 0.68,
    }),
  },
};

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

function buildScenarioComparison(
  defaults: Inputs,
  baseInputs: Inputs,
): ScenarioComparisonRow[] {
  return Object.entries(SCENARIO_MAP).map(([scenarioName, scenarioFn]) => {
    const scenarioInputs: Inputs = {
      ...defaults,
      ...scenarioFn(defaults),
      time_horizon_years: baseInputs.time_horizon_years,
      discount_rate: baseInputs.discount_rate,
      effect_decay_rate: baseInputs.effect_decay_rate,
      participation_dropoff_rate: baseInputs.participation_dropoff_rate,
      costing_method: baseInputs.costing_method,
      cost_effectiveness_threshold: baseInputs.cost_effectiveness_threshold,
      cost_per_emergency_admission: baseInputs.cost_per_emergency_admission,
      cost_per_bed_day: baseInputs.cost_per_bed_day,
      treatment_cost_early: baseInputs.treatment_cost_early,
      treatment_cost_late: baseInputs.treatment_cost_late,
      qaly_gain_per_case_shifted: baseInputs.qaly_gain_per_case_shifted,
    };

    const scenarioResults = runModel(scenarioInputs);

    return {
      scenario: scenarioName,
      targeting: scenarioInputs.targeting_mode,
      cases_shifted_earlier: scenarioResults.cases_shifted_total,
      emergency_presentations_avoided:
        scenarioResults.emergency_presentations_avoided_total,
      programme_cost: scenarioResults.programme_cost_total,
      discounted_net_cost: scenarioResults.discounted_net_cost_total,
      discounted_cost_per_qaly: scenarioResults.discounted_cost_per_qaly,
      decision_status: getDecisionStatus(
        scenarioResults,
        scenarioInputs.cost_effectiveness_threshold,
      ),
    };
  });
}

function getCaseTypeLabel(
  preset: PresetOption,
  inputs: Inputs,
  mainDriver: string,
): string {
  if (preset === "Conservative case") return "Conservative delivery case";
  if (preset === "Optimistic case") return "Optimistic earlier-diagnosis case";
  if (preset === "High late-diagnosis burden") {
    return "High late-diagnosis burden case";
  }
  if (preset === "High-reach case-finding") {
    return "High-reach case-finding case";
  }
  if (preset === "Emergency-pressure reduction focus") {
    return "Emergency-pressure reduction case";
  }

  if (inputs.current_late_diagnosis_rate >= 0.45) {
    return "High late-diagnosis burden case";
  }
  if (inputs.intervention_reach_rate >= 0.75) {
    return "High-reach case-finding case";
  }
  if (mainDriver.toLowerCase().includes("emergency")) {
    return "Emergency-pressure reduction case";
  }
  if (
    inputs.targeting_mode.toLowerCase().includes("risk") ||
    inputs.targeting_mode.toLowerCase().includes("target")
  ) {
    return "Targeted earlier-diagnosis case";
  }
  return "Broad earlier-diagnosis improvement case";
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

function CasesShiftedChart({
  yearlyResults,
}: {
  yearlyResults: YearlyResultRow[];
}) {
  const data = buildCasesShiftedChartData(yearlyResults);

  return (
    <div className={SUBCARD}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 lg:text-base">
          Cases shifted earlier
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 lg:text-sm">
          Annual shift from later to earlier diagnosis across the selected horizon.
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
              dataKey="casesShiftedEarlier"
              name="Cases shifted earlier"
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

function PathwayImpactChart({
  results,
}: {
  results: ModelResults;
}) {
  const rawData = buildImpactBarChartData(results);
  const data = rawData.map((row) => ({
    label: row.label,
    mobileLabel:
      row.label === "Emergency presentations avoided"
        ? "Emergency presentations"
        : row.label,
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

      <div className="h-52 w-full md:hidden">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 6, right: 18, left: 8, bottom: 6 }}
            barCategoryGap={14}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis
              type="number"
              tickFormatter={(value) => formatNumber(Number(value))}
              tickLine={false}
              axisLine={false}
              fontSize={11}
            />
            <YAxis
              type="category"
              dataKey="mobileLabel"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              width={118}
            />
            <Tooltip content={<NumberTooltip />} />
            <Bar dataKey="value" name="Impact" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="hidden h-64 w-full md:block xl:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
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
          Dark = at or below threshold
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
          Light = above threshold
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
          Dashed orange = threshold
        </span>
      </div>
    </div>
  );
}

function SensitivityChart({
  sensitivityRows,
}: {
  sensitivityRows: SensitivityRow[];
}) {
  const data = [...sensitivityRows]
    .sort((a, b) => a.swing - b.swing)
    .map((row) => ({
      label: row.label,
      lowDelta: row.low_delta,
      highDelta: row.high_delta,
    }));

  return (
    <div className={SUBCARD}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 lg:text-base">
          One-way sensitivity
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 lg:text-sm">
          Which assumptions move discounted cost per QALY the most.
        </p>
      </div>

      <div className="h-[440px] w-full xl:h-[520px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 18, left: 30, bottom: 0 }}
            barCategoryGap={8}
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
              width={180}
            />
            <Tooltip content={<CurrencyTooltip />} />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Bar dataKey="lowDelta" name="Low case" radius={[0, 8, 8, 0]} />
            <Bar dataKey="highDelta" name="High case" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ScenarioNetCostChart({
  scenarioRows,
}: {
  scenarioRows: ScenarioComparisonRow[];
}) {
  const data = buildScenarioNetCostChartData(scenarioRows);

  return (
    <div className={SUBCARD}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 lg:text-base">
          Scenario net cost
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 lg:text-sm">
          Discounted net cost across the preset scenario configurations.
        </p>
      </div>

      <div className="h-56 w-full lg:h-64 xl:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="scenario" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis
              tickFormatter={(value) => compactCurrencyAxis(Number(value))}
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={58}
            />
            <Tooltip content={<CurrencyTooltip />} />
            <Bar
              dataKey="discountedNetCost"
              name="Discounted net cost"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ScenarioOutcomeChart({
  scenarioRows,
}: {
  scenarioRows: ScenarioComparisonRow[];
}) {
  const data = buildScenarioOutcomeChartData(scenarioRows);

  return (
    <div className={SUBCARD}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 lg:text-base">
          Scenario pathway impact
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 lg:text-sm">
          Cases shifted earlier and emergency presentations avoided by scenario.
        </p>
      </div>

      <div className="h-64 w-full xl:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="scenario" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis
              tickFormatter={(value) => formatNumber(Number(value))}
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={54}
            />
            <Tooltip content={<NumberTooltip />} />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
            <Bar
              dataKey="casesShiftedEarlier"
              name="Cases shifted earlier"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="emergencyPresentationsAvoided"
              name="Emergency presentations avoided"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ComparatorDeltaChart({
  baseResults,
  comparatorResults,
  comparatorLabel,
}: {
  baseResults: ModelResults;
  comparatorResults: ModelResults;
  comparatorLabel: string;
}) {
  const data = buildComparatorDeltaChartData(baseResults, comparatorResults);

  return (
    <div className={SUBCARD}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 lg:text-base">
          Comparator deltas
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 lg:text-sm">
          Change versus the current configuration using {comparatorLabel.toLowerCase()}.
        </p>
      </div>

      <div className="h-56 w-full lg:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis
              tickFormatter={(value) => compactCurrencyAxis(Number(value))}
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={58}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const row = data.find((d) => d.label === label);
                const value = Number(payload[0]?.value ?? 0);

                return (
                  <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <p className="text-sm font-medium text-slate-900">{label}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      <span className="font-medium text-slate-800">Delta:</span>{" "}
                      {row?.isCurrency ? formatCurrency(value) : formatNumber(value)}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="delta" name="Delta" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function ClearPathApp() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS);
  const [mobileTab, setMobileTab] = useState<MobileTab>("summary");
  const [showAdvancedMobile, setShowAdvancedMobile] = useState(false);
  const [showComparatorDesktop, setShowComparatorDesktop] = useState(false);
  const [openSections, setOpenSections] = useState<
    Record<AssumptionSectionKey, boolean>
  >({
    "advanced-pathway": false,
    "advanced-costs": false,
    "advanced-outcomes": false,
  });
  const [comparatorMode, setComparatorMode] = useState<ComparatorOption>(
    COMPARATOR_OPTIONS[0],
  );
  const [presetMode, setPresetMode] = useState<PresetOption>("Base case");

  const results = useMemo(() => runModel(inputs), [inputs]);
  const uncertainty = useMemo(() => runBoundedUncertainty(inputs), [inputs]);

  const decisionStatus = useMemo(
    () => getDecisionStatus(results, inputs.cost_effectiveness_threshold),
    [results, inputs.cost_effectiveness_threshold],
  );

  const netCostLabel = useMemo(() => getNetCostLabel(results), [results]);
  const mainDriver = useMemo(() => getMainDriverText(inputs), [inputs]);

  const interpretation = useMemo(
    () => generateInterpretation(results, inputs, uncertainty),
    [results, inputs, uncertainty],
  );

  const overviewSummary = useMemo(
    () => generateOverviewSummary(results, inputs, uncertainty),
    [results, inputs, uncertainty],
  );

  const overallSignal = useMemo(
    () => generateOverallSignal(results, inputs, uncertainty),
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

  const sensitivityRows = useMemo(
    () =>
      runOneWaySensitivity(
        inputs,
        SENSITIVITY_VARIABLES,
        0.2,
        "discounted_cost_per_qaly",
      ),
    [inputs],
  );

  const sensitivityTakeaways = useMemo(
    () => buildSensitivityTakeaways(sensitivityRows),
    [sensitivityRows],
  );

  const scenarioRows = useMemo(
    () => buildScenarioComparison(DEFAULT_INPUTS, inputs),
    [inputs],
  );

  const scenarioStrengths = useMemo(
    () => summariseScenarioStrengths(scenarioRows),
    [scenarioRows],
  );

  const comparatorResults = useMemo(() => {
    const comparatorInputs = buildComparatorCase(
      DEFAULT_INPUTS,
      inputs,
      comparatorMode,
    );
    return runModel(comparatorInputs);
  }, [inputs, comparatorMode]);

  const comparatorDeltas = useMemo(
    () => buildComparatorDeltaChartData(results, comparatorResults),
    [results, comparatorResults],
  );

  const confidenceSummary = useMemo(() => getAssumptionConfidenceSummary(), []);

  const caseTypeLabel = useMemo(
    () => getCaseTypeLabel(presetMode, inputs, mainDriver),
    [presetMode, inputs, mainDriver],
  );

  const presetDescription = CLEARPATH_PRESETS[presetMode].description;

  const updateInput = <K extends keyof Inputs>(key: K, value: Inputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const applyPreset = (preset: PresetOption) => {
    setPresetMode(preset);
    const updates = CLEARPATH_PRESETS[preset].apply(DEFAULT_INPUTS);
    setInputs((prev) => ({ ...prev, ...updates }));
  };

  const resetToBaseCase = () => {
    setInputs({ ...DEFAULT_INPUTS });
    setPresetMode("Base case");
    setComparatorMode(COMPARATOR_OPTIONS[0]);
    setShowAdvancedMobile(false);
    setShowComparatorDesktop(false);
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
        label="Cases shifted earlier"
        value={formatNumber(results.cases_shifted_total)}
      />
      <MetricCard
        label="Emergency presentations avoided"
        value={formatNumber(results.emergency_presentations_avoided_total)}
      />
      <MetricCard
        label={netCostLabel}
        value={formatCurrency(Math.abs(results.discounted_net_cost_total))}
      />
      <MetricCard
        label="Discounted cost per QALY"
        value={formatCurrency(results.discounted_cost_per_qaly)}
        tone="strong"
      />
    </div>
  );

  const thresholdMetrics = (
    <div className="grid gap-3 xl:grid-cols-3">
      <MetricCard label="Return on spend" value={formatRatio(results.roi)} />
      <MetricCard
        label="Max intervention cost per case"
        value={formatCurrency(results.break_even_cost_per_case)}
      />
      <MetricCard
        label="Required late diagnosis reduction"
        value={formatPercent(results.break_even_reduction_in_late_diagnosis)}
      />
    </div>
  );

  const interpretationPanel = (
    <div className="grid gap-3 lg:grid-cols-4">
      <MiniInsight label="Overall signal" value={overallSignal} />
      <MiniInsight label="Current case type" value={caseTypeLabel} />
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
        label="What to validate next"
        value={structuredRecommendation.best_next_step}
      />
    </div>
  );

  const quickAssumptionNotice = (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-600">
      These are the main levers most likely to change the decision signal.
    </div>
  );

  const presetControl = (
    <div className={SUBCARD}>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,320px)_1fr] xl:items-end">
        <SelectInput
          label="Scenario preset"
          value={presetMode}
          options={PRESET_OPTIONS}
          onChange={(value) => applyPreset(value)}
          help="Applies a coherent scenario without removing your ability to edit assumptions manually."
        />
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Preset summary
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            <span className="font-medium text-slate-900">{presetMode}:</span>{" "}
            {presetDescription}
          </p>
        </div>
      </div>
    </div>
  );

  const assumptionsQuick = (
    <div className="grid gap-4 lg:gap-3 xl:grid-cols-2">
      <SelectInput
        label="Targeting mode"
        value={inputs.targeting_mode}
        options={TARGETING_MODE_OPTIONS}
        onChange={(value) => updateInput("targeting_mode", value)}
        help="Changes concentration of later diagnosis and achievable shift."
      />

      <NumberInput
        label="Annual incident cases"
        value={inputs.annual_incident_cases}
        onChange={(value) => updateInput("annual_incident_cases", value)}
        step={50}
        help="Baseline flow of cases entering the pathway."
      />

      <SliderInput
        label="Current late diagnosis rate"
        value={inputs.current_late_diagnosis_rate}
        onChange={(value) => updateInput("current_late_diagnosis_rate", value)}
        min={0}
        max={1}
        step={0.01}
        display={formatPercent(inputs.current_late_diagnosis_rate)}
        help="Share of cases currently diagnosed later."
      />

      <SliderInput
        label="Achievable reduction in late diagnosis"
        value={inputs.achievable_reduction_in_late_diagnosis}
        onChange={(value) =>
          updateInput("achievable_reduction_in_late_diagnosis", value)
        }
        min={0}
        max={0.5}
        step={0.01}
        display={formatPercent(inputs.achievable_reduction_in_late_diagnosis)}
        help="Absolute reduction achieved by the intervention."
      />

      <SliderInput
        label="Intervention reach"
        value={inputs.intervention_reach_rate}
        onChange={(value) => updateInput("intervention_reach_rate", value)}
        min={0}
        max={1}
        step={0.01}
        display={formatPercent(inputs.intervention_reach_rate)}
        help="Share of cases effectively reached."
      />

      <NumberInput
        label="Intervention cost per case"
        value={inputs.intervention_cost_per_case_reached}
        onChange={(value) =>
          updateInput("intervention_cost_per_case_reached", value)
        }
        step={25}
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
            Pathway assumptions
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
                label="Emergency presentation rate, later diagnosis"
                value={inputs.late_emergency_presentation_rate}
                onChange={(value) =>
                  updateInput("late_emergency_presentation_rate", value)
                }
                min={0}
                max={1}
                step={0.01}
                display={formatPercent(inputs.late_emergency_presentation_rate)}
              />
              <SliderInput
                label="Emergency presentation rate, earlier diagnosis"
                value={inputs.early_emergency_presentation_rate}
                onChange={(value) =>
                  updateInput("early_emergency_presentation_rate", value)
                }
                min={0}
                max={1}
                step={0.01}
                display={formatPercent(inputs.early_emergency_presentation_rate)}
              />
              <NumberInput
                label="Admissions per emergency presentation"
                value={inputs.admissions_per_emergency_presentation}
                onChange={(value) =>
                  updateInput("admissions_per_emergency_presentation", value)
                }
                step={0.1}
              />
              <NumberInput
                label="Average length of stay"
                value={inputs.average_length_of_stay}
                onChange={(value) => updateInput("average_length_of_stay", value)}
                step={0.5}
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
            Cost assumptions
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
                label="Treatment cost, earlier diagnosis"
                value={inputs.treatment_cost_early}
                onChange={(value) => updateInput("treatment_cost_early", value)}
                step={500}
              />
              <NumberInput
                label="Treatment cost, later diagnosis"
                value={inputs.treatment_cost_late}
                onChange={(value) => updateInput("treatment_cost_late", value)}
                step={500}
              />
              <NumberInput
                label="Cost per emergency admission"
                value={inputs.cost_per_emergency_admission}
                onChange={(value) =>
                  updateInput("cost_per_emergency_admission", value)
                }
                step={100}
              />
              <NumberInput
                label="Cost per bed day"
                value={inputs.cost_per_bed_day}
                onChange={(value) => updateInput("cost_per_bed_day", value)}
                step={25}
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
            Outcome and persistence assumptions
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
              <NumberInput
                label="QALY gain per case shifted earlier"
                value={inputs.qaly_gain_per_case_shifted}
                onChange={(value) =>
                  updateInput("qaly_gain_per_case_shifted", value)
                }
                step={0.01}
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
      {ASSUMPTION_ORDER.map((key) => {
        const meta = ASSUMPTION_META[key];
        const rawValue = inputs[key];
        return (
          <AssumptionReviewCard
            key={key}
            label={meta.label}
            value={meta.formatter(rawValue as never)}
            note={`${meta.source_type} · ${meta.confidence}`}
          />
        );
      })}
    </div>
  );

  const mobileCharts = (
    <div className="space-y-4 lg:hidden">
      <CasesShiftedChart yearlyResults={results.yearly_results} />

      <MobileAccordion title="Cost vs savings">
        <CostVsSavingsChart yearlyResults={results.yearly_results} />
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
    </div>
  );

  const desktopCharts = (
    <div className="space-y-4">
      <CasesShiftedChart yearlyResults={results.yearly_results} />
      <CostVsSavingsChart yearlyResults={results.yearly_results} />
      <PathwayImpactChart results={results} />
      <BoundedUncertaintyChart
        uncertaintyRows={uncertainty}
        threshold={inputs.cost_effectiveness_threshold}
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-5 lg:mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
          Health Economics Scenario Lab
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          ClearPath
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
          Explore how earlier diagnosis might reduce emergency pathway pressure,
          admissions, bed use, and economic burden under different assumptions.
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
              {formatCurrency(Math.abs(results.discounted_net_cost_total))}
            </p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-[11px] text-slate-500">Cost/QALY</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {formatCurrency(results.discounted_cost_per_qaly)}
            </p>
          </div>
        </div>
      </div>

      <div className="sticky top-[72px] z-20 mb-5 hidden rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur lg:block">
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
              {formatCurrency(Math.abs(results.discounted_net_cost_total))}
            </p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-[11px] text-slate-500">Cost/QALY</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {formatCurrency(results.discounted_cost_per_qaly)}
            </p>
          </div>
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
            description="Preset first, then core assumptions and advanced settings."
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
              {presetControl}

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
                <h3 className={SECTION_KICKER}>Strategic summary</h3>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {overviewSummary}
                </p>
              </div>

              {recommendationPanel}

              <div className="grid grid-cols-1 gap-3">
                <MetricCard label="Current case type" value={caseTypeLabel} />
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
                <h3 className={SECTION_KICKER}>Threshold readout</h3>
                <div className="mt-3 grid gap-3">
                  <AssumptionReviewCard
                    label="Max intervention cost per case"
                    value={formatCurrency(results.break_even_cost_per_case)}
                  />
                  <AssumptionReviewCard
                    label="Required late diagnosis reduction"
                    value={formatPercent(
                      results.break_even_reduction_in_late_diagnosis,
                    )}
                  />
                  <AssumptionReviewCard
                    label="Break-even horizon"
                    value={results.break_even_horizon}
                  />
                </div>
              </div>

              <div>
                <h3 className={SECTION_KICKER}>Uncertainty readout</h3>
                <div className="mt-3 grid gap-3">
                  {uncertainty.map((row) => (
                    <AssumptionReviewCard
                      key={row.case}
                      label={row.case}
                      value={formatCurrency(row.discounted_cost_per_qaly)}
                      note={`${formatNumber(row.cases_shifted_total)} cases shifted earlier · ${row.decision_status}`}
                    />
                  ))}
                </div>
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Sensitivity takeaways</h3>
                <div className="mt-3 space-y-2.5 text-sm leading-6 text-slate-700">
                  {sensitivityTakeaways.map((takeaway) => (
                    <p key={takeaway}>{takeaway}</p>
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
            description="Preset first, then core assumptions and advanced settings."
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
              {presetControl}

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
            description="Review the current case, uncertainty, sensitivity, scenarios, comparator view, and validation prompts."
            dense
          >
            <div className="space-y-5">
              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Strategic summary</h3>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {overviewSummary}
                </p>
              </div>

              {recommendationPanel}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <MetricCard label="Current case type" value={caseTypeLabel} />
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
                <h3 className={SECTION_KICKER}>Threshold readout</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <AssumptionReviewCard
                    label="Max intervention cost per case"
                    value={formatCurrency(results.break_even_cost_per_case)}
                  />
                  <AssumptionReviewCard
                    label="Required late diagnosis reduction"
                    value={formatPercent(
                      results.break_even_reduction_in_late_diagnosis,
                    )}
                  />
                  <AssumptionReviewCard
                    label="Break-even horizon"
                    value={results.break_even_horizon}
                  />
                </div>
              </div>

              <div>
                <h3 className={SECTION_KICKER}>Uncertainty readout</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {uncertainty.map((row) => (
                    <AssumptionReviewCard
                      key={row.case}
                      label={row.case}
                      value={formatCurrency(row.discounted_cost_per_qaly)}
                      note={`${formatNumber(row.cases_shifted_total)} cases shifted earlier · ${row.decision_status}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h3 className={SECTION_KICKER}>Sensitivity</h3>
                <div className="mt-3">
                  <SensitivityChart sensitivityRows={sensitivityRows} />
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {sensitivityTakeaways.map((takeaway) => (
                    <MiniInsight key={takeaway} label="Takeaway" value={takeaway} />
                  ))}
                </div>
              </div>

              <div>
                <h3 className={SECTION_KICKER}>Scenario comparison</h3>
                <div className="mt-3 grid gap-4 xl:grid-cols-2">
                  <ScenarioNetCostChart scenarioRows={scenarioRows} />
                  <ScenarioOutcomeChart scenarioRows={scenarioRows} />
                </div>
                <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm leading-6 text-slate-700">
                    {scenarioStrengths}
                  </p>
                </div>
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Comparator</h3>
                <div className="mt-4">
                  <SelectInput
                    label="Compare current selection with"
                    value={comparatorMode}
                    options={COMPARATOR_OPTIONS}
                    onChange={(value) => setComparatorMode(value)}
                  />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {comparatorDeltas.slice(0, 3).map((row) => (
                    <MetricCard
                      key={row.label}
                      label={`${row.label} delta`}
                      value={
                        row.isCurrency
                          ? formatCurrency(row.delta)
                          : formatNumber(row.delta)
                      }
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setShowComparatorDesktop((v) => !v)}
                  className="mt-4 flex w-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left"
                  aria-expanded={showComparatorDesktop}
                >
                  <span className="text-sm font-medium text-slate-900">
                    Show comparator chart
                  </span>
                  <ChevronDown
                    className={cx(
                      "h-4 w-4 text-slate-500 transition-transform",
                      showComparatorDesktop && "rotate-180",
                    )}
                  />
                </button>

                {showComparatorDesktop ? (
                  <div className="mt-4">
                    <ComparatorDeltaChart
                      baseResults={results}
                      comparatorResults={comparatorResults}
                      comparatorLabel={comparatorMode}
                    />
                  </div>
                ) : null}
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