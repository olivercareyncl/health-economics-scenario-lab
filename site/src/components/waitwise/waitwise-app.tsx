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
import {
  DEFAULT_INPUTS,
  COSTING_METHOD_OPTIONS,
  TARGETING_MODE_OPTIONS,
} from "@/lib/waitwise/defaults";
import {
  runModel,
  runBoundedUncertainty,
} from "@/lib/waitwise/calculations";
import {
  getDecisionStatus,
  getNetCostLabel,
  getMainDriverText,
  generateInterpretation,
  assessUncertaintyRobustness,
} from "@/lib/waitwise/summaries";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatRatio,
} from "@/lib/waitwise/formatters";
import {
  buildBacklogReductionChartData,
  buildCumulativeCostChartData,
  buildImpactBarChartData,
  buildUncertaintyChartData,
  compactCurrencyAxis,
} from "@/lib/waitwise/charts";
import type {
  Inputs,
  CostingMethod,
  TargetingMode,
  ModelResults,
  UncertaintyRow,
  YearlyResultRow,
} from "@/lib/waitwise/types";

type MobileTab = "summary" | "assumptions" | "analysis";

type AssumptionSectionKey =
  | "advanced-delivery"
  | "advanced-pathway"
  | "advanced-economics";

const PANEL_SHELL =
  "rounded-[26px] border border-slate-200 bg-slate-50 p-4 sm:p-5 lg:p-5 xl:p-6";
const SUBCARD =
  "rounded-2xl border border-slate-200 bg-white p-4 lg:p-4 xl:p-5";
const SUBCARD_DENSE =
  "rounded-2xl border border-slate-200 bg-white p-3.5 lg:p-4";
const SECTION_KICKER =
  "text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500";
const SECTION_TITLE =
  "mt-1 text-lg font-semibold tracking-tight text-slate-950 lg:text-[1.1rem]";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
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

