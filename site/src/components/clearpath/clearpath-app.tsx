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

import { DEFAULT_INPUTS } from "@/lib/pathshift/defaults";
import {
  buildComparatorCase,
  runBoundedUncertainty,
  runModel,
} from "@/lib/pathshift/calculations";
import {
  buildCumulativeCostChartData,
  buildImpactBarChartData,
  buildPatientsShiftedChartData,
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
} from "@/lib/pathshift/metadata";
import {
  COMPARATOR_OPTIONS,
  COSTING_METHOD_OPTIONS,
  TARGETING_MODE_OPTIONS,
} from "@/lib/pathshift/scenarios";
import {
  generateInterpretation,
  generateOverviewSummary,
  generateOverallSignal,
  generateStructuredRecommendation,
  getDecisionStatus,
  getMainDriverText,
  getNetCostLabel,
} from "@/lib/pathshift/summaries";
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
} from "@/lib/pathshift/types";

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
  | "High-admission pressure"
  | "Lower-cost setting shift"
  | "Targeted high-utiliser redesign";

type PresetDefinition = {
  description: string;
  apply: () => Partial<Inputs>;
};

const PRESET_OPTIONS: readonly PresetOption[] = [
  "Base case",
  "Conservative case",
  "Optimistic case",
  "High-admission pressure",
  "Lower-cost setting shift",
  "Targeted high-utiliser redesign",
] as const;

const baseTargetingMode = TARGETING_MODE_OPTIONS[0] as TargetingMode;
const secondaryTargetingMode =
  (TARGETING_MODE_OPTIONS[1] ?? TARGETING_MODE_OPTIONS[0]) as TargetingMode;
const tertiaryTargetingMode =
  (TARGETING_MODE_OPTIONS[2] ??
    TARGETING_MODE_OPTIONS[1] ??
    TARGETING_MODE_OPTIONS[0]) as TargetingMode;

const baseCostingMethod = COSTING_METHOD_OPTIONS[0] as CostingMethod;
const secondaryCostingMethod =
  (COSTING_METHOD_OPTIONS[1] ?? COSTING_METHOD_OPTIONS[0]) as CostingMethod;

