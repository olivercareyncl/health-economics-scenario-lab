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

import { DEFAULT_INPUTS } from "@/lib/stableheart/defaults";
import {
  buildComparatorCase,
  runBoundedUncertainty,
  runModel,
  runParameterSensitivity,
} from "@/lib/stableheart/calculations";
import {
  buildCumulativeCostChartData,
  buildEventsByYearChartData,
  buildEventsChartData,
  buildUncertaintyChartData,
  compactCurrencyAxis,
} from "@/lib/stableheart/charts";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRatio,
} from "@/lib/stableheart/formatters";
import { ASSUMPTION_META, ASSUMPTION_ORDER } from "@/lib/stableheart/metadata";
import {
  COMPARATOR_OPTIONS,
  COSTING_METHOD_OPTIONS,
  TARGETING_MODE_OPTIONS,
} from "@/lib/stableheart/scenarios";
import {
  generateInterpretation,
  getDecisionStatus,
  getNetCostLabel,
} from "@/lib/stableheart/summaries";
import type {
  AssumptionSectionKey,
  ComparatorOption,
  CostingMethod,
  Inputs,
  MobileTab,
  ModelResults,
  ParameterSensitivityRow,
  SensitivitySummary,
  TargetingMode,
  UncertaintyRow,
  YearlyResultRow,
} from "@/lib/stableheart/types";

const PANEL_SHELL =
  "rounded-[26px] border border-slate-200 bg-slate-50 p-4 sm:p-5 lg:p-5 xl:p-6";
const SUBCARD =
  "rounded-2xl border border-slate-200 bg-white p-4 lg:p-4 xl:p-5";
const SUBCARD_DENSE =
  "rounded-2xl border border-slate-200 bg-white p-3.5 lg:p-4";
const SECTION_KICKER =
  "text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500";

type PresetKey =
  | "Base case"
  | "Conservative case"
  | "Optimistic case"
  | "Secondary prevention focus"
  | "Lower-cost delivery"
  | "Higher-risk population"
  | "Custom";

const PRESET_OPTIONS: readonly PresetKey[] = [
  "Base case",
  "Conservative case",
  "Optimistic case",
  "Secondary prevention focus",
  "Lower-cost delivery",
  "Higher-risk population",
  "Custom",
] as const;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getPresetPatch(
  preset: Exclude<PresetKey, "Custom">,
): Partial<Inputs> {
  const baseTarget = TARGETING_MODE_OPTIONS[0] as TargetingMode;
  const secondaryTarget = (TARGETING_MODE_OPTIONS[1] ??
    TARGETING_MODE_OPTIONS[0]) as TargetingMode;
  const higherRiskTarget = (TARGETING_MODE_OPTIONS[2] ??
    TARGETING_MODE_OPTIONS[1] ??
    TARGETING_MODE_OPTIONS[0]) as TargetingMode;

  const baseCosting = COSTING_METHOD_OPTIONS[0] as CostingMethod;
  const fullerCosting = (COSTING_METHOD_OPTIONS[1] ??
    COSTING_METHOD_OPTIONS[0]) as CostingMethod;

  switch (preset) {
    case "Base case":
      return { ...DEFAULT_INPUTS };

    case "Conservative case":
      return {
        targeting_mode: baseTarget,
        intervention_reach_rate: 0.4,
        sustained_engagement_rate: 0.58,
        risk_reduction_in_recurrent_events: 0.12,
        intervention_cost_per_patient_reached: 260,
        baseline_recurrent_event_rate: 0.16,
        admission_probability_per_event: 0.3,
        annual_effect_decay_rate: 0.14,
        annual_participation_dropoff_rate: 0.12,
        qaly_gain_per_event_avoided: 0.05,
        costing_method: baseCosting,
      };

    case "Optimistic case":
      return {
        targeting_mode: baseTarget,
        intervention_reach_rate: 0.68,
        sustained_engagement_rate: 0.78,
        risk_reduction_in_recurrent_events: 0.26,
        intervention_cost_per_patient_reached: 160,
        baseline_recurrent_event_rate: 0.22,
        admission_probability_per_event: 0.38,
        annual_effect_decay_rate: 0.05,
        annual_participation_dropoff_rate: 0.05,
        qaly_gain_per_event_avoided: 0.09,
        costing_method: fullerCosting,
      };

    case "Secondary prevention focus":
      return {
        targeting_mode: secondaryTarget,
        eligible_population: Math.round(DEFAULT_INPUTS.eligible_population * 0.8),
        intervention_reach_rate: 0.66,
        sustained_engagement_rate: 0.74,
        risk_reduction_in_recurrent_events: 0.24,
        baseline_recurrent_event_rate: 0.25,
        admission_probability_per_event: 0.41,
        qaly_gain_per_event_avoided: 0.08,
      };

    case "Lower-cost delivery":
      return {
        intervention_cost_per_patient_reached: 140,
        intervention_reach_rate: 0.62,
        sustained_engagement_rate: 0.68,
        annual_effect_decay_rate: 0.07,
        annual_participation_dropoff_rate: 0.07,
        costing_method: fullerCosting,
      };

    case "Higher-risk population":
      return {
        targeting_mode: higherRiskTarget,
        eligible_population: Math.round(DEFAULT_INPUTS.eligible_population * 0.75),
        intervention_reach_rate: 0.58,
        sustained_engagement_rate: 0.7,
        baseline_recurrent_event_rate: 0.3,
        admission_probability_per_event: 0.44,
        risk_reduction_in_recurrent_events: 0.23,
        qaly_gain_per_event_avoided: 0.09,
      };
  }
}

