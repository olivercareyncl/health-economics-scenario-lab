"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  RotateCcw,
  ChevronDown,
  SlidersHorizontal,
  BarChart3,
  FileSearch,
  Link2,
  Check,
  Download,
  Image as ImageIcon,
  FileDown,
} from "lucide-react";
import {
  runModel,
  runBoundedUncertainty,
  getDecisionStatus,
  getNetCostLabel,
  getMainDriverText,
  generateInterpretation,
} from "@/lib/safestep/model";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from "@/lib/safestep/formatters";
import {
  DEFAULT_INPUTS,
  COSTING_METHOD_OPTIONS,
  TARGETING_MODE_OPTIONS,
} from "@/lib/safestep/constants";
import {
  CostVsSavingsChart,
  FallsAvoidedChart,
  BoundedUncertaintyChart,
} from "@/components/safestep/safestep-charts";

type Inputs = typeof DEFAULT_INPUTS;
type MobileTab = "summary" | "assumptions" | "analysis";

type AssumptionSectionKey =
  | "quick"
  | "advanced-delivery"
  | "advanced-risk"
  | "advanced-economics";

type ScenarioPatch = Partial<Inputs>;

type SensitivityRow = {
  key: keyof Inputs;
  label: string;
  baselineValue: number | string;
  testValue: number | string;
  deltaCostPerQaly: number;
  absoluteImpact: number;
  direction: "improves" | "worsens" | "neutral";
  decisionFlip: boolean;
  note: string;
};

const SCENARIO_QUERY_KEY = "s";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function roundNumber(value: number, decimals = 6) {
  return Number(value.toFixed(decimals));
}

function buildScenarioPatch(inputs: Inputs): ScenarioPatch {
  const patch: ScenarioPatch = {};

  (Object.keys(DEFAULT_INPUTS) as Array<keyof Inputs>).forEach((key) => {
    const baseValue = DEFAULT_INPUTS[key];
    const currentValue = inputs[key];

    if (typeof baseValue === "number" && typeof currentValue === "number") {
      if (roundNumber(baseValue) !== roundNumber(currentValue)) {
        patch[key] = currentValue;
      }
      return;
    }

    if (baseValue !== currentValue) {
      patch[key] = currentValue;
    }
  });

  return patch;
}

function encodeScenario(inputs: Inputs): string {
  const patch = buildScenarioPatch(inputs);
  const json = JSON.stringify(patch);

  if (typeof window === "undefined") return "";

  return window
    .btoa(encodeURIComponent(json))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeScenario(value: string): ScenarioPatch | null {
  if (!value || typeof window === "undefined") return null;

  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const normalized = padded + "=".repeat((4 - (padded.length % 4)) % 4);
    const decoded = decodeURIComponent(window.atob(normalized));
    const parsed = JSON.parse(decoded) as ScenarioPatch;
    return parsed;
  } catch {
    return null;
  }
}

function applyScenarioPatch(patch: ScenarioPatch): Inputs {
  return {
    ...DEFAULT_INPUTS,
    ...patch,
  };
}

function updateUrlForInputs(inputs: Inputs) {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  const encoded = encodeScenario(inputs);
  const hasChanges = Object.keys(buildScenarioPatch(inputs)).length > 0;

  if (hasChanges && encoded) {
    url.searchParams.set(SCENARIO_QUERY_KEY, encoded);
  } else {
    url.searchParams.delete(SCENARIO_QUERY_KEY);
  }

  window.history.replaceState({}, "", url.toString());
}

function getShareUrl(inputs: Inputs) {
  if (typeof window === "undefined") return "";

  const url = new URL(window.location.href);
  const encoded = encodeScenario(inputs);
  const hasChanges = Object.keys(buildScenarioPatch(inputs)).length > 0;

  if (hasChanges && encoded) {
    url.searchParams.set(SCENARIO_QUERY_KEY, encoded);
  } else {
    url.searchParams.delete(SCENARIO_QUERY_KEY);
  }

  return url.toString();
}