const PATHSHIFT_PRESETS: Record<PresetOption, PresetDefinition> = {
  "Base case": {
    description: "Restores the default pathway redesign starting point.",
    apply: () => ({
      ...DEFAULT_INPUTS,
    }),
  },
  "Conservative case": {
    description:
      "Lower reach, smaller redesign effect, and weaker persistence.",
    apply: () => ({
      targeting_mode: baseTargetingMode,
      implementation_reach_rate: 0.42,
      redesign_cost_per_patient: 260,
      proportion_shifted_to_lower_cost_setting: 0.18,
      reduction_in_admission_rate: 0.08,
      reduction_in_follow_up_contacts: 0.08,
      annual_effect_decay_rate: 0.14,
      participation_dropoff_rate: 0.12,
      costing_method: baseCostingMethod,
    }),
  },
  "Optimistic case": {
    description:
      "Higher reach, stronger pathway shift, and better persistence.",
    apply: () => ({
      targeting_mode: baseTargetingMode,
      implementation_reach_rate: 0.7,
      redesign_cost_per_patient: 170,
      proportion_shifted_to_lower_cost_setting: 0.4,
      reduction_in_admission_rate: 0.18,
      reduction_in_follow_up_contacts: 0.16,
      annual_effect_decay_rate: 0.05,
      participation_dropoff_rate: 0.05,
      costing_method: secondaryCostingMethod,
    }),
  },
  "High-admission pressure": {
    description:
      "Represents a pathway where admission risk is high and redesign value is concentrated.",
    apply: () => ({
      targeting_mode: secondaryTargetingMode,
      current_admission_rate: 0.28,
      implementation_reach_rate: 0.58,
      proportion_shifted_to_lower_cost_setting: 0.32,
      reduction_in_admission_rate: 0.18,
      reduction_in_follow_up_contacts: 0.1,
    }),
  },
  "Lower-cost setting shift": {
    description:
      "Tests whether value improves under a stronger shift into lower-cost settings.",
    apply: () => ({
      targeting_mode: baseTargetingMode,
      implementation_reach_rate: 0.62,
      redesign_cost_per_patient: 190,
      proportion_shifted_to_lower_cost_setting: 0.42,
      reduction_in_admission_rate: 0.12,
      reduction_in_follow_up_contacts: 0.12,
    }),
  },
  "Targeted high-utiliser redesign": {
    description:
      "Focuses redesign on the highest-opportunity, higher-utilisation subgroup.",
    apply: () => ({
      targeting_mode: tertiaryTargetingMode,
      implementation_reach_rate: 0.54,
      redesign_cost_per_patient: 210,
      proportion_shifted_to_lower_cost_setting: 0.36,
      reduction_in_admission_rate: 0.2,
      reduction_in_follow_up_contacts: 0.14,
    }),
  },
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getCaseTypeLabel(preset: PresetOption, inputs: Inputs): string {
  if (preset === "Conservative case") return "Conservative redesign case";
  if (preset === "Optimistic case") return "Optimistic redesign case";
  if (preset === "High-admission pressure") return "High-admission pressure case";
  if (preset === "Lower-cost setting shift") return "Lower-cost setting shift case";
  if (preset === "Targeted high-utiliser redesign") {
    return "Targeted high-utiliser redesign case";
  }

  if (inputs.redesign_cost_per_patient <= 200) {
    return "Lower-cost setting shift case";
  }
  if (inputs.current_admission_rate >= 0.24) {
    return "High-admission pressure case";
  }
  if (
    inputs.targeting_mode.toLowerCase().includes("high") ||
    inputs.targeting_mode.toLowerCase().includes("target")
  ) {
    return "Targeted high-utiliser redesign case";
  }

  return "Broad redesign case";
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

function PatientsShiftedChart({
  yearlyResults,
}: {
  yearlyResults: YearlyResultRow[];
}) {
  const data = buildPatientsShiftedChartData(yearlyResults);

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
              dataKey="patientsShifted"
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
    mobileLabel: row.label,
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
              width={138}
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

export default function PathShiftApp() {
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
    COMPARATOR_OPTIONS[0],
  );
  const [presetMode, setPresetMode] = useState<PresetOption>("Base case");

  const results = useMemo(() => runModel(inputs), [inputs]);
  const uncertainty = useMemo(() => runBoundedUncertainty(inputs), [inputs]);

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

  const caseTypeLabel = useMemo(
    () => getCaseTypeLabel(presetMode, inputs),
    [presetMode, inputs],
  );

  const presetDescription = PATHSHIFT_PRESETS[presetMode].description;

  const updateInput = <K extends keyof Inputs>(key: K, value: Inputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const applyPreset = (preset: PresetOption) => {
    setPresetMode(preset);
    const updates = PATHSHIFT_PRESETS[preset].apply();
    setInputs((prev) => ({ ...prev, ...updates }));
  };

  const resetToBaseCase = () => {
    setInputs({ ...DEFAULT_INPUTS });
    setPresetMode("Base case");
    setComparatorMode(COMPARATOR_OPTIONS[0]);
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
        label="Patients shifted"
        value={formatNumber(results.patients_shifted_total)}
      />
      <MetricCard
        label="Admissions avoided"
        value={formatNumber(results.admissions_avoided_total)}
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
        label="Break-even cost per patient"
        value={formatCurrency(results.break_even_cost_per_patient)}
      />
      <MetricCard
        label="Break-even horizon"
        value={results.break_even_horizon}
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
        help="Changes concentration of pathway opportunity and admission risk."
      />

      <NumberInput
        label="Eligible patients"
        value={inputs.eligible_patients}
        onChange={(value) => updateInput("eligible_patients", value)}
        step={50}
        help="Baseline flow of patients who could enter the redesigned pathway."
      />

      <SliderInput
        label="Implementation reach"
        value={inputs.implementation_reach_rate}
        onChange={(value) => updateInput("implementation_reach_rate", value)}
        min={0}
        max={1}
        step={0.01}
        display={formatPercent(inputs.implementation_reach_rate)}
        help="Share of eligible patients effectively reached."
      />

      <SliderInput
        label="Shift to lower-cost setting"
        value={inputs.proportion_shifted_to_lower_cost_setting}
        onChange={(value) =>
          updateInput("proportion_shifted_to_lower_cost_setting", value)
        }
        min={0}
        max={1}
        step={0.01}
        display={formatPercent(inputs.proportion_shifted_to_lower_cost_setting)}
        help="Share of pathway activity shifted to a lower-cost setting."
      />

      <SliderInput
        label="Admission reduction"
        value={inputs.reduction_in_admission_rate}
        onChange={(value) => updateInput("reduction_in_admission_rate", value)}
        min={0}
        max={0.6}
        step={0.01}
        display={formatPercent(inputs.reduction_in_admission_rate)}
        help="Reduction in admission risk under the redesign."
      />

      <NumberInput
        label="Redesign cost per patient"
        value={inputs.redesign_cost_per_patient}
        onChange={(value) => updateInput("redesign_cost_per_patient", value)}
        step={10}
        help="Main implementation cost lever."
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
          onClick={() => toggleSection("advanced-baseline")}
          className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
          aria-expanded={openSections["advanced-baseline"]}
        >
          <span className="text-sm font-medium text-slate-900">
            Baseline pathway assumptions
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
                label="Current admission rate"
                value={inputs.current_admission_rate}
                onChange={(value) => updateInput("current_admission_rate", value)}
                min={0}
                max={1}
                step={0.01}
                display={formatPercent(inputs.current_admission_rate)}
              />
              <NumberInput
                label="Current follow-ups per patient"
                value={inputs.current_follow_ups_per_patient}
                onChange={(value) =>
                  updateInput("current_follow_ups_per_patient", value)
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
                label="Cost per admission"
                value={inputs.cost_per_admission}
                onChange={(value) => updateInput("cost_per_admission", value)}
                step={100}
              />
              <NumberInput
                label="Cost per follow-up contact"
                value={inputs.cost_per_follow_up_contact}
                onChange={(value) =>
                  updateInput("cost_per_follow_up_contact", value)
                }
                step={25}
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
              <SliderInput
                label="Follow-up reduction"
                value={inputs.reduction_in_follow_up_contacts}
                onChange={(value) =>
                  updateInput("reduction_in_follow_up_contacts", value)
                }
                min={0}
                max={0.8}
                step={0.01}
                display={formatPercent(inputs.reduction_in_follow_up_contacts)}
              />
              <SliderInput
                label="Annual effect decay"
                value={inputs.annual_effect_decay_rate}
                onChange={(value) =>
                  updateInput("annual_effect_decay_rate", value)
                }
                min={0}
                max={0.5}
                step={0.01}
                display={formatPercent(inputs.annual_effect_decay_rate)}
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
                label="QALY gain per patient shifted"
                value={inputs.qaly_gain_per_patient_shifted}
                onChange={(value) =>
                  updateInput("qaly_gain_per_patient_shifted", value)
                }
                step={0.01}
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
            note={meta.description}
          />
        );
      })}
    </div>
  );

  const mobileCharts = (
    <div className="space-y-4 lg:hidden">
      <PatientsShiftedChart yearlyResults={results.yearly_results} />

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
      <PatientsShiftedChart yearlyResults={results.yearly_results} />
      <CostVsSavingsChart yearlyResults={results.yearly_results} />
      <PathwayImpactChart results={results} />
      <BoundedUncertaintyChart
        uncertaintyRows={uncertainty}
        threshold={inputs.cost_effectiveness_threshold}
      />
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
        label="Patients shifted delta"
        value={formatNumber(
          comparatorResults.patients_shifted_total - results.patients_shifted_total,
        )}
      />
      <AssumptionReviewCard
        label="Admissions avoided delta"
        value={formatNumber(
          comparatorResults.admissions_avoided_total - results.admissions_avoided_total,
        )}
      />
      <AssumptionReviewCard
        label="Discounted net cost delta"
        value={formatCurrency(
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
          PathShift
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
          Explore how pathway redesign might shift care into lower-cost settings,
          reduce admissions and follow-ups, and change the overall value case.
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
            description="Review the current case, uncertainty, comparator snapshot, and practical next checks."
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
                  label="Follow-ups avoided"
                  value={formatNumber(results.follow_ups_avoided_total)}
                />
                <MetricCard label="Return on spend" value={formatRatio(results.roi)} />
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Threshold readout</h3>
                <div className="mt-3 grid gap-3">
                  <AssumptionReviewCard
                    label="Break-even cost per patient"
                    value={formatCurrency(results.break_even_cost_per_patient)}
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
                      note={`${formatNumber(row.patients_shifted_total)} patients shifted · ${row.decision_status}`}
                    />
                  ))}
                </div>
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Comparator snapshot</h3>
                <div className="mt-3">{comparatorSummary}</div>
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
            description="Review the current case, uncertainty, comparator view, and validation prompts."
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
                  label="Follow-ups avoided"
                  value={formatNumber(results.follow_ups_avoided_total)}
                />
                <MetricCard label="Return on spend" value={formatRatio(results.roi)} />
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Threshold readout</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <AssumptionReviewCard
                    label="Break-even cost per patient"
                    value={formatCurrency(results.break_even_cost_per_patient)}
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
                      note={`${formatNumber(row.patients_shifted_total)} patients shifted · ${row.decision_status}`}
                    />
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
                  <MiniInsight label="Current case type" value={caseTypeLabel} />
                  <MiniInsight
                    label="Interpretation summary"
                    value={interpretation.what_model_suggests}
                  />
                  <MiniInsight
                    label="Main driver"
                    value={structuredRecommendation.main_dependency}
                  />
                  <MiniInsight
                    label="Main fragility"
                    value={structuredRecommendation.main_fragility}
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