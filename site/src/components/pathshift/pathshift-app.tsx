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
  buildPathwayShiftChartData,
  buildUncertaintyChartData,
  compactCurrencyAxis,
} from "@/lib/pathshift/charts";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRatio,
} from "@/lib/pathshift/formatters";
import { ASSUMPTION_META, ASSUMPTION_ORDER } from "@/lib/pathshift/metadata";
import {
  COMPARATOR_OPTIONS,
  COSTING_METHOD_OPTIONS,
  TARGETING_MODE_OPTIONS,
} from "@/lib/pathshift/scenarios";
import {
  generateInterpretation,
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

type ScenarioPreset =
  | "Base case"
  | "Conservative case"
  | "Optimistic case"
  | "Lower-cost setting shift"
  | "Follow-up reduction focus"
  | "Admission reduction focus";

const PRESET_OPTIONS: readonly ScenarioPreset[] = [
  "Base case",
  "Conservative case",
  "Optimistic case",
  "Lower-cost setting shift",
  "Follow-up reduction focus",
  "Admission reduction focus",
] as const;

const baseTargetingMode = TARGETING_MODE_OPTIONS[0] as TargetingMode;
const secondaryTargetingMode =
  (TARGETING_MODE_OPTIONS[1] ?? TARGETING_MODE_OPTIONS[0]) as TargetingMode;
const tertiaryTargetingMode =
  (TARGETING_MODE_OPTIONS[2] ??
    TARGETING_MODE_OPTIONS[1] ??
    TARGETING_MODE_OPTIONS[0]) as TargetingMode;

const baseCostingMethod = COSTING_METHOD_OPTIONS[0] as CostingMethod;

const PRESET_PATCHES: Record<ScenarioPreset, Partial<Inputs>> = {
  "Base case": {
    targeting_mode: DEFAULT_INPUTS.targeting_mode,
    annual_cohort_size: DEFAULT_INPUTS.annual_cohort_size,
    implementation_reach_rate: DEFAULT_INPUTS.implementation_reach_rate,
    redesign_cost_per_patient: DEFAULT_INPUTS.redesign_cost_per_patient,
    proportion_shifted_to_lower_cost_setting:
      DEFAULT_INPUTS.proportion_shifted_to_lower_cost_setting,
    reduction_in_admission_rate: DEFAULT_INPUTS.reduction_in_admission_rate,
    reduction_in_follow_up_contacts:
      DEFAULT_INPUTS.reduction_in_follow_up_contacts,
    reduction_in_length_of_stay: DEFAULT_INPUTS.reduction_in_length_of_stay,
    time_horizon_years: DEFAULT_INPUTS.time_horizon_years,
    current_acute_managed_rate: DEFAULT_INPUTS.current_acute_managed_rate,
    current_admission_rate: DEFAULT_INPUTS.current_admission_rate,
    current_follow_up_contacts_per_patient:
      DEFAULT_INPUTS.current_follow_up_contacts_per_patient,
    current_average_length_of_stay:
      DEFAULT_INPUTS.current_average_length_of_stay,
    costing_method: DEFAULT_INPUTS.costing_method,
    cost_effectiveness_threshold:
      DEFAULT_INPUTS.cost_effectiveness_threshold,
    cost_per_acute_managed_patient:
      DEFAULT_INPUTS.cost_per_acute_managed_patient,
    cost_per_community_managed_patient:
      DEFAULT_INPUTS.cost_per_community_managed_patient,
    cost_per_follow_up_contact: DEFAULT_INPUTS.cost_per_follow_up_contact,
    cost_per_admission: DEFAULT_INPUTS.cost_per_admission,
    cost_per_bed_day: DEFAULT_INPUTS.cost_per_bed_day,
    discount_rate: DEFAULT_INPUTS.discount_rate,
    effect_decay_rate: DEFAULT_INPUTS.effect_decay_rate,
    participation_dropoff_rate: DEFAULT_INPUTS.participation_dropoff_rate,
    qaly_gain_per_patient_improved:
      DEFAULT_INPUTS.qaly_gain_per_patient_improved,
  },
  "Conservative case": {
    targeting_mode: baseTargetingMode,
    implementation_reach_rate: 0.42,
    redesign_cost_per_patient: 260,
    proportion_shifted_to_lower_cost_setting: 0.12,
    reduction_in_admission_rate: 0.07,
    reduction_in_follow_up_contacts: 0.12,
    reduction_in_length_of_stay: 0.04,
    participation_dropoff_rate: 0.12,
    effect_decay_rate: 0.12,
    qaly_gain_per_patient_improved: 0.03,
    costing_method: baseCostingMethod,
  },
  "Optimistic case": {
    targeting_mode: baseTargetingMode,
    implementation_reach_rate: 0.72,
    redesign_cost_per_patient: 160,
    proportion_shifted_to_lower_cost_setting: 0.32,
    reduction_in_admission_rate: 0.18,
    reduction_in_follow_up_contacts: 0.34,
    reduction_in_length_of_stay: 0.14,
    participation_dropoff_rate: 0.05,
    effect_decay_rate: 0.05,
    qaly_gain_per_patient_improved: 0.08,
  },
  "Lower-cost setting shift": {
    targeting_mode: baseTargetingMode,
    implementation_reach_rate: 0.62,
    redesign_cost_per_patient: 190,
    proportion_shifted_to_lower_cost_setting: 0.42,
    reduction_in_admission_rate: 0.1,
    reduction_in_follow_up_contacts: 0.16,
    reduction_in_length_of_stay: 0.08,
    qaly_gain_per_patient_improved: 0.05,
  },
  "Follow-up reduction focus": {
    targeting_mode: secondaryTargetingMode,
    implementation_reach_rate: 0.58,
    redesign_cost_per_patient: 170,
    proportion_shifted_to_lower_cost_setting: 0.18,
    reduction_in_admission_rate: 0.06,
    reduction_in_follow_up_contacts: 0.42,
    reduction_in_length_of_stay: 0.05,
    qaly_gain_per_patient_improved: 0.04,
  },
  "Admission reduction focus": {
    targeting_mode: tertiaryTargetingMode,
    implementation_reach_rate: 0.54,
    redesign_cost_per_patient: 210,
    proportion_shifted_to_lower_cost_setting: 0.2,
    reduction_in_admission_rate: 0.2,
    reduction_in_follow_up_contacts: 0.18,
    reduction_in_length_of_stay: 0.14,
    qaly_gain_per_patient_improved: 0.07,
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

function getCaseTypeLabel(
  preset: ScenarioPreset,
  inputs: Inputs,
): string {
  if (preset === "Lower-cost setting shift") {
    return "Lower-cost setting shift case";
  }
  if (preset === "Follow-up reduction focus") {
    return "Follow-up reduction case";
  }
  if (preset === "Admission reduction focus") {
    return "Admission reduction case";
  }
  if (preset === "Conservative case") {
    return "Conservative redesign case";
  }
  if (preset === "Optimistic case") {
    return "Higher-impact redesign case";
  }

  if (
    inputs.proportion_shifted_to_lower_cost_setting >=
      inputs.reduction_in_follow_up_contacts &&
    inputs.proportion_shifted_to_lower_cost_setting >=
      inputs.reduction_in_admission_rate
  ) {
    return "Lower-cost setting shift case";
  }

  if (
    inputs.reduction_in_follow_up_contacts >=
      inputs.proportion_shifted_to_lower_cost_setting &&
    inputs.reduction_in_follow_up_contacts >=
      inputs.reduction_in_admission_rate
  ) {
    return "Follow-up reduction case";
  }

  if (inputs.targeting_mode === tertiaryTargetingMode) {
    return "Higher-opportunity subgroup case";
  }

  return "Broad pathway redesign case";
}

function getRecommendationSignal(
  results: ModelResults,
  threshold: number,
): string {
  if (results.discounted_net_cost_total < 0) {
    return "Looks decision-positive on cost saving grounds.";
  }
  if (results.discounted_cost_per_qaly <= threshold) {
    return "Looks decision-positive on cost-effectiveness grounds.";
  }
  return "Needs stronger impact or lower delivery cost to support the case.";
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
                angle={0}
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

export default function PathShiftApp() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS);
  const [mobileTab, setMobileTab] = useState<MobileTab>("summary");
  const [showAdvancedMobile, setShowAdvancedMobile] = useState(false);
  const [showAssumptionReviewMobile, setShowAssumptionReviewMobile] =
    useState(false);
  const [selectedPreset, setSelectedPreset] =
    useState<ScenarioPreset>("Base case");
  const [openSections, setOpenSections] = useState<
    Record<AssumptionSectionKey, boolean>
  >({
    "advanced-pathway": false,
    "advanced-costs": false,
    "advanced-outcomes": false,
  });
  const [comparatorMode, setComparatorMode] = useState<ComparatorOption>(
    "Follow-up reduction focus",
  );

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
  const caseTypeLabel = useMemo(
    () => getCaseTypeLabel(selectedPreset, inputs),
    [selectedPreset, inputs],
  );
  const recommendationSignal = useMemo(
    () =>
      getRecommendationSignal(
        results,
        inputs.cost_effectiveness_threshold,
      ),
    [results, inputs.cost_effectiveness_threshold],
  );

  const interpretation = useMemo(
    () => generateInterpretation(results, inputs, uncertainty),
    [results, inputs, uncertainty],
  );

  const updateInput = <K extends keyof Inputs>(key: K, value: Inputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const applyPreset = (preset: ScenarioPreset) => {
    setSelectedPreset(preset);
    setInputs((prev) => ({ ...prev, ...PRESET_PATCHES[preset] }));
  };

  const resetToBaseCase = () => {
    setInputs({ ...DEFAULT_INPUTS });
    setSelectedPreset("Base case");
    setComparatorMode("Follow-up reduction focus");
    setShowAdvancedMobile(false);
    setShowAssumptionReviewMobile(false);
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
      <MiniInsight label="Case type" value={caseTypeLabel} />
      <MiniInsight label="Conclusion" value={interpretation.what_model_suggests} />
      <MiniInsight
        label="Main driver"
        value={`The result is currently most shaped by ${mainDriver}.`}
      />
      <MiniInsight label="Fragility" value={interpretation.what_looks_fragile} />
    </div>
  );

  const recommendationPanel = (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <MiniInsight label="What this suggests" value={recommendationSignal} />
      <MiniInsight
        label="What is driving it"
        value={`This is mainly a ${caseTypeLabel.toLowerCase()}, with the result currently most shaped by ${mainDriver}.`}
      />
      <MiniInsight
        label="What looks fragile"
        value={interpretation.what_looks_fragile}
      />
      <MiniInsight
        label="Validate next"
        value={interpretation.what_to_validate_next}
      />
    </div>
  );

  const quickAssumptionNotice = (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-600">
      These are the levers most likely to change the decision signal.
    </div>
  );

  const presetControl = (
    <div className={SUBCARD_DENSE}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        Scenario preset
      </p>
      <div className="mt-3">
        <SelectInput
          label="Preset"
          value={selectedPreset}
          options={PRESET_OPTIONS}
          onChange={applyPreset}
          help="Applies a coherent scenario while still allowing manual edits afterward."
        />
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
                label="Threshold"
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
            value={meta.formatter(value as never)}
            note={meta.description}
          />
        );
      })}
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
          Explore how pathway redesign might change activity, admissions,
          follow-up burden, bed use, and value under different assumptions
          about reach, service shift, effectiveness, and delivery cost.
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
            description="Preset first, then quick assumptions. Advanced settings stay below."
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
            description="Review the current case, bounded uncertainty, and the next checks."
            dense
          >
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-3">
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
                <h3 className={SECTION_KICKER}>Decision readout</h3>
                <div className="mt-3">{recommendationPanel}</div>
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Threshold readout</h3>
                <div className="mt-3 grid gap-3">
                  <AssumptionReviewCard
                    label="Break-even cost per patient"
                    value={formatCurrency(results.break_even_cost_per_patient)}
                  />
                  <AssumptionReviewCard
                    label="Required redesign effect"
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

              <div className={SUBCARD}>
                <button
                  type="button"
                  onClick={() => setShowAssumptionReviewMobile((v) => !v)}
                  className="flex w-full items-center justify-between gap-4 text-left"
                  aria-expanded={showAssumptionReviewMobile}
                >
                  <span className="text-sm font-medium text-slate-900">
                    Assumption review
                  </span>
                  <ChevronDown
                    className={cx(
                      "h-4 w-4 text-slate-500 transition-transform",
                      showAssumptionReviewMobile && "rotate-180",
                    )}
                  />
                </button>

                {showAssumptionReviewMobile ? (
                  <div className="mt-4">{assumptionsReview}</div>
                ) : null}
              </div>
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
                label="Follow-ups avoided"
                value={formatNumber(results.follow_ups_avoided_total)}
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
                label="Required redesign effect"
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
            description="Preset first, then quick assumptions. Advanced settings stay below."
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
            description="Review the current case, bounded uncertainty, comparator snapshot, and the next checks."
            dense
          >
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
                <h3 className={SECTION_KICKER}>Decision readout</h3>
                <div className="mt-3">{recommendationPanel}</div>
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Threshold readout</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <AssumptionReviewCard
                    label="Break-even cost per patient"
                    value={formatCurrency(results.break_even_cost_per_patient)}
                  />
                  <AssumptionReviewCard
                    label="Required redesign effect"
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
                      note={`${formatNumber(row.patients_shifted_total)} patients shifted · ${row.decision_status}`}
                    />
                  ))}
                </div>
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Comparator snapshot</h3>
                <div className="mt-3">{comparatorSummary}</div>
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