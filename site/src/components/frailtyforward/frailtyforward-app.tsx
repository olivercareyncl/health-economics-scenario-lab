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

import { DEFAULT_INPUTS } from "@/lib/frailtyforward/defaults";
import {
  buildComparatorCase,
  runBoundedUncertainty,
  runModel,
} from "@/lib/frailtyforward/calculations";
import {
  buildCumulativeCostChartData,
  buildImpactBarChartData,
  buildStabilisedPatientsChartData,
  buildUncertaintyChartData,
  compactCurrencyAxis,
} from "@/lib/frailtyforward/charts";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRatio,
} from "@/lib/frailtyforward/formatters";
import {
  ASSUMPTION_META,
  ASSUMPTION_ORDER,
  getAssumptionConfidenceSummary,
} from "@/lib/frailtyforward/metadata";
import {
  COMPARATOR_OPTIONS,
  COSTING_METHOD_OPTIONS,
  TARGETING_MODE_OPTIONS,
} from "@/lib/frailtyforward/scenarios";
import {
  buildSensitivityTakeaways,
  runOneWaySensitivity,
  SENSITIVITY_VARIABLES,
  type SensitivityRow,
} from "@/lib/frailtyforward/sensitivity";
import {
  assessUncertaintyRobustness,
  generateInterpretation,
  generateDecisionReadiness,
  getDecisionStatus,
  getMainDriverText,
  getNetCostLabel,
} from "@/lib/frailtyforward/summaries";
import type {
  AssumptionSectionKey,
  ComparatorOption,
  CostingMethod,
  Inputs,
  MobileTab,
  ModelResults,
  TargetingMode,
  UncertaintyRow,
  YearlyResultRow,
} from "@/lib/frailtyforward/types";

const PANEL_SHELL =
  "rounded-[26px] border border-slate-200 bg-slate-50 p-4 sm:p-5 lg:p-5 xl:p-6";
const SUBCARD =
  "rounded-2xl border border-slate-200 bg-white p-4 lg:p-4 xl:p-5";
const SUBCARD_DENSE =
  "rounded-2xl border border-slate-200 bg-white p-3.5 lg:p-4";
const SECTION_KICKER =
  "text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500";

type PresetOption =
  | "Base case"
  | "Conservative case"
  | "Optimistic case"
  | "Crisis prevention focus"
  | "Lower-cost delivery"
  | "Higher-risk frailty cohort";

type PresetDefinition = {
  patch: Partial<Inputs>;
  comparatorMode?: ComparatorOption;
  description: string;
  caseType: string;
};

const PRESET_OPTIONS: readonly PresetOption[] = [
  "Base case",
  "Conservative case",
  "Optimistic case",
  "Crisis prevention focus",
  "Lower-cost delivery",
  "Higher-risk frailty cohort",
] as const;

const DEFAULT_COMPARATOR_MODE = "Crisis prevention focus" as ComparatorOption;

