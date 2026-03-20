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
  buildComparatorDeltaChartData,
  buildCumulativeCostChartData,
  buildImpactBarChartData,
  buildPathwayShiftChartData,
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
  SCENARIO_MAP,
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
  Inputs,
  MobileTab,
  ModelResults,
  ScenarioComparisonRow,
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
const SECTION_TITLE =
  "mt-1 text-lg font-semibold tracking-tight text-slate-950 lg:text-[1.1rem]";
const SECTION_BODY = "text-sm leading-6 text-slate-700";

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

function ImpactChart({ results }: { results: ModelResults }) {
  const data = buildImpactBarChartData(results);

  return (
    <div className={SUBCARD}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 lg:text-base">
          Pathway impact
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 lg:text-sm">
          Headline activity and operational impact over the selected horizon.
        </p>
      </div>

      <div className="h-56 w-full overflow-x-auto lg:h-64 xl:h-72">
        <div className="h-full min-w-[560px] sm:min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
              barCategoryGap={18}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                interval={0}
                angle={-18}
                textAnchor="end"
                height={56}
              />
              <YAxis
                tickFormatter={(value) => formatNumber(Number(value))}
                tickLine={false}
                axisLine={false}
                fontSize={12}
                width={56}
              />
              <Tooltip content={<NumberTooltip />} />
              <Bar dataKey="value" name="Impact" radius={[8, 8, 0, 0]} maxBarSize={56} />
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
  const data = uncertaintyRows.map((row) => ({
    case: row.case,
    discountedCostPerQaly: row.discounted_cost_per_qaly,
  }));

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

function ComparatorDeltaChart({
  baseResults,
  comparatorResults,
  comparatorLabel,
}: {
  baseResults: ModelResults;
  comparatorResults: ModelResults;
  comparatorLabel: string;
}) {
  const data = buildComparatorDeltaChartData(baseResults, comparatorResults).map(
    (row) => ({
      label: row.label,
      delta: row.delta,
      isCurrency: row.isCurrency,
    }),
  );

  return (
    <div className={SUBCARD}>
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-slate-900 lg:text-base">
          Comparator deltas
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-600 lg:text-sm">
          Current selection versus {comparatorLabel.toLowerCase()}.
        </p>
      </div>

      <div className="h-56 w-full overflow-x-auto lg:h-64">
        <div className="h-full min-w-[560px] sm:min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                interval={0}
                angle={-18}
                textAnchor="end"
                height={56}
              />
              <YAxis
                tickFormatter={(value) => {
                  const numeric = Number(value);
                  if (Math.abs(numeric) >= 1000) {
                    return `£${(numeric / 1000).toFixed(0)}k`;
                  }
                  return `${numeric.toFixed(0)}`;
                }}
                tickLine={false}
                axisLine={false}
                fontSize={12}
                width={58}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const row = data.find((item) => item.label === label);
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
              <ReferenceLine y={0} stroke="#cbd5e1" />
              <Bar dataKey="delta" radius={[8, 8, 0, 0]}>
                {data.map((entry) => (
                  <Cell
                    key={entry.label}
                    fill={entry.delta >= 0 ? "#94a3b8" : "#0f172a"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
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

function DesktopDecisionRail({
  decisionStatus,
  netCostLabel,
  netCostValue,
  costPerQaly,
  patientsShifted,
  admissionsAvoided,
  mainDriver,
  interpretation,
}: {
  decisionStatus: string;
  netCostLabel: string;
  netCostValue: string;
  costPerQaly: string;
  patientsShifted: string;
  admissionsAvoided: string;
  mainDriver: string;
  interpretation: {
    what_model_suggests: string;
    what_drives_result: string;
    what_looks_fragile: string;
    what_to_validate_next: string;
  };
}) {
  return (
    <div className="sticky top-6 space-y-4">
      <div className={PANEL_SHELL}>
        <p className={SECTION_KICKER}>Live result</p>
        <h2 className={SECTION_TITLE}>Current decision signal</h2>

        <div className="mt-3">
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
          <MetricCard label="Patients shifted" value={patientsShifted} />
          <MetricCard label="Admissions avoided" value={admissionsAvoided} />
        </div>
      </div>

      <div className={PANEL_SHELL}>
        <p className={SECTION_KICKER}>Analyst note</p>
        <h2 className={SECTION_TITLE}>How to read the case</h2>

        <div className="mt-4 space-y-3">
          <MiniInsight label="Conclusion" value={interpretation.what_model_suggests} />
          <MiniInsight
            label="Main driver"
            value={`The result is currently most shaped by ${mainDriver}.`}
          />
          <MiniInsight label="Fragility" value={interpretation.what_looks_fragile} />
          <MiniInsight
            label="Validate next"
            value={interpretation.what_to_validate_next}
          />
        </div>
      </div>
    </div>
  );
}

function buildAssumptionsReview(inputs: Inputs) {
  return ASSUMPTION_ORDER.map((key) => {
    const meta = ASSUMPTION_META[key];
    const rawValue = inputs[key as keyof Inputs] as never;

    return {
      key,
      label: meta.label,
      value: meta.formatter(rawValue as never),
      note: `${meta.source_type} · ${meta.confidence}`,
    };
  });
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
      cost_per_acute_managed_patient: baseInputs.cost_per_acute_managed_patient,
      cost_per_community_managed_patient: baseInputs.cost_per_community_managed_patient,
      cost_per_follow_up_contact: baseInputs.cost_per_follow_up_contact,
      cost_per_admission: baseInputs.cost_per_admission,
      cost_per_bed_day: baseInputs.cost_per_bed_day,
      qaly_gain_per_patient_improved: baseInputs.qaly_gain_per_patient_improved,
      cost_effectiveness_threshold: baseInputs.cost_effectiveness_threshold,
    };

    const scenarioResults = runModel(scenarioInputs);

    return {
      scenario: scenarioName,
      targeting: scenarioInputs.targeting_mode,
      patients_shifted_in_pathway: scenarioResults.patients_shifted_total,
      admissions_avoided: scenarioResults.admissions_avoided_total,
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

export default function PathShiftApp() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS);
  const [mobileTab, setMobileTab] = useState<MobileTab>("summary");
  const [showAdvancedMobile, setShowAdvancedMobile] = useState(false);
  const [showAssumptionsReviewMobile, setShowAssumptionsReviewMobile] =
    useState(false);
  const [openSections, setOpenSections] = useState<
    Record<AssumptionSectionKey, boolean>
  >({
    "advanced-pathway": false,
    "advanced-costs": false,
    "advanced-outcomes": false,
  });
  const [comparatorMode, setComparatorMode] =
    useState<ComparatorOption>("Follow-up reduction focus");

  const results = useMemo(() => runModel(inputs), [inputs]);
  const uncertainty = useMemo(() => runBoundedUncertainty(inputs), [inputs]);
  const comparatorInputs = useMemo(
    () => buildComparatorCase(DEFAULT_INPUTS, inputs, comparatorMode),
    [inputs, comparatorMode],
  );
  const comparatorResults = useMemo(
    () => runModel(comparatorInputs),
    [comparatorInputs],
  );
  const scenarios = useMemo(
    () => buildScenarioComparison(DEFAULT_INPUTS, inputs),
    [inputs],
  );

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
  const assumptionsReviewRows = useMemo(
    () => buildAssumptionsReview(inputs),
    [inputs],
  );

  const updateInput = <K extends keyof Inputs>(key: K, value: Inputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const resetToBaseCase = () => {
    setInputs({ ...DEFAULT_INPUTS });
    setShowAdvancedMobile(false);
    setShowAssumptionsReviewMobile(false);
    setOpenSections({
      "advanced-pathway": false,
      "advanced-costs": false,
      "advanced-outcomes": false,
    });
    setComparatorMode("Follow-up reduction focus");
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

  const desktopSecondaryMetrics = (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
  );

  const interpretationPanel = (
    <div className="grid gap-3 lg:grid-cols-3">
      <MiniInsight label="Conclusion" value={interpretation.what_model_suggests} />
      <MiniInsight
        label="Main driver"
        value={`The result is currently most shaped by ${mainDriver}.`}
      />
      <MiniInsight label="Fragility" value={interpretation.what_looks_fragile} />
    </div>
  );

  const quickAssumptionNotice = (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-600">
      These are the levers most likely to change the decision signal.
    </div>
  );

  const assumptionsQuick = (
    <div className="grid gap-4 lg:gap-3 xl:grid-cols-2">
      <SelectInput
        label="Targeting mode"
        value={inputs.targeting_mode}
        options={TARGETING_MODE_OPTIONS}
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
        help="Share of the cohort effectively reached."
      />

      <NumberInput
        label="Redesign cost per patient"
        value={inputs.redesign_cost_per_patient}
        onChange={(value) => updateInput("redesign_cost_per_patient", value)}
        step={10}
        help="Main implementation cost lever."
      />

      <SliderInput
        label="Care setting shift"
        value={inputs.proportion_shifted_to_lower_cost_setting}
        onChange={(value) =>
          updateInput("proportion_shifted_to_lower_cost_setting", value)
        }
        min={0}
        max={0.8}
        step={0.01}
        display={formatPercent(inputs.proportion_shifted_to_lower_cost_setting)}
        help="Share shifted to a lower-cost setting."
      />

      <SliderInput
        label="Admission reduction"
        value={inputs.reduction_in_admission_rate}
        onChange={(value) => updateInput("reduction_in_admission_rate", value)}
        min={0}
        max={0.5}
        step={0.01}
        display={formatPercent(inputs.reduction_in_admission_rate)}
        help="Reduces admission burden."
      />

      <SliderInput
        label="Follow-up reduction"
        value={inputs.reduction_in_follow_up_contacts}
        onChange={(value) => updateInput("reduction_in_follow_up_contacts", value)}
        min={0}
        max={0.7}
        step={0.01}
        display={formatPercent(inputs.reduction_in_follow_up_contacts)}
        help="Reduces follow-up activity."
      />

      <SliderInput
        label="Length of stay reduction"
        value={inputs.reduction_in_length_of_stay}
        onChange={(value) => updateInput("reduction_in_length_of_stay", value)}
        min={0}
        max={0.5}
        step={0.01}
        display={formatPercent(inputs.reduction_in_length_of_stay)}
        help="Reduces bed-day use."
      />

      <div className="xl:col-span-2">
        <SelectInput
          label="Time horizon"
          value={String(inputs.time_horizon_years) as "1" | "3" | "5"}
          options={["1", "3", "5"]}
          onChange={(value) =>
            updateInput("time_horizon_years", Number(value) as 1 | 3 | 5)
          }
          help="Longer horizons can strengthen the case."
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
            Pathway and delivery
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
              />
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
                label="Follow-up contacts per patient"
                value={inputs.current_follow_up_contacts_per_patient}
                onChange={(value) =>
                  updateInput("current_follow_up_contacts_per_patient", value)
                }
                step={0.1}
              />
              <NumberInput
                label="Average length of stay"
                value={inputs.current_average_length_of_stay}
                onChange={(value) =>
                  updateInput("current_average_length_of_stay", value)
                }
                step={0.5}
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
                label="Annual implementation drop-off"
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
                options={COSTING_METHOD_OPTIONS}
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

      <div className="overflow-hidden rounded-2xl border border-slate-