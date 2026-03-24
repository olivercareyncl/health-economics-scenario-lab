function buildSensitivitySummary(
  sensitivity: SensitivitySummary,
): string[] {
  const top = sensitivity.top_drivers;

  if (top.length === 0) {
    return [
      "One-way sensitivity has not highlighted a clear set of dominant drivers yet.",
      "At this stage, the case should still be treated as dependent on the core assumptions around pathway shift, admission reduction, follow-up reduction, and redesign cost.",
      "Further validation should focus on the most decision-relevant pathway, implementation, and cost inputs locally.",
    ];
  }

  const first = top[0]?.parameter_label.toLowerCase();
  const second = top[1]?.parameter_label.toLowerCase();
  const third = top[2]?.parameter_label.toLowerCase();

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