const PRESET_DEFINITIONS: Record<PresetOption, PresetDefinition> = {
  "Base case": {
    patch: {},
    comparatorMode: DEFAULT_COMPARATOR_MODE,
    description: "Restores the default central case.",
    caseType: "Broad frailty support case",
  },
  "Conservative case": {
    patch: {
      implementation_reach_rate: 0.32,
      support_cost_per_patient: 215,
      reduction_in_crisis_event_rate: 0.08,
      reduction_in_admission_rate: 0.06,
      reduction_in_length_of_stay: 0.04,
      effect_decay_rate: 0.14,
      participation_dropoff_rate: 0.12,
      qaly_gain_per_patient_stabilised: 0.025,
    },
    comparatorMode: DEFAULT_COMPARATOR_MODE,
    description: "Lower reach, lower effect, and less persistence.",
    caseType: "Conservative frailty support case",
  },
  "Optimistic case": {
    patch: {
      implementation_reach_rate: 0.58,
      support_cost_per_patient: 145,
      reduction_in_crisis_event_rate: 0.18,
      reduction_in_admission_rate: 0.14,
      reduction_in_length_of_stay: 0.12,
      effect_decay_rate: 0.04,
      participation_dropoff_rate: 0.04,
      qaly_gain_per_patient_stabilised: 0.05,
    },
    comparatorMode: DEFAULT_COMPARATOR_MODE,
    description: "Stronger reach, better persistence, and lower delivery cost.",
    caseType: "High-performing frailty support case",
  },
  "Crisis prevention focus": {
    patch: {
      baseline_crisis_event_rate: 0.42,
      reduction_in_crisis_event_rate: 0.2,
      reduction_in_admission_rate: 0.09,
      reduction_in_length_of_stay: 0.05,
      qaly_gain_per_patient_stabilised: 0.045,
    },
    comparatorMode: DEFAULT_COMPARATOR_MODE,
    description: "Shifts emphasis toward preventing deterioration and crisis.",
    caseType: "Crisis prevention case",
  },
  "Lower-cost delivery": {
    patch: {
      support_cost_per_patient: 120,
      implementation_reach_rate: 0.48,
      reduction_in_crisis_event_rate: 0.12,
      reduction_in_admission_rate: 0.1,
      reduction_in_length_of_stay: 0.08,
      effect_decay_rate: 0.07,
    },
    comparatorMode: DEFAULT_COMPARATOR_MODE,
    description: "Tests whether a leaner model improves value for money.",
    caseType: "Lower-cost delivery case",
  },
  "Higher-risk frailty cohort": {
    patch: {
      annual_frailty_cohort_size: 4200,
      baseline_crisis_event_rate: 0.46,
      baseline_non_elective_admission_rate: 0.34,
      current_average_length_of_stay: 8.5,
      implementation_reach_rate: 0.44,
      reduction_in_crisis_event_rate: 0.15,
      reduction_in_admission_rate: 0.12,
      qaly_gain_per_patient_stabilised: 0.05,
    },
    comparatorMode: DEFAULT_COMPARATOR_MODE,
    description: "Concentrates value in a smaller but higher-risk cohort.",
    caseType: "Higher-risk frailty cohort case",
  },
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatSignedCurrency(value: number) {
  const abs = formatCurrency(Math.abs(value));
  return value < 0 ? `-${abs}` : abs;
}

function getCaseType(
  inputs: Inputs,
  selectedPreset: PresetOption,
  mainDriver: string,
) {
  if (selectedPreset !== "Base case") {
    return PRESET_DEFINITIONS[selectedPreset].caseType;
  }

  if (
    inputs.support_cost_per_patient <=
    DEFAULT_INPUTS.support_cost_per_patient * 0.8
  ) {
    return "Lower-cost delivery case";
  }

  if (
    inputs.baseline_crisis_event_rate >=
      DEFAULT_INPUTS.baseline_crisis_event_rate * 1.15 ||
    inputs.baseline_non_elective_admission_rate >=
      DEFAULT_INPUTS.baseline_non_elective_admission_rate * 1.15
  ) {
    return "Higher-risk frailty cohort case";
  }

  if (
    inputs.reduction_in_crisis_event_rate >=
      inputs.reduction_in_admission_rate &&
    inputs.reduction_in_crisis_event_rate >= inputs.reduction_in_length_of_stay
  ) {
    return "Crisis prevention case";
  }

  if (mainDriver.includes("cost")) {
    return "Cost-sensitive frailty support case";
  }

  return "Broad frailty support case";
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

function StabilisedPatientsChart({
  yearlyResults,
}: {
  yearlyResults: YearlyResultRow[];
}) {
  const data = buildStabilisedPatientsChartData(yearlyResults);

  return (
    <div className={SUBCARD}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 lg:text-base">
          Patients stabilised
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 lg:text-sm">
          Annual stabilisation across the selected horizon.
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
              dataKey="patientsStabilised"
              name="Patients stabilised"
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
  const data = sensitivityRows
    .slice(0, 6)
    .map((row) => ({
      label: row.label,
      lowDelta: row.low_delta,
      highDelta: row.high_delta,
      baseOutcome: row.base_outcome,
      lowInput: row.low_input,
      highInput: row.high_input,
    }))
    .reverse();

  return (
    <div className={SUBCARD}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 lg:text-base">
          One-way sensitivity
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 lg:text-sm">
          Largest drivers of movement in discounted cost per QALY.
        </p>
      </div>

      <div className="h-[360px] w-full lg:h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 18, left: 8, bottom: 0 }}
            barCategoryGap={10}
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
            <Tooltip
              formatter={(value: number, name: string) => [
                formatSignedCurrency(value),
                name === "lowDelta" ? "Low case delta" : "High case delta",
              ]}
            />
            <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={1.5} />
            <Legend
              wrapperStyle={{ fontSize: "12px" }}
              formatter={(value) => (value === "lowDelta" ? "Low case" : "High case")}
            />
            <Bar dataKey="lowDelta" name="lowDelta" radius={[0, 6, 6, 0]} />
            <Bar dataKey="highDelta" name="highDelta" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
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

export default function FrailtyForwardApp() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS);
  const [mobileTab, setMobileTab] = useState<MobileTab>("summary");
  const [showAdvancedMobile, setShowAdvancedMobile] = useState(false);
  const [openSections, setOpenSections] = useState<
    Record<AssumptionSectionKey, boolean>
  >({
    "advanced-baseline": false,
    "advanced-costs": false,
    "advanced-outcomes": false,
  });
  const [comparatorMode, setComparatorMode] = useState<ComparatorOption>(
    DEFAULT_COMPARATOR_MODE,
  );
  const [selectedPreset, setSelectedPreset] = useState<PresetOption>("Base case");
  const [isExporting, setIsExporting] = useState(false);

  const results = useMemo(() => runModel(inputs), [inputs]);
  const uncertainty = useMemo(() => runBoundedUncertainty(inputs), [inputs]);
  const sensitivityRows = useMemo(
    () =>
      runOneWaySensitivity(
        inputs,
        [...SENSITIVITY_VARIABLES],
        0.2,
        "discounted_cost_per_qaly",
      ),
    [inputs],
  );
  const sensitivityTakeaways = useMemo(
    () => buildSensitivityTakeaways(sensitivityRows),
    [sensitivityRows],
  );

  const comparatorResults = useMemo(() => {
    const comparatorInputs = buildComparatorCase(
      DEFAULT_INPUTS,
      inputs,
      comparatorMode,
    );
    return runModel(comparatorInputs);
  }, [inputs, comparatorMode]);

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

  const currentCaseType = useMemo(
    () => getCaseType(inputs, selectedPreset, mainDriver),
    [inputs, selectedPreset, mainDriver],
  );

  const uncertaintyRobustness = useMemo(
    () =>
      assessUncertaintyRobustness(
        uncertainty,
        inputs.cost_effectiveness_threshold,
      ),
    [uncertainty, inputs.cost_effectiveness_threshold],
  );

  const decisionReadiness = useMemo(
    () => generateDecisionReadiness(inputs, results),
    [inputs, results],
  );

  const confidenceSummary = useMemo(() => getAssumptionConfidenceSummary(), []);

  const recommendationPanel = useMemo(() => {
    const presetDescription = PRESET_DEFINITIONS[selectedPreset].description;

    return {
      currentCaseType,
      whatModelSuggests: interpretation.what_model_suggests,
      whatDrivesResult: `The current result is mainly driven by ${mainDriver}.`,
      whatLooksFragile: interpretation.what_looks_fragile,
      whatToValidateNext: `${interpretation.what_to_validate_next} Current preset: ${selectedPreset}. ${presetDescription}`,
    };
  }, [currentCaseType, interpretation, mainDriver, selectedPreset]);

  const handleExportReport = async () => {
    try {
      setIsExporting(true);

      const response = await fetch("/api/export/frailtyforward", {
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
      link.download = "frailtyforward-report.pdf";
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

  const applyPreset = (preset: PresetOption) => {
    const definition = PRESET_DEFINITIONS[preset];
    setSelectedPreset(preset);
    setInputs((prev) => ({ ...prev, ...definition.patch }));
    if (definition.comparatorMode) {
      setComparatorMode(definition.comparatorMode);
    }
  };

  const resetToBaseCase = () => {
    setInputs({ ...DEFAULT_INPUTS });
    setComparatorMode(DEFAULT_COMPARATOR_MODE);
    setSelectedPreset("Base case");
    setShowAdvancedMobile(false);
    setOpenSections({
      "advanced-baseline": false,
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
        label="Patients stabilised"
        value={formatNumber(results.patients_stabilised_total)}
      />
      <MetricCard
        label="Crisis events avoided"
        value={formatNumber(results.crisis_events_avoided_total)}
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

  const interpretationPanel = (
    <div className="grid gap-3 lg:grid-cols-4">
      <MiniInsight label="Overall signal" value={decisionStatus} />
      <MiniInsight label="Current case type" value={recommendationPanel.currentCaseType} />
      <MiniInsight label="Main driver" value={recommendationPanel.whatDrivesResult} />
      <MiniInsight label="Fragility" value={recommendationPanel.whatLooksFragile} />
    </div>
  );

  const recommendationSummary = (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <MiniInsight
        label="What this suggests"
        value={recommendationPanel.whatModelSuggests}
      />
      <MiniInsight
        label="What is driving it"
        value={recommendationPanel.whatDrivesResult}
      />
      <MiniInsight
        label="What looks fragile"
        value={recommendationPanel.whatLooksFragile}
      />
      <MiniInsight
        label="Validate next"
        value={recommendationPanel.whatToValidateNext}
      />
    </div>
  );

  const quickAssumptionNotice = (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-600">
      These are the levers most likely to change the decision signal.
    </div>
  );

  const presetControl = (
    <div className={SUBCARD}>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-end">
        <SelectInput
          label="Scenario preset"
          value={selectedPreset}
          options={PRESET_OPTIONS}
          onChange={applyPreset}
          help="Applies a coherent scenario while keeping manual edits available."
        />
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Preset readout
          </p>
          <p className="mt-1.5 text-sm font-semibold text-slate-900">
            {selectedPreset}
          </p>
          <p className="mt-1.5 text-sm leading-6 text-slate-600">
            {PRESET_DEFINITIONS[selectedPreset].description}
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
        options={TARGETING_MODE_OPTIONS as readonly TargetingMode[]}
        onChange={(value) => updateInput("targeting_mode", value)}
        help="Changes where value is concentrated."
      />

      <NumberInput
        label="Annual frailty cohort size"
        value={inputs.annual_frailty_cohort_size}
        onChange={(value) => updateInput("annual_frailty_cohort_size", value)}
        step={50}
        help="Baseline cohort size."
      />

      <SliderInput
        label="Implementation reach"
        value={inputs.implementation_reach_rate}
        onChange={(value) => updateInput("implementation_reach_rate", value)}
        min={0}
        max={1}
        step={0.01}
        display={formatPercent(inputs.implementation_reach_rate)}
        help="Share of the cohort effectively reached."
      />

      <NumberInput
        label="Support cost per patient"
        value={inputs.support_cost_per_patient}
        onChange={(value) => updateInput("support_cost_per_patient", value)}
        step={10}
        help="Main delivery cost lever."
      />

      <SliderInput
        label="Crisis event reduction"
        value={inputs.reduction_in_crisis_event_rate}
        onChange={(value) => updateInput("reduction_in_crisis_event_rate", value)}
        min={0}
        max={0.5}
        step={0.01}
        display={formatPercent(inputs.reduction_in_crisis_event_rate)}
        help="Reduction in crisis or deterioration events."
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
          help="Longer horizons often improve the case."
        />
      </div>
    </div>
  );

  const advancedSections = (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => toggleSection("advanced-baseline")}
          className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
          aria-expanded={openSections["advanced-baseline"]}
        >
          <span className="text-sm font-medium text-slate-900">
            Baseline frailty risk
          </span>
          <ChevronDown
            className={cx(
              "h-4 w-4 text-slate-500 transition-transform",
              openSections["advanced-baseline"] && "rotate-180",
            )}
          />
        </button>

        {openSections["advanced-baseline"] ? (
          <div className="border-t border-slate-200 p-4">
            <div className="grid gap-4 xl:grid-cols-2">
              <SliderInput
                label="Baseline crisis event rate"
                value={inputs.baseline_crisis_event_rate}
                onChange={(value) => updateInput("baseline_crisis_event_rate", value)}
                min={0}
                max={1}
                step={0.01}
                display={formatPercent(inputs.baseline_crisis_event_rate)}
                help="Baseline crisis or deterioration risk."
              />
              <SliderInput
                label="Baseline non-elective admission rate"
                value={inputs.baseline_non_elective_admission_rate}
                onChange={(value) =>
                  updateInput("baseline_non_elective_admission_rate", value)
                }
                min={0}
                max={1}
                step={0.01}
                display={formatPercent(inputs.baseline_non_elective_admission_rate)}
                help="Baseline admission risk."
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
                help="Defines how support value is counted."
              />
              <NumberInput
                label="Threshold"
                value={inputs.cost_effectiveness_threshold}
                onChange={(value) =>
                  updateInput("cost_effectiveness_threshold", value)
                }
                step={1000}
                help="Used to interpret discounted cost per QALY."
              />
              <NumberInput
                label="Cost per crisis event"
                value={inputs.cost_per_crisis_event}
                onChange={(value) => updateInput("cost_per_crisis_event", value)}
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
                help="How quickly support effect weakens."
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
                label="QALY gain per patient stabilised"
                value={inputs.qaly_gain_per_patient_stabilised}
                onChange={(value) =>
                  updateInput("qaly_gain_per_patient_stabilised", value)
                }
                step={0.01}
                help="Health gain used in the economic case."
              />
              <SelectInput
                label="Comparator"
                value={comparatorMode}
                options={COMPARATOR_OPTIONS as readonly ComparatorOption[]}
                onChange={(value) => setComparatorMode(value)}
                help="Used for quick option comparison."
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
            value={meta.formatter(value)}
            note={`${meta.source_type} · ${meta.confidence}`}
          />
        );
      })}
    </div>
  );

  const sensitivityTopDrivers = (
    <div className="grid gap-3 md:grid-cols-3">
      {sensitivityRows.slice(0, 3).map((row, index) => (
        <AssumptionReviewCard
          key={row.variable}
          label={`Driver ${index + 1}`}
          value={row.label}
          note={`Largest ICER swing: ${formatCurrency(row.swing)}`}
        />
      ))}
    </div>
  );

  const mobileCharts = (
    <div className="space-y-4 lg:hidden">
      <StabilisedPatientsChart yearlyResults={results.yearly_results} />

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
        <SensitivityChart sensitivityRows={sensitivityRows} />
      </MobileAccordion>
    </div>
  );

  const desktopCharts = (
    <div className="space-y-4">
      <StabilisedPatientsChart yearlyResults={results.yearly_results} />
      <CostVsSavingsChart yearlyResults={results.yearly_results} />
      <ImpactChart results={results} />
      <BoundedUncertaintyChart
        uncertaintyRows={uncertainty}
        threshold={inputs.cost_effectiveness_threshold}
      />
      <SensitivityChart sensitivityRows={sensitivityRows} />
    </div>
  );

  const comparatorSummary = (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <AssumptionReviewCard
        label="Comparator"
        value={comparatorMode}
        note="Current selection versus comparator case."
      />
      <AssumptionReviewCard
        label="Patients stabilised delta"
        value={formatNumber(
          comparatorResults.patients_stabilised_total -
            results.patients_stabilised_total,
        )}
      />
      <AssumptionReviewCard
        label="Admissions avoided delta"
        value={formatNumber(
          comparatorResults.admissions_avoided_total -
            results.admissions_avoided_total,
        )}
      />
      <AssumptionReviewCard
        label="Discounted net cost delta"
        value={formatSignedCurrency(
          comparatorResults.discounted_net_cost_total -
            results.discounted_net_cost_total,
        )}
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
          FrailtyForward
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
          Explore how earlier frailty support might change crisis events,
          admissions, bed use, and value under different assumptions about
          reach, effectiveness, persistence, and delivery cost.
        </p>
      </div>

      <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:px-5">
        <p className="text-sm font-medium text-slate-900">Scope and use note</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          FrailtyForward is an exploratory scenario sandbox. It is designed to
          test how changes in frailty risk, support reach, crisis reduction,
          admission reduction, persistence, and delivery cost might influence
          pathway and economic value. It does not replace formal evaluation,
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
              {formatCurrency(Math.abs(results.discounted_net_cost_total))}
            </p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-[11px] text-slate-500">Cost/QALY</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {formatCurrency(results.discounted_cost_per_qaly)}
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
            description="Scenario preset first, then quick assumptions and advanced settings."
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
            description="Review the current case, sensitivity, uncertainty, and practical next checks."
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
                <h3 className={SECTION_KICKER}>Decision recommendation</h3>
                <div className="mt-3">{recommendationSummary}</div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <MetricCard
                  label="Admissions avoided"
                  value={formatNumber(results.admissions_avoided_total)}
                />
                <MetricCard
                  label="Bed days avoided"
                  value={formatNumber(results.bed_days_avoided_total)}
                />
                <MetricCard label="Return on spend" value={formatRatio(results.roi)} />
                <MetricCard label="Current case type" value={currentCaseType} />
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Threshold readout</h3>
                <div className="mt-3 grid gap-3">
                  <AssumptionReviewCard
                    label="Break-even cost per patient"
                    value={formatCurrency(results.break_even_cost_per_patient)}
                  />
                  <AssumptionReviewCard
                    label="Required support effect"
                    value={formatPercent(results.break_even_effect_required)}
                  />
                  <AssumptionReviewCard
                    label="Break-even horizon"
                    value={results.break_even_horizon}
                  />
                </div>
              </div>

              <div>
                <h3 className={SECTION_KICKER}>Uncertainty readout</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {uncertainty.map((row) => (
                    <AssumptionReviewCard
                      key={row.case}
                      label={row.case}
                      value={formatCurrency(row.discounted_cost_per_qaly)}
                      note={`${formatNumber(row.patients_stabilised_total)} patients stabilised · ${row.decision_status}`}
                    />
                  ))}
                </div>
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Top parameter drivers</h3>
                <div className="mt-3">{sensitivityTopDrivers}</div>
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Sensitivity interpretation</h3>
                <div className="mt-3 space-y-2.5 text-sm leading-6 text-slate-700">
                  {sensitivityTakeaways.map((takeaway) => (
                    <p key={takeaway}>{takeaway}</p>
                  ))}
                </div>
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Comparator snapshot</h3>
                <div className="mt-3">{comparatorSummary}</div>
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Decision readiness</h3>
                <div className="mt-3 space-y-2.5 text-sm leading-6 text-slate-700">
                  {decisionReadiness.validate_next.slice(0, 3).map((item) => (
                    <p key={item}>{item}</p>
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

            <div className="mt-3 grid gap-3 lg:grid-cols-4">
              <MetricCard
                label="Admissions avoided"
                value={formatNumber(results.admissions_avoided_total)}
              />
              <MetricCard
                label="Bed days avoided"
                value={formatNumber(results.bed_days_avoided_total)}
              />
              <MetricCard
                label="Programme cost"
                value={formatCurrency(results.programme_cost_total)}
              />
              <MetricCard
                label="Gross savings"
                value={formatCurrency(results.gross_savings_total)}
              />
            </div>

            <div className="mt-4">{interpretationPanel}</div>

            <div className="mt-4 grid gap-3 xl:grid-cols-3">
              <MetricCard label="Return on spend" value={formatRatio(results.roi)} />
              <MetricCard
                label="Break-even cost per patient"
                value={formatCurrency(results.break_even_cost_per_patient)}
              />
              <MetricCard
                label="Required support effect"
                value={formatPercent(results.break_even_effect_required)}
              />
            </div>
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
            description="Scenario preset first, then quick assumptions and advanced settings."
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
            description="Review the current case, sensitivity, comparator view, and the next checks."
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

              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <MetricCard
                  label="Admissions avoided"
                  value={formatNumber(results.admissions_avoided_total)}
                />
                <MetricCard
                  label="Bed days avoided"
                  value={formatNumber(results.bed_days_avoided_total)}
                />
                <MetricCard label="Return on spend" value={formatRatio(results.roi)} />
                <MetricCard label="Current case type" value={currentCaseType} />
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Decision recommendation</h3>
                <div className="mt-3">{recommendationSummary}</div>
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Threshold readout</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <AssumptionReviewCard
                    label="Break-even cost per patient"
                    value={formatCurrency(results.break_even_cost_per_patient)}
                  />
                  <AssumptionReviewCard
                    label="Required support effect"
                    value={formatPercent(results.break_even_effect_required)}
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
                      note={`${formatNumber(row.patients_stabilised_total)} patients stabilised · ${row.decision_status}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h3 className={SECTION_KICKER}>Sensitivity</h3>
                <div className="mt-3">
                  <SensitivityChart sensitivityRows={sensitivityRows} />
                </div>
                <div className="mt-3">{sensitivityTopDrivers}</div>
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Sensitivity interpretation</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {sensitivityTakeaways.map((takeaway) => (
                    <MiniInsight key={takeaway} label="Takeaway" value={takeaway} />
                  ))}
                </div>
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Comparator snapshot</h3>
                <div className="mt-3">{comparatorSummary}</div>
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Decision readout</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <MiniInsight label="Uncertainty readout" value={uncertaintyRobustness} />
                  <MiniInsight
                    label="Interpretation summary"
                    value={interpretation.what_model_suggests}
                  />
                  <MiniInsight
                    label="First validation point"
                    value={decisionReadiness.validate_next[0] ?? "Validate the highest-leverage local assumptions."}
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