function readScenarioFromUrl(): Inputs | null {
  if (typeof window === "undefined") return null;

  const url = new URL(window.location.href);
  const encoded = url.searchParams.get(SCENARIO_QUERY_KEY);

  if (!encoded) return null;

  const patch = decodeScenario(encoded);
  if (!patch) return null;

  return applyScenarioPatch(patch);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getNumericCandidateValue(
  key: keyof Inputs,
  currentValue: number,
): number {
  switch (key) {
    case "annual_fall_risk":
    case "relative_risk_reduction":
    case "uptake_rate":
    case "adherence_rate":
    case "admission_rate_after_fall":
      return clamp(currentValue * 1.1, 0, 1);
    case "participation_dropoff_rate":
    case "effect_decay_rate":
      return clamp(currentValue * 1.15, 0, 0.5);
    case "discount_rate":
      return clamp(currentValue + 0.005, 0, 0.2);
    case "time_horizon_years":
      return currentValue === 1 ? 3 : 5;
    default:
      return Math.max(0, currentValue * 1.1);
  }
}

function getSensitivityRows(
  inputs: Inputs,
  baselineCostPerQaly: number,
  baselineDecision: string,
): SensitivityRow[] {
  const rankedKeys: Array<{
    key: keyof Inputs;
    label: string;
    note: string;
  }> = [
    {
      key: "relative_risk_reduction",
      label: "Reduction in falls",
      note: "Clinical effectiveness assumption.",
    },
    {
      key: "annual_fall_risk",
      label: "Annual fall risk",
      note: "Underlying baseline risk in the target population.",
    },
    {
      key: "intervention_cost_per_person",
      label: "Cost per participant",
      note: "Direct delivery cost of the programme.",
    },
    {
      key: "eligible_population",
      label: "Eligible population",
      note: "Changes the scale of total impact.",
    },
    {
      key: "uptake_rate",
      label: "Programme uptake",
      note: "Share of eligible population entering the pathway.",
    },
    {
      key: "adherence_rate",
      label: "Programme completion",
      note: "Affects realised benefit from the intervention.",
    },
    {
      key: "cost_per_admission",
      label: "Cost per admission",
      note: "Influences monetised avoided hospital activity.",
    },
    {
      key: "admission_rate_after_fall",
      label: "Falls leading to admission",
      note: "Links avoided falls to avoided hospital use.",
    },
  ];

  return rankedKeys
    .map(({ key, label, note }) => {
      const currentValue = inputs[key];
      if (typeof currentValue !== "number") return null;

      const testValue = getNumericCandidateValue(key, currentValue);
      if (roundNumber(testValue) === roundNumber(currentValue)) return null;

      const scenario = {
        ...inputs,
        [key]: testValue,
      } as Inputs;

      const scenarioResults = runModel(scenario);
      const scenarioDecision = getDecisionStatus(
        scenarioResults,
        scenario.cost_effectiveness_threshold,
      );
      const deltaCostPerQaly =
        scenarioResults.discounted_cost_per_qaly - baselineCostPerQaly;

      return {
        key,
        label,
        baselineValue: currentValue,
        testValue,
        deltaCostPerQaly,
        absoluteImpact: Math.abs(deltaCostPerQaly),
        direction:
          deltaCostPerQaly < 0
            ? "improves"
            : deltaCostPerQaly > 0
              ? "worsens"
              : "neutral",
        decisionFlip: scenarioDecision !== baselineDecision,
        note,
      } satisfies SensitivityRow;
    })
    .filter((row): row is SensitivityRow => Boolean(row))
    .sort((a, b) => b.absoluteImpact - a.absoluteImpact);
}

function formatSensitivityValue(value: number | string, key: keyof Inputs) {
  if (typeof value === "string") return value;

  switch (key) {
    case "annual_fall_risk":
    case "relative_risk_reduction":
    case "uptake_rate":
    case "adherence_rate":
    case "participation_dropoff_rate":
    case "effect_decay_rate":
    case "admission_rate_after_fall":
    case "discount_rate":
      return formatPercent(value);
    case "intervention_cost_per_person":
    case "cost_per_admission":
    case "cost_per_bed_day":
    case "cost_effectiveness_threshold":
      return formatCurrency(value);
    case "eligible_population":
      return formatNumber(value);
    case "average_length_of_stay":
      return `${value} days`;
    case "time_horizon_years":
      return `${value} year${value === 1 ? "" : "s"}`;
    default:
      return formatNumber(value);
  }
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
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 md:p-6">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-950 md:text-xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p
        className={cx(
          "mt-2 tracking-tight text-slate-950",
          tone === "strong" ? "text-2xl font-semibold" : "text-xl font-medium",
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm leading-7 text-slate-700">{value}</p>
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
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        type="number"
        min={min}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
      />
      {help ? <span className="mt-2 block text-xs text-slate-500">{help}</span> : null}
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
      <div className="mb-2 flex items-center justify-between gap-4">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-sm font-medium text-slate-900">{display}</span>
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
      {help ? <p className="mt-2 text-xs text-slate-500">{help}</p> : null}
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
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {help ? <span className="mt-2 block text-xs text-slate-500">{help}</span> : null}
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
      {note ? <p className="mt-2 text-sm leading-6 text-slate-600">{note}</p> : null}
    </div>
  );
}

function SensitivityPanel({
  rows,
}: {
  rows: SensitivityRow[];
}) {
  const maxImpact = rows[0]?.absoluteImpact ?? 1;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold tracking-tight text-slate-900">
          Sensitivity ranking
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Ranked by change in discounted cost per QALY from a bounded one-at-a-time
          stress test.
        </p>
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => {
          const width = `${Math.max((row.absoluteImpact / maxImpact) * 100, 6)}%`;

          return (
            <div
              key={String(row.key)}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    <p className="text-sm font-semibold text-slate-900">
                      {row.label}
                    </p>
                    {row.decisionFlip ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-800">
                        decision-critical
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {row.note}
                  </p>
                </div>

                <div className="shrink-0 text-left md:text-right">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                    Impact on cost/QALY
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {row.deltaCostPerQaly > 0 ? "+" : ""}
                    {formatCurrency(row.deltaCostPerQaly)}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="h-2 rounded-full bg-slate-200">
                  <div
                    className={cx(
                      "h-2 rounded-full",
                      row.direction === "improves" && "bg-emerald-600",
                      row.direction === "worsens" && "bg-slate-900",
                      row.direction === "neutral" && "bg-slate-400",
                    )}
                    style={{ width }}
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">
                    Base value
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {formatSensitivityValue(row.baselineValue, row.key)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">
                    Stress test value
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {formatSensitivityValue(row.testValue, row.key)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500">
                    Reading
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {row.decisionFlip
                      ? "This assumption can change the signal."
                      : row.direction === "improves"
                        ? "Higher value improves economic performance."
                        : row.direction === "worsens"
                          ? "Higher value weakens economic performance."
                          : "Minimal movement in this range."}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SafeStepApp() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS);
  const [mobileTab, setMobileTab] = useState<MobileTab>("summary");
  const [showAdvancedMobile, setShowAdvancedMobile] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [hasHydratedFromUrl, setHasHydratedFromUrl] = useState(false);

  const summaryExportRef = useRef<HTMLDivElement | null>(null);

  const [openSections, setOpenSections] = useState<Record<AssumptionSectionKey, boolean>>({
    quick: true,
    "advanced-delivery": false,
    "advanced-risk": false,
    "advanced-economics": false,
  });

  useEffect(() => {
    const restored = readScenarioFromUrl();
    if (restored) {
      setInputs(restored);
    }
    setHasHydratedFromUrl(true);
  }, []);

  useEffect(() => {
    if (!hasHydratedFromUrl) return;
    updateUrlForInputs(inputs);
  }, [inputs, hasHydratedFromUrl]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

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

  const sensitivityRows = useMemo(
    () =>
      getSensitivityRows(
        inputs,
        results.discounted_cost_per_qaly,
        decisionStatus,
      ),
    [inputs, results.discounted_cost_per_qaly, decisionStatus],
  );

  const updateInput = <K extends keyof Inputs>(key: K, value: Inputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const resetToBaseCase = () => {
    setInputs(DEFAULT_INPUTS);
    setShowAdvancedMobile(false);
    setOpenSections({
      quick: true,
      "advanced-delivery": false,
      "advanced-risk": false,
      "advanced-economics": false,
    });
    setMobileTab("summary");
    updateUrlForInputs(DEFAULT_INPUTS);
  };

  const toggleSection = (key: AssumptionSectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopyShareLink = async () => {
    try {
      const shareUrl = getShareUrl(inputs);
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      const shareUrl = getShareUrl(inputs);
      window.prompt("Copy this SafeStep link", shareUrl);
    }
  };

  const handleExportImage = async () => {
    if (!summaryExportRef.current) return;

    try {
      setIsExportingImage(true);
      const { toPng } = await import("html-to-image");

      const dataUrl = await toPng(summaryExportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = "safestep-summary.png";
      link.href = dataUrl;
      link.click();
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleExportPdf = async () => {
    if (!summaryExportRef.current) return;

    try {
      setIsExportingPdf(true);
      const [{ toPng }, { jsPDF }] = await Promise.all([
        import("html-to-image"),
        import("jspdf"),
      ]);

      const dataUrl = await toPng(summaryExportRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const image = new window.Image();
      image.src = dataUrl;

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Image load failed"));
      });

      const pdf = new jsPDF({
        orientation: image.width > image.height ? "landscape" : "portrait",
        unit: "px",
        format: [image.width, image.height],
      });

      pdf.addImage(dataUrl, "PNG", 0, 0, image.width, image.height);
      pdf.save("safestep-summary.pdf");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const summaryMetrics = (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <MetricCard
        label="Falls avoided"
        value={formatNumber(results.falls_avoided_total)}
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
    <div className="grid gap-3 md:grid-cols-3">
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
    <div className="grid gap-4 md:grid-cols-2">
      <SelectInput
        label="Targeting mode"
        value={inputs.targeting_mode}
        options={TARGETING_MODE_OPTIONS}
        onChange={(value) => updateInput("targeting_mode", value)}
        help="High impact on value."
      />

      <NumberInput
        label="Eligible population"
        value={inputs.eligible_population}
        onChange={(value) => updateInput("eligible_population", value)}
        step={100}
        help="Changes scale of impact."
      />

      <SliderInput
        label="Annual fall risk"
        value={inputs.annual_fall_risk}
        onChange={(value) => updateInput("annual_fall_risk", value)}
        min={0}
        max={1}
        step={0.01}
        display={formatPercent(inputs.annual_fall_risk)}
        help="High impact on health benefit."
      />

      <NumberInput
        label="Cost per participant"
        value={inputs.intervention_cost_per_person}
        onChange={(value) => updateInput("intervention_cost_per_person", value)}
        step={10}
        help="High impact on net value."
      />

      <SliderInput
        label="Reduction in falls"
        value={inputs.relative_risk_reduction}
        onChange={(value) => updateInput("relative_risk_reduction", value)}
        min={0}
        max={1}
        step={0.01}
        display={formatPercent(inputs.relative_risk_reduction)}
        help="High impact on value."
      />

      <SelectInput
        label="Costing method"
        value={inputs.costing_method}
        options={COSTING_METHOD_OPTIONS}
        onChange={(value) => updateInput("costing_method", value)}
        help="Changes how avoided impact is valued."
      />

      <div className="md:col-span-2">
        <SelectInput
          label="Time horizon"
          value={String(inputs.time_horizon_years) as "1" | "3" | "5"}
          options={["1", "3", "5"]}
          onChange={(value) =>
            updateInput("time_horizon_years", Number(value) as 1 | 3 | 5)
          }
          help="Longer horizons can change the economic picture materially."
        />
      </div>
    </div>
  );

  const advancedSections = (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => toggleSection("advanced-delivery")}
          className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
          aria-expanded={openSections["advanced-delivery"]}
        >
          <span className="text-sm font-medium text-slate-900">
            Delivery assumptions
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
            <div className="grid gap-4 md:grid-cols-2">
              <SliderInput
                label="Programme uptake"
                value={inputs.uptake_rate}
                onChange={(value) => updateInput("uptake_rate", value)}
                min={0}
                max={1}
                step={0.01}
                display={formatPercent(inputs.uptake_rate)}
              />
              <SliderInput
                label="Programme completion"
                value={inputs.adherence_rate}
                onChange={(value) => updateInput("adherence_rate", value)}
                min={0}
                max={1}
                step={0.01}
                display={formatPercent(inputs.adherence_rate)}
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
              <SliderInput
                label="Annual effect decay"
                value={inputs.effect_decay_rate}
                onChange={(value) => updateInput("effect_decay_rate", value)}
                min={0}
                max={0.5}
                step={0.01}
                display={formatPercent(inputs.effect_decay_rate)}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => toggleSection("advanced-risk")}
          className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
          aria-expanded={openSections["advanced-risk"]}
        >
          <span className="text-sm font-medium text-slate-900">
            Risk and pathway assumptions
          </span>
          <ChevronDown
            className={cx(
              "h-4 w-4 text-slate-500 transition-transform",
              openSections["advanced-risk"] && "rotate-180",
            )}
          />
        </button>

        {openSections["advanced-risk"] ? (
          <div className="border-t border-slate-200 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <SliderInput
                label="Falls leading to admission"
                value={inputs.admission_rate_after_fall}
                onChange={(value) =>
                  updateInput("admission_rate_after_fall", value)
                }
                min={0}
                max={1}
                step={0.01}
                display={formatPercent(inputs.admission_rate_after_fall)}
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
          onClick={() => toggleSection("advanced-economics")}
          className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
          aria-expanded={openSections["advanced-economics"]}
        >
          <span className="text-sm font-medium text-slate-900">
            Economic assumptions
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
            <div className="grid gap-4 md:grid-cols-2">
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
                step={50}
              />
              <NumberInput
                label="QALY loss per serious fall"
                value={inputs.qaly_loss_per_serious_fall}
                onChange={(value) =>
                  updateInput("qaly_loss_per_serious_fall", value)
                }
                step={0.01}
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
        note="Primary determinant of who is reached and how concentrated risk is."
      />
      <AssumptionReviewCard
        label="Eligible population"
        value={formatNumber(inputs.eligible_population)}
      />
      <AssumptionReviewCard
        label="Annual fall risk"
        value={formatPercent(inputs.annual_fall_risk)}
      />
      <AssumptionReviewCard
        label="Reduction in falls"
        value={formatPercent(inputs.relative_risk_reduction)}
      />
      <AssumptionReviewCard
        label="Cost per participant"
        value={formatCurrency(inputs.intervention_cost_per_person)}
      />
      <AssumptionReviewCard
        label="Costing method"
        value={inputs.costing_method}
      />
      <AssumptionReviewCard
        label="Time horizon"
        value={`${inputs.time_horizon_years} year${inputs.time_horizon_years === 1 ? "" : "s"}`}
      />
      <AssumptionReviewCard
        label="Discount rate"
        value={formatPercent(inputs.discount_rate)}
      />
    </div>
  );

  const desktopCharts = (
    <div className="hidden gap-6 lg:grid">
      <div className="grid gap-6 xl:grid-cols-2">
        <FallsAvoidedChart yearlyResults={results.yearly_results} />
        <CostVsSavingsChart yearlyResults={results.yearly_results} />
      </div>

      <BoundedUncertaintyChart
        uncertaintyRows={uncertainty}
        threshold={inputs.cost_effectiveness_threshold}
      />
    </div>
  );

  const mobileCharts = (
    <div className="space-y-4 lg:hidden">
      <FallsAvoidedChart yearlyResults={results.yearly_results} />

      <MobileAccordion title="Programme cost vs savings">
        <CostVsSavingsChart yearlyResults={results.yearly_results} />
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
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:py-10">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
          Health Economics Scenario Lab
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
          SafeStep
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
          Explore how falls prevention might reduce falls, admissions, bed use,
          and economic burden under different assumptions.
        </p>
      </div>

      <div className="sticky top-[72px] z-20 mb-6 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
              Live signal
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {decisionStatus}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">{netCostLabel}</p>
            <p className="text-sm font-semibold text-slate-950">
              {formatCurrency(Math.abs(results.discounted_net_cost_total))}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Cost/QALY</p>
            <p className="text-sm font-semibold text-slate-950">
              {formatCurrency(results.discounted_cost_per_qaly)}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 lg:hidden">
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

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] xl:grid-cols-[1.1fr_0.9fr]">
        <div className={cx(mobileTab !== "summary" && "hidden lg:block")}>
          <SectionCard
            title="Headline view"
            description="Start with the decision signal, then review the main economic and activity outputs."
            action={
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  {copied ? "Copied" : "Copy share link"}
                </button>

                <button
                  type="button"
                  onClick={handleExportImage}
                  disabled={isExportingImage}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ImageIcon className="h-4 w-4" />
                  {isExportingImage ? "Exporting…" : "Export image"}
                </button>

                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FileDown className="h-4 w-4" />
                  {isExportingPdf ? "Exporting…" : "Export PDF"}
                </button>
              </div>
            }
          >
            <div
              ref={summaryExportRef}
              className="rounded-3xl border border-slate-200 bg-white p-4 md:p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                    Decision signal
                  </p>
                  <div className="mt-2">
                    <div
                      className={cx(
                        "inline-flex rounded-full px-3 py-1 text-xs font-medium",
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
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <p className="font-medium text-slate-900">Scenario sharing enabled</p>
                  <p className="mt-1">
                    This exact assumption set can be restored from the copied link.
                  </p>
                </div>
              </div>

              <div className="mt-5">{summaryMetrics}</div>
              <div className="mt-5">{interpretationPanel}</div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <FallsAvoidedChart yearlyResults={results.yearly_results} />
                <CostVsSavingsChart yearlyResults={results.yearly_results} />
              </div>
            </div>

            <div className="mt-6">
              <SectionCard
                title="Charts"
                description="The first chart stays visible; additional views are progressively disclosed on mobile."
              >
                {mobileCharts}
                {desktopCharts}
              </SectionCard>
            </div>
          </SectionCard>
        </div>

        <div className={cx(mobileTab !== "assumptions" && "hidden lg:block")}>
          <SectionCard
            title="Assumptions"
            description="Quick mode surfaces the most decision-relevant inputs first. Advanced assumptions stay available below."
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
          >
            <div className="space-y-4 lg:hidden">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="mb-4 text-sm font-medium text-slate-900">
                  Quick assumptions
                </p>
                {assumptionsQuick}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
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

            <div className="hidden space-y-5 lg:block">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="mb-4 text-sm font-medium text-slate-900">
                  Quick assumptions
                </p>
                {assumptionsQuick}
              </div>
              {advancedSections}
            </div>
          </SectionCard>
        </div>

        <div className={cx(mobileTab !== "analysis" && "hidden lg:block")}>
          <SectionCard
            title="Analysis"
            description="Review the current assumption set, bounded uncertainty, and which assumptions matter most."
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Assumption review
                </h3>
                <div className="mt-4">{assumptionsReview}</div>
              </div>

              <SensitivityPanel rows={sensitivityRows} />

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Uncertainty readout
                </h3>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {uncertainty.map((row) => (
                    <AssumptionReviewCard
                      key={row.case}
                      label={row.case}
                      value={formatCurrency(row.discounted_cost_per_qaly)}
                      note={`${formatNumber(row.falls_avoided_total)} falls avoided · ${row.decision_status}`}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Interpretation
                </h3>
                <div className="mt-3 space-y-3 text-sm leading-7 text-slate-700">
                  <p>{interpretation.what_model_suggests}</p>
                  <p>{interpretation.what_drives_result}</p>
                  <p>{interpretation.what_to_validate_next}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <Download className="mt-0.5 h-4 w-4 text-slate-500" />
                  <div className="text-sm leading-7 text-slate-600">
                    Export captures the decision signal, summary metrics,
                    interpretation, and core charts in a compact shareable output.
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}