function getPresetDescription(preset: PresetKey) {
  switch (preset) {
    case "Base case":
      return "Restores the default workshop configuration.";
    case "Conservative case":
      return "Lower effect, weaker persistence, and higher delivery cost.";
    case "Optimistic case":
      return "Stronger effect, better persistence, and more favourable cost profile.";
    case "Secondary prevention focus":
      return "Concentrates the offer where recurrent cardiovascular risk is already established.";
    case "Lower-cost delivery":
      return "Tests whether the case strengthens under a leaner delivery model.";
    case "Higher-risk population":
      return "Concentrates value in a smaller group with higher baseline event risk.";
    case "Custom":
      return "Inputs have been edited away from a named preset.";
  }
}

function deriveCaseType(
  preset: PresetKey,
  inputs: Inputs,
): string {
  if (preset !== "Custom") {
    switch (preset) {
      case "Base case":
        return "Broad proactive management case";
      case "Conservative case":
        return "Conservative delivery case";
      case "Optimistic case":
        return "Optimistic improvement case";
      case "Secondary prevention focus":
        return "Secondary prevention case";
      case "Lower-cost delivery":
        return "Lower-cost delivery case";
      case "Higher-risk population":
        return "Higher-risk population case";
      default:
        return "Current scenario case";
    }
  }

  if (inputs.intervention_cost_per_patient_reached <= 150) {
    return "Lower-cost delivery case";
  }

  if (
    inputs.baseline_recurrent_event_rate >= 0.26 ||
    inputs.admission_probability_per_event >= 0.42
  ) {
    return "Higher-risk population case";
  }

  if (inputs.sustained_engagement_rate >= 0.72) {
    return "Secondary prevention-style case";
  }

  return "Broad proactive management case";
}