function WaitingListReductionChart({
  yearlyResults,
}: {
  yearlyResults: YearlyResultRow[];
}) {
  const data = buildBacklogReductionChartData(yearlyResults);

  return (
    <div className={SUBCARD}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 lg:text-base">
          Waiting list reduction by year
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 lg:text-sm">
          Annual reduction in backlog pressure across the selected horizon.
        </p>
      </div>

      <div className="h-56 w-full lg:h-64 xl:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="year" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis
              dataKey="waitingListReduction"
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
          Programme cost vs savings
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 lg:text-sm">
          Cumulative delivery cost compared with gross savings.
        </p>
      </div>

      <div className="h-56 w-full lg:h-64 xl:h-72">
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
  const data = buildImpactBarChartData(results);

  return (
    <div className={SUBCARD}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 lg:text-base">
          Total pathway impact
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 lg:text-sm">
          Headline operational impact over the selected horizon.
        </p>
      </div>

      <div className="h-56 w-full lg:h-64 xl:h-72">
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

      <div className="h-60 w-full lg:h-64 xl:h-72">
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
        onClick={() => setOpen((value) => !value)}
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

function DesktopResultRail({
  decisionStatus,
  netCostLabel,
  netCostValue,
  costPerQaly,
  waitingListReduction,
  escalationsAvoided,
  interpretation,
  mainDriver,
}: {
  decisionStatus: string;
  netCostLabel: string;
  netCostValue: string;
  costPerQaly: string;
  waitingListReduction: string;
  escalationsAvoided: string;
  interpretation: {
    what_model_suggests: string;
    what_drives_result: string;
    what_looks_fragile: string;
    what_to_validate_next: string;
  };
  mainDriver: string;
}) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-6 space-y-4">
        <div className={PANEL_SHELL}>
          <p className={SECTION_KICKER}>Decision signal</p>
          <div className="mt-3 flex items-start justify-between gap-3">
            <div
              className={cx(
                "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                decisionStatus === "Appears cost-saving" &&
                  "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
                decisionStatus === "Appears cost-effective" &&
                  "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
                decisionStatus === "Above current threshold" &&
                  "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
              )}
            >
              {decisionStatus}
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <MetricCard label={netCostLabel} value={netCostValue} />
            <MetricCard
              label="Discounted cost per QALY"
              value={costPerQaly}
              tone="strong"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <MetricCard label="Waiting list reduction" value={waitingListReduction} />
            <MetricCard label="Escalations avoided" value={escalationsAvoided} />
          </div>
        </div>

        <div className={PANEL_SHELL}>
          <p className={SECTION_KICKER}>Analyst readout</p>
          <h2 className={SECTION_TITLE}>Current interpretation</h2>

          <div className="mt-4 space-y-3">
            <MiniInsight
              label="Conclusion"
              value={interpretation.what_model_suggests}
            />
            <MiniInsight
              label="Main driver"
              value={`The result is currently most shaped by ${mainDriver}.`}
            />
            <MiniInsight
              label="Fragility"
              value={interpretation.what_looks_fragile}
            />
            <MiniInsight
              label="Validate next"
              value={interpretation.what_to_validate_next}
            />
          </div>
        </div>
      </div>
    </aside>
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

  const uncertaintyReadout = useMemo(
    () => assessUncertaintyRobustness(uncertainty, inputs.cost_effectiveness_threshold),
    [uncertainty, inputs.cost_effectiveness_threshold],
  );

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
        value={formatCurrency(Math.abs(results.discounted_net_cost_total))}
      />
      <MetricCard
        label="Discounted cost per QALY"
        value={formatCurrency(results.discounted_cost_per_qaly)}
        tone="strong"
      />
    </div>
  );

  const secondaryMetrics = (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
  );

  const interpretationPanel = (
    <div className="grid gap-3 lg:grid-cols-3">
      <MiniInsight
        label="What the model suggests"
        value={interpretation.what_model_suggests}
      />
      <MiniInsight
        label="What is driving it"
        value={`The result is currently most shaped by ${mainDriver}.`}
      />
      <MiniInsight
        label="What looks fragile"
        value={interpretation.what_looks_fragile}
      />
    </div>
  );

  const assumptionsQuick = (
    <div className="grid gap-4 lg:gap-3 xl:grid-cols-2">
      <SelectInput<TargetingMode>
        label="Targeting mode"
        value={inputs.targeting_mode}
        options={TARGETING_MODE_OPTIONS}
        onChange={(value) => updateInput("targeting_mode", value)}
        help="Primary lever for where value is concentrated."
      />

      <SelectInput<CostingMethod>
        label="Costing method"
        value={inputs.costing_method}
        options={COSTING_METHOD_OPTIONS}
        onChange={(value) => updateInput("costing_method", value)}
        help="Defines how avoided pressure is valued."
      />

      <NumberInput
        label="Starting waiting list"
        value={inputs.starting_waiting_list_size}
        onChange={(value) => updateInput("starting_waiting_list_size", value)}
        step={100}
        help="Baseline backlog size."
      />

      <NumberInput
        label="Monthly inflow"
        value={inputs.monthly_inflow}
        onChange={(value) => updateInput("monthly_inflow", value)}
        step={25}
        help="New demand entering the list each month."
      />

      <NumberInput
        label="Baseline throughput"
        value={inputs.baseline_monthly_throughput}
        onChange={(value) => updateInput("baseline_monthly_throughput", value)}
        step={25}
        help="Patients processed per month before intervention."
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

      <SliderInput
        label="Demand reduction"
        value={inputs.demand_reduction_effect}
        onChange={(value) => updateInput("demand_reduction_effect", value)}
        min={0}
        max={0.5}
        step={0.01}
        display={formatPercent(inputs.demand_reduction_effect)}
        help="Reduces incoming demand pressure."
      />

      <SliderInput
        label="Throughput increase"
        value={inputs.throughput_increase_effect}
        onChange={(value) => updateInput("throughput_increase_effect", value)}
        min={0}
        max={0.5}
        step={0.01}
        display={formatPercent(inputs.throughput_increase_effect)}
        help="Improves processing capacity."
      />

      <SliderInput
        label="Escalation reduction"
        value={inputs.escalation_reduction_effect}
        onChange={(value) => updateInput("escalation_reduction_effect", value)}
        min={0}
        max={0.5}
        step={0.01}
        display={formatPercent(inputs.escalation_reduction_effect)}
        help="Reduces deterioration while waiting."
      />

      <NumberInput
        label="Cost per patient reached"
        value={inputs.intervention_cost_per_patient_reached}
        onChange={(value) =>
          updateInput("intervention_cost_per_patient_reached", value)
        }
        step={10}
        help="Main delivery cost lever."
      />

      <SelectInput<"1" | "3" | "5">
        label="Time horizon"
        value={String(inputs.time_horizon_years) as "1" | "3" | "5"}
        options={["1", "3", "5"]}
        onChange={(value) =>
          updateInput("time_horizon_years", Number(value) as 1 | 3 | 5)
        }
        help="Longer horizons often strengthen the case."
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
            Delivery persistence
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
              <SliderInput
                label="Annual effect decay"
                value={inputs.effect_decay_rate}
                onChange={(value) => updateInput("effect_decay_rate", value)}
                min={0}
                max={0.5}
                step={0.01}
                display={formatPercent(inputs.effect_decay_rate)}
                help="Annual weakening of intervention effect."
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
                help="Annual loss of effective reach."
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
              <NumberInput
                label="Average wait duration proxy"
                value={inputs.average_wait_duration_months}
                onChange={(value) => updateInput("average_wait_duration_months", value)}
                step={0.5}
                help="Contextual input for pathway framing."
              />
              <SliderInput
                label="Monthly escalation rate"
                value={inputs.monthly_escalation_rate}
                onChange={(value) => updateInput("monthly_escalation_rate", value)}
                min={0}
                max={0.2}
                step={0.005}
                display={formatPercent(inputs.monthly_escalation_rate)}
                help="Share of the list escalating each month."
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
                help="Share of escalations leading to admission."
              />
              <NumberInput
                label="Average length of stay"
                value={inputs.average_length_of_stay}
                onChange={(value) => updateInput("average_length_of_stay", value)}
                step={0.5}
                help="Average days per admission."
              />
              <div className="xl:col-span-2">
                <NumberInput
                  label="QALY gain per escalation avoided"
                  value={inputs.qaly_gain_per_escalation_avoided}
                  onChange={(value) =>
                    updateInput("qaly_gain_per_escalation_avoided", value)
                  }
                  step={0.01}
                  help="Health gain used in the economic case."
                />
              </div>
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
            Cost inputs
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
        label="Targeting mode"
        value={inputs.targeting_mode}
        note="Defines who is reached and how concentrated escalation risk becomes."
      />
      <AssumptionReviewCard
        label="Costing method"
        value={inputs.costing_method}
      />
      <AssumptionReviewCard
        label="Starting waiting list"
        value={formatNumber(inputs.starting_waiting_list_size)}
      />
      <AssumptionReviewCard
        label="Monthly inflow"
        value={formatNumber(inputs.monthly_inflow)}
      />
      <AssumptionReviewCard
        label="Baseline throughput"
        value={formatNumber(inputs.baseline_monthly_throughput)}
      />
      <AssumptionReviewCard
        label="Intervention reach"
        value={formatPercent(inputs.intervention_reach_rate)}
      />
      <AssumptionReviewCard
        label="Demand reduction"
        value={formatPercent(inputs.demand_reduction_effect)}
      />
      <AssumptionReviewCard
        label="Throughput increase"
        value={formatPercent(inputs.throughput_increase_effect)}
      />
      <AssumptionReviewCard
        label="Escalation reduction"
        value={formatPercent(inputs.escalation_reduction_effect)}
      />
      <AssumptionReviewCard
        label="Cost per patient"
        value={formatCurrency(inputs.intervention_cost_per_patient_reached)}
      />
      <AssumptionReviewCard
        label="Time horizon"
        value={`${inputs.time_horizon_years} year${inputs.time_horizon_years === 1 ? "" : "s"}`}
      />
      <AssumptionReviewCard
        label="Threshold"
        value={formatCurrency(inputs.cost_effectiveness_threshold)}
      />
    </div>
  );

  const mobileCharts = (
    <div className="space-y-4 lg:hidden">
      <WaitingListReductionChart yearlyResults={results.yearly_results} />

      <MobileAccordion title="Programme cost vs savings">
        <CostVsSavingsChart yearlyResults={results.yearly_results} />
      </MobileAccordion>

      <MobileAccordion title="Total pathway impact">
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
          escalations, admissions, bed use, and economic burden under different assumptions.
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

      <div className="lg:hidden">
        <div className={cx(mobileTab !== "summary" && "hidden")}>
          <SectionCard
            title="Headline view"
            description="Start with the current decision signal and the main economic outputs."
            dense
          >
            {summaryMetrics}
            <div className="mt-3">{secondaryMetrics}</div>
            <div className="mt-4">{interpretationPanel}</div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <MetricCard
                label="Return on spend"
                value={formatRatio(results.roi)}
              />
              <MetricCard
                label="Break-even cost per patient"
                value={formatCurrency(results.break_even_cost_per_patient)}
              />
              <MetricCard
                label="Required intervention effect"
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
              {mobileCharts}
            </SectionCard>
          </div>
        </div>

        <div className={cx(mobileTab !== "assumptions" && "hidden")}>
          <SectionCard
            title="Assumptions"
            description="Quick assumptions first. Advanced settings stay available below."
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
                <p className="mb-4 text-sm font-semibold text-slate-900">
                  Quick assumptions
                </p>
                {assumptionsQuick}
              </div>

              <div className={SUBCARD}>
                <button
                  type="button"
                  onClick={() => setShowAdvancedMobile((value) => !value)}
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
            description="Review the current assumption set and the bounded uncertainty around the case."
            dense
          >
            <div className="space-y-5">
              <div>
                <h3 className={SECTION_KICKER}>Assumption review</h3>
                <div className="mt-3">{assumptionsReview}</div>
              </div>

              <div>
                <h3 className={SECTION_KICKER}>Uncertainty readout</h3>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {uncertainty.map((row) => (
                    <AssumptionReviewCard
                      key={row.case}
                      label={row.case}
                      value={formatCurrency(row.discounted_cost_per_qaly)}
                      note={`${formatNumber(row.waiting_list_reduction_total)} waiting list reduction · ${row.decision_status}`}
                    />
                  ))}
                </div>
              </div>

              <div className={SUBCARD}>
                <h3 className={SECTION_KICKER}>Interpretation</h3>
                <div className="mt-3 space-y-2.5 text-sm leading-6 text-slate-700">
                  <p>{interpretation.what_model_suggests}</p>
                  <p>{interpretation.what_drives_result}</p>
                  <p>{interpretation.what_to_validate_next}</p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-5 xl:grid-cols-[minmax(0,1fr)_380px] xl:gap-6">
        <main className="min-w-0 space-y-5">
          <SectionCard
            title="Headline view"
            description="A compact summary of the current conclusion, economic position, and the most important interpretation."
            dense
          >
            {summaryMetrics}
            <div className="mt-3">{secondaryMetrics}</div>
            <div className="mt-4">{interpretationPanel}</div>

            <div className="mt-4 grid gap-3 xl:grid-cols-3">
              <MetricCard
                label="Return on spend"
                value={formatRatio(results.roi)}
              />
              <MetricCard
                label="Break-even cost per patient"
                value={formatCurrency(results.break_even_cost_per_patient)}
              />
              <MetricCard
                label="Required intervention effect"
                value={formatPercent(results.break_even_effect_required)}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Charts"
            description="Use the charts to compare backlog trajectory, economics, impact, and bounded sensitivity at a glance."
            dense
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <WaitingListReductionChart yearlyResults={results.yearly_results} />
              <CostVsSavingsChart yearlyResults={results.yearly_results} />
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <PathwayImpactChart results={results} />
              <BoundedUncertaintyChart
                uncertaintyRows={uncertainty}
                threshold={inputs.cost_effectiveness_threshold}
              />
            </div>
          </SectionCard>

          <SectionCard
            title="Analysis"
            description="A structured readout of the current assumption set, bounded cases, and what should be validated next."
            dense
          >
            <div className="space-y-5">
              <div>
                <h3 className={SECTION_KICKER}>Assumption review</h3>
                <div className="mt-3">{assumptionsReview}</div>
              </div>

              <div>
                <h3 className={SECTION_KICKER}>Uncertainty readout</h3>
                <div className="mt-3 grid gap-3 xl:grid-cols-3">
                  {uncertainty.map((row) => (
                    <AssumptionReviewCard
                      key={row.case}
                      label={row.case}
                      value={formatCurrency(row.discounted_cost_per_qaly)}
                      note={`${formatNumber(row.waiting_list_reduction_total)} waiting list reduction · ${row.decision_status}`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-3 xl:grid-cols-2">
                <div className={SUBCARD}>
                  <p className={SECTION_KICKER}>Decision narrative</p>
                  <div className="mt-3 space-y-2.5 text-sm leading-6 text-slate-700">
                    <p>{interpretation.what_model_suggests}</p>
                    <p>{interpretation.what_drives_result}</p>
                    <p>{uncertaintyReadout}</p>
                  </div>
                </div>

                <div className={SUBCARD}>
                  <p className={SECTION_KICKER}>Validation note</p>
                  <div className="mt-3 space-y-2.5 text-sm leading-6 text-slate-700">
                    <p>{interpretation.what_looks_fragile}</p>
                    <p>{interpretation.what_to_validate_next}</p>
                    <p>
                      Break-even horizon:{" "}
                      <span className="font-medium text-slate-900">
                        {results.break_even_horizon}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </main>

        <DesktopResultRail
          decisionStatus={decisionStatus}
          netCostLabel={netCostLabel}
          netCostValue={formatCurrency(Math.abs(results.discounted_net_cost_total))}
          costPerQaly={formatCurrency(results.discounted_cost_per_qaly)}
          waitingListReduction={formatNumber(results.waiting_list_reduction_total)}
          escalationsAvoided={formatNumber(results.escalations_avoided_total)}
          interpretation={interpretation}
          mainDriver={mainDriver}
        />

        <aside className="hidden lg:block lg:col-start-2 lg:row-start-1 lg:mt-[430px] xl:mt-[446px]">
          <div className="sticky top-[360px] space-y-4">
            <SectionCard
              title="Assumptions"
              description="Adjust the main levers here while keeping the current decision signal in view."
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
                  <p className={SECTION_KICKER}>Quick assumptions</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    These are the main levers most likely to change the result.
                  </p>
                  <div className="mt-4">{assumptionsQuick}</div>
                </div>

                <div className={SUBCARD}>
                  <p className={SECTION_KICKER}>Advanced assumptions</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Use these for deeper scenario testing once the main view is stable.
                  </p>
                  <div className="mt-4">{advancedSections}</div>
                </div>
              </div>
            </SectionCard>
          </div>
        </aside>
      </div>
    </div>
  );
}