function buildRecommendationSummary(
  inputs: Inputs,
  results: ModelResults,
  uncertaintyRows: UncertaintyRow[],
  preset: PresetKey,
  caseType: string,
  sensitivity: SensitivitySummary,
) {
  const interpretation = generateInterpretation(results, inputs, uncertaintyRows);
  const decisionStatus = getDecisionStatus(
    results,
    inputs.cost_effectiveness_threshold,
  );
  const baseRow = uncertaintyRows.find((row) => row.case === "Base");
  const lowRow = uncertaintyRows.find((row) => row.case === "Low");
  const highRow = uncertaintyRows.find((row) => row.case === "High");
  const topDrivers = sensitivity.top_drivers;

  const currentCaseSuggests =
    decisionStatus === "Appears cost-saving"
      ? `${caseType} currently suggests avoided recurrent events with a net saving signal.`
      : decisionStatus === "Appears cost-effective"
        ? `${caseType} currently suggests a plausible value case at the present threshold.`
        : `${caseType} currently suggests operational benefit, but the economic case remains above threshold.`;

  const drivingResult =
    topDrivers.length > 0
      ? `The result is mainly being driven by ${topDrivers
          .slice(0, 3)
          .map((driver) => driver.parameter_label.toLowerCase())
          .join(", ")}.`
      : "The result is mainly being shaped by the core event-rate, effect, and delivery assumptions.";

  const fragilePoint =
    lowRow && highRow && lowRow.decision_status !== highRow.decision_status
      ? topDrivers.length > 0
        ? `The bounded range crosses decision categories, and one-way sensitivity suggests the case is particularly exposed to ${topDrivers[0].parameter_label.toLowerCase()}.`
        : "The bounded range crosses decision categories, so moderate assumption shifts could change the conclusion."
      : interpretation.what_looks_fragile;

  const validateNext =
    baseRow &&
    baseRow.discounted_cost_per_qaly <= inputs.cost_effectiveness_threshold
      ? topDrivers.length > 0
        ? `Validate local ${topDrivers[0].parameter_label.toLowerCase()}${
            topDrivers[1]
              ? ` and ${topDrivers[1].parameter_label.toLowerCase()}`
              : ""
          } before treating the case as decision-ready.`
        : "Validate baseline recurrent event risk, achievable engagement, and real delivery cost before treating the case as decision-ready."
      : interpretation.what_to_validate_next;

  const recommendationLine =
    preset === "Custom"
      ? "This is currently a custom workshop case. Use the named presets to benchmark whether the current setup is unusually strict or favourable."
      : `This is currently framed as a ${caseType.toLowerCase()}. Use comparator mode to judge whether a nearby alternative looks materially stronger.`;

  return {
    current_case_suggests: currentCaseSuggests,
    driving_result: drivingResult,
    fragile_point: fragilePoint,
    validate_next: validateNext,
    recommendation_line: recommendationLine,
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

function EventsByYearChart({ yearlyResults }: { yearlyResults: YearlyResultRow[] }) {
  const data = buildEventsByYearChartData(yearlyResults);

  return (
    <div className={SUBCARD}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 lg:text-base">
          Events avoided by year
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 lg:text-sm">
          Annual recurrent event reduction across the selected horizon.
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
            <Bar dataKey="eventsAvoided" name="Events avoided" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CostVsSavingsChart({ yearlyResults }: { yearlyResults: YearlyResultRow[] }) {
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

function ImpactChart({ results }: { results: ModelResults }) {
  const rawData = buildEventsChartData(results);
  const data = rawData
    .filter((item) => item.label !== "Patients reached")
    .map((item) => {
      if (item.label === "Events avoided") {
        return { ...item, shortLabel: "Events" };
      }
      if (item.label === "Admissions avoided") {
        return { ...item, shortLabel: "Adm." };
      }
      if (item.label === "Bed days avoided") {
        return { ...item, shortLabel: "Bed days" };
      }
      return { ...item, shortLabel: item.label };
    });

  return (
    <div className={SUBCARD}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 lg:text-base">
          Clinical impact
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 lg:text-sm">
          Headline avoided-event impact over the selected horizon.
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
              width={74}
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

function TornadoSensitivityChart({
  sensitivity,
}: {
  sensitivity: SensitivitySummary;
}) {
  const data = sensitivity.top_drivers.map((row) => ({
    parameter: row.parameter_label,
    lowDelta: row.low_icer - row.base_icer,
    highDelta: row.high_icer - row.base_icer,
    baseIcer: row.base_icer,
    lowValueLabel: row.low_value_label,
    highValueLabel: row.high_value_label,
  }));

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
              dataKey="parameter"
              tickLine={false}
              axisLine={false}
              fontSize={12}
              width={170}
            />
            <Tooltip
              formatter={(value: number, name: string, entry: { payload?: { baseIcer?: number; lowValueLabel?: string; highValueLabel?: string } }) => {
                const baseIcer = entry.payload?.baseIcer ?? 0;
                const scenarioIcer = baseIcer + value;
                const label =
                  name === "lowDelta"
                    ? `Low case (${entry.payload?.lowValueLabel ?? "—"})`
                    : `High case (${entry.payload?.highValueLabel ?? "—"})`;

                return [formatCurrency(scenarioIcer), label];
              }}
              labelFormatter={(label) => String(label)}
            />
            <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={1.5} />
            <Legend
              wrapperStyle={{ fontSize: "12px" }}
              formatter={(value) =>
                value === "lowDelta" ? "Low case" : "High case"
              }
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
          className={cx("h-4 w-4 text-slate-500 transition-transform", open && "rotate-180")}
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
    <section className={cx(PANEL_SHELL, dense ? "p-4 lg:p-5" : "p-4 sm:p-5 lg:p-5 xl:p-6")}>
      <div className="mb-4 flex flex-col gap-3 lg:mb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-slate-950 lg:text-lg">
            {title}
          </h2>
          {description ? (
            <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
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

function MiniInsight({ label, value }: { label: string; value: string }) {
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
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type="number"
        min={min}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500"
      />
      {help ? <span className="mt-1.5 block text-xs leading-5 text-slate-500">{help}</span> : null}
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
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
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
      {help ? <span className="mt-1.5 block text-xs leading-5 text-slate-500">{help}</span> : null}
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

export default function StableHeartApp() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS);
  const [mobileTab, setMobileTab] = useState<MobileTab>("summary");
  const [showAdvancedMobile, setShowAdvancedMobile] = useState(false);
  const [openSections, setOpenSections] = useState<Record<AssumptionSectionKey, boolean>>({
    "advanced-baseline": false,
    "advanced-costs": false,
    "advanced-outcomes": false,
  });
  const [comparatorMode, setComparatorMode] = useState<ComparatorOption>("Lower-cost delivery");
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>("Base case");

  const results = useMemo(() => runModel(inputs), [inputs]);
  const uncertainty = useMemo(() => runBoundedUncertainty(inputs), [inputs]);
  const sensitivity = useMemo(() => runParameterSensitivity(inputs), [inputs]);

  const comparatorResults = useMemo(() => {
    const comparatorInputs = buildComparatorCase(DEFAULT_INPUTS, inputs, comparatorMode);
    return runModel(comparatorInputs);
  }, [inputs, comparatorMode]);

  const decisionStatus = useMemo(
    () => getDecisionStatus(results, inputs.cost_effectiveness_threshold),
    [results, inputs.cost_effectiveness_threshold],
  );

  const netCostLabel = useMemo(() => getNetCostLabel(results), [results]);

  const interpretation = useMemo(
    () => generateInterpretation(results, inputs, uncertainty),
    [results, inputs, uncertainty],
  );

  const currentCaseType = useMemo(
    () => deriveCaseType(selectedPreset, inputs),
    [selectedPreset, inputs],
  );

  const recommendationSummary = useMemo(
    () =>
      buildRecommendationSummary(
        inputs,
        results,
        uncertainty,
        selectedPreset,
        currentCaseType,
        sensitivity,
      ),
    [inputs, results, uncertainty, selectedPreset, currentCaseType, sensitivity],
  );

  const primaryDriver = sensitivity.primary_driver;
  const topDrivers = sensitivity.top_drivers;

  const handleExportReport = async () => {
    try {
      const response = await fetch("/api/export/stableheart", {
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
      anchor.download = "stableheart-report.pdf";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("StableHeart export failed:", error);
    }
  };

  const updateInput = <K extends keyof Inputs>(key: K, value: Inputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
    setSelectedPreset("Custom");
  };

  const applyPreset = (preset: Exclude<PresetKey, "Custom">) => {
    const patch = getPresetPatch(preset);
    setInputs((prev) => ({ ...prev, ...patch }));
    setSelectedPreset(preset);
  };

  const resetToBaseCase = () => {
    setInputs({ ...DEFAULT_INPUTS });
    setComparatorMode("Lower-cost delivery");
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
      <MetricCard label="Events avoided" value={formatNumber(results.events_avoided_total)} />
      <MetricCard label="Admissions avoided" value={formatNumber(results.admissions_avoided_total)} />
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
    <div className="grid gap-3 lg:grid-cols-3">
      <MiniInsight label="Conclusion" value={interpretation.what_model_suggests} />
      <MiniInsight
        label="Main driver"
        value={
          primaryDriver
            ? `The result is currently most shaped by ${primaryDriver.parameter_label.toLowerCase()}.`
            : interpretation.where_value_is_coming_from
        }
      />
      <MiniInsight label="Fragility" value={recommendationSummary.fragile_point} />
    </div>
  );

  const quickAssumptionNotice = (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-600">
      Use a preset to frame the workshop case, then fine-tune the key assumptions below.
    </div>
  );

  const presetControl = (
    <div className={SUBCARD}>
      <p className="mb-3 text-sm font-semibold text-slate-900">Scenario preset</p>
      <div className="grid gap-4 xl:grid-cols-2">
        <SelectInput<PresetKey>
          label="Preset"
          value={selectedPreset}
          options={PRESET_OPTIONS}
          onChange={(value) => {
            if (value === "Custom") return;
            applyPreset(value);
          }}
          help="Applies a coherent scenario configuration without resetting the full app."
        />
        <AssumptionReviewCard
          label="Current case type"
          value={currentCaseType}
          note={getPresetDescription(selectedPreset)}
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
        help="Changes where recurrent event risk is concentrated."
      />

      <NumberInput
        label="Eligible population"
        value={inputs.eligible_population}
        onChange={(value) => updateInput("eligible_population", value)}
        step={50}
        help="Baseline scale of the intervention."
      />

      <SliderInput
        label="Intervention reach"
        value={inputs.intervention_reach_rate}
        onChange={(value) => updateInput("intervention_reach_rate", value)}
        min={0}
        max={1}
        step={0.01}
        display={formatPercent(inputs.intervention_reach_rate)}
        help="Share of the eligible population reached."
      />

      <SliderInput
        label="Sustained engagement"
        value={inputs.sustained_engagement_rate}
        onChange={(value) => updateInput("sustained_engagement_rate", value)}
        min={0}
        max={1}
        step={0.01}
        display={formatPercent(inputs.sustained_engagement_rate)}
        help="Share of reached patients who sustain meaningful benefit."
      />

      <SliderInput
        label="Risk reduction in recurrent events"
        value={inputs.risk_reduction_in_recurrent_events}
        onChange={(value) => updateInput("risk_reduction_in_recurrent_events", value)}
        min={0}
        max={0.7}
        step={0.01}
        display={formatPercent(inputs.risk_reduction_in_recurrent_events)}
        help="Core avoided-event assumption."
      />

      <NumberInput
        label="Intervention cost per patient"
        value={inputs.intervention_cost_per_patient_reached}
        onChange={(value) => updateInput("intervention_cost_per_patient_reached", value)}
        step={10}
        help="Main implementation cost lever."
      />

      <div className="xl:col-span-2">
        <SelectInput
          label="Time horizon"
          value={String(inputs.time_horizon_years) as "1" | "3" | "5"}
          options={["1", "3", "5"]}
          onChange={(value) => updateInput("time_horizon_years", Number(value) as 1 | 3 | 5)}
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
          <span className="text-sm font-medium text-slate-900">Baseline risk and pathway</span>
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
                label="Baseline recurrent event rate"
                value={inputs.baseline_recurrent_event_rate}
                onChange={(value) => updateInput("baseline_recurrent_event_rate", value)}
                min={0}
                max={1}
                step={0.01}
                display={formatPercent(inputs.baseline_recurrent_event_rate)}
              />
              <SliderInput
                label="Admission probability per event"
                value={inputs.admission_probability_per_event}
                onChange={(value) => updateInput("admission_probability_per_event", value)}
                min={0}
                max={1}
                step={0.01}
                display={formatPercent(inputs.admission_probability_per_event)}
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
          <span className="text-sm font-medium text-slate-900">Cost inputs and threshold</span>
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
              />
              <NumberInput
                label="Threshold"
                value={inputs.cost_effectiveness_threshold}
                onChange={(value) => updateInput("cost_effectiveness_threshold", value)}
                step={1000}
              />
              <NumberInput
                label="Cost per cardiovascular event"
                value={inputs.cost_per_cardiovascular_event}
                onChange={(value) => updateInput("cost_per_cardiovascular_event", value)}
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
          <span className="text-sm font-medium text-slate-900">Persistence and outcomes</span>
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
                value={inputs.annual_effect_decay_rate}
                onChange={(value) => updateInput("annual_effect_decay_rate", value)}
                min={0}
                max={0.5}
                step={0.01}
                display={formatPercent(inputs.annual_effect_decay_rate)}
              />
              <SliderInput
                label="Annual participation drop-off"
                value={inputs.annual_participation_dropoff_rate}
                onChange={(value) => updateInput("annual_participation_dropoff_rate", value)}
                min={0}
                max={0.5}
                step={0.01}
                display={formatPercent(inputs.annual_participation_dropoff_rate)}
              />
              <NumberInput
                label="QALY gain per event avoided"
                value={inputs.qaly_gain_per_event_avoided}
                onChange={(value) => updateInput("qaly_gain_per_event_avoided", value)}
                step={0.01}
              />
              <SelectInput
                label="Comparator"
                value={comparatorMode}
                options={COMPARATOR_OPTIONS as readonly ComparatorOption[]}
                onChange={(value) => setComparatorMode(value)}
                help="Use this to compare the current case with a nearby alternative framing."
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
            note={meta.description}
          />
        );
      })}
    </div>
  );

  const sensitivityTop3 = (
    <div className="grid gap-3 md:grid-cols-3">
      {topDrivers.map((driver, index) => (
        <AssumptionReviewCard
          key={driver.parameter_key}
          label={`Driver ${index + 1}`}
          value={driver.parameter_label}
          note={`Largest ICER swing: ${formatCurrency(driver.max_abs_icer_change)}`}
        />
      ))}
    </div>
  );

  const mobileCharts = (
    <div className="space-y-4 lg:hidden">
      <EventsByYearChart yearlyResults={results.yearly_results} />

      <MobileAccordion title="Cost vs savings">
        <CostVsSavingsChart yearlyResults={results.yearly_results} />
      </MobileAccordion>

      <MobileAccordion title="Clinical impact">
        <ImpactChart results={results} />
      </MobileAccordion>

      <MobileAccordion title="Bounded uncertainty">
        <BoundedUncertaintyChart
          uncertaintyRows={uncertainty}
          threshold={inputs.cost_effectiveness_threshold}
        />
      </MobileAccordion>

      <MobileAccordion title="One-way sensitivity">
        <TornadoSensitivityChart sensitivity={sensitivity} />
      </MobileAccordion>
    </div>
  );

  const desktopCharts = (
    <div className="space-y-4">
      <EventsByYearChart yearlyResults={results.yearly_results} />
      <CostVsSavingsChart yearlyResults={results.yearly_results} />
      <ImpactChart results={results} />
      <BoundedUncertaintyChart
        uncertaintyRows={uncertainty}
        threshold={inputs.cost_effectiveness_threshold}
      />
      <TornadoSensitivityChart sensitivity={sensitivity} />
    </div>
  );

  const comparatorSummary = (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <AssumptionReviewCard label="Comparator" value={comparatorMode} />
      <AssumptionReviewCard
        label="Events avoided delta"
        value={formatNumber(comparatorResults.events_avoided_total - results.events_avoided_total)}
      />
      <AssumptionReviewCard
        label="Admissions avoided delta"
        value={formatNumber(comparatorResults.admissions_avoided_total - results.admissions_avoided_total)}
      />
      <AssumptionReviewCard
        label="Discounted net cost delta"
        value={formatCurrency(
          comparatorResults.discounted_net_cost_total - results.discounted_net_cost_total,
        )}
      />
    </div>
  );

  const recommendationPanel = (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      <MiniInsight label="Case type" value={currentCaseType} />
      <MiniInsight
        label="What this suggests"
        value={recommendationSummary.current_case_suggests}
      />
      <MiniInsight
        label="What is driving it"
        value={recommendationSummary.driving_result}
      />
      <MiniInsight
        label="What looks fragile"
        value={recommendationSummary.fragile_point}
      />
      <MiniInsight
        label="Validate next"
        value={recommendationSummary.validate_next}
      />
    </div>
  );

  const analysisMetricsMobile = (
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
    </div>
  );

  const analysisMetricsDesktop = (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-5 lg:mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
          Health Economics Scenario Lab
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          StableHeart
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
          Explore how proactive cardiovascular management in high-risk or secondary
          prevention populations might reduce recurrent events, hospital use, and value risk.
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

      <div className="mb-4 lg:hidden">
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
            description="Apply a workshop preset first, then fine-tune the case."
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
                <p className="mb-3 text-sm font-semibold text-slate-900">Quick assumptions</p>
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

                {showAdvancedMobile ? <div className="mt-4">{advancedSections}</div> : null}
              </div>
            </div>
          </SectionCard>
        </div>

        <div className={cx(mobileTab !== "analysis" && "hidden")}>
          <SectionCard
            title="Analysis"
            description="Review the current case, recommendation readout, comparator snapshot, and the next checks."
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
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <FileDown className="h-4 w-4" />
                    Export report
                  </button>
                </div>
              </div>

              {analysisMetricsMobile}

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Recommendation summary</h3>
                <div className="mt-3">{recommendationPanel}</div>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {recommendationSummary.recommendation_line}
                </p>
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Threshold readout</h3>
                <div className="mt-3 grid gap-3">
                  <AssumptionReviewCard
                    label="Break-even cost per patient"
                    value={formatCurrency(results.break_even_cost_per_patient)}
                  />
                  <AssumptionReviewCard
                    label="Required risk reduction"
                    value={formatPercent(results.break_even_risk_reduction_required)}
                  />
                  <AssumptionReviewCard
                    label="Break-even horizon"
                    value={results.break_even_horizon}
                  />
                  <AssumptionReviewCard
                    label="Required baseline event rate"
                    value={formatPercent(results.break_even_baseline_event_rate_required)}
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
                      note={`${formatNumber(row.events_avoided_total)} events avoided · ${row.decision_status}`}
                    />
                  ))}
                </div>
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Top sensitivity drivers</h3>
                <div className="mt-3">
                  {sensitivityTop3}
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

            <div className="mt-3 grid gap-3 lg:grid-cols-4">
              <MetricCard label="Bed days avoided" value={formatNumber(results.bed_days_avoided_total)} />
              <MetricCard label="Patients reached" value={formatNumber(results.patients_reached_total)} />
              <MetricCard label="Programme cost" value={formatCurrency(results.programme_cost_total)} />
              <MetricCard label="Gross savings" value={formatCurrency(results.gross_savings_total)} />
            </div>

            <div className="mt-4">{interpretationPanel}</div>

            <div className="mt-4 grid gap-3 xl:grid-cols-4">
              <MetricCard label="Return on spend" value={formatRatio(results.roi)} />
              <MetricCard
                label="Break-even cost per patient"
                value={formatCurrency(results.break_even_cost_per_patient)}
              />
              <MetricCard
                label="Required risk reduction"
                value={formatPercent(results.break_even_risk_reduction_required)}
              />
              <MetricCard
                label="Required baseline event rate"
                value={formatPercent(results.break_even_baseline_event_rate_required)}
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
            description="Apply a workshop preset first, then fine-tune the case."
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
                <p className="mb-3 text-sm font-semibold text-slate-900">Quick assumptions</p>
                {quickAssumptionNotice}
                <div className="mt-4">{assumptionsQuick}</div>
              </div>

              <div className={SUBCARD}>
                <p className="mb-3 text-sm font-semibold text-slate-900">Advanced assumptions</p>
                {advancedSections}
              </div>
            </div>
          </SectionCard>
        </div>

        <div className={cx(mobileTab !== "analysis" && "hidden")}>
          <SectionCard
            title="Analysis"
            description="Review the current case, recommendation readout, comparator snapshot, and the next checks."
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
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <FileDown className="h-4 w-4" />
                    Export report
                  </button>
                </div>
              </div>

              {analysisMetricsDesktop}

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Recommendation summary</h3>
                <div className="mt-3">{recommendationPanel}</div>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {recommendationSummary.recommendation_line}
                </p>
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Threshold readout</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-4">
                  <AssumptionReviewCard
                    label="Break-even cost per patient"
                    value={formatCurrency(results.break_even_cost_per_patient)}
                  />
                  <AssumptionReviewCard
                    label="Required risk reduction"
                    value={formatPercent(results.break_even_risk_reduction_required)}
                  />
                  <AssumptionReviewCard
                    label="Break-even horizon"
                    value={results.break_even_horizon}
                  />
                  <AssumptionReviewCard
                    label="Required baseline event rate"
                    value={formatPercent(results.break_even_baseline_event_rate_required)}
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
                      note={`${formatNumber(row.events_avoided_total)} events avoided · ${row.decision_status}`}
                    />
                  ))}
                </div>
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Top sensitivity drivers</h3>
                <div className="mt-3">{sensitivityTop3}</div>
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