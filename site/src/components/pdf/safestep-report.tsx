import {
  Document,
  Font,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { SafeStepReportData } from "@/lib/safestep/report";

type SafeStepReportDocumentProps = {
  data: SafeStepReportData;
};

Font.registerHyphenationCallback((word) => [word]);

function formatGeneratedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normaliseCurrencyString(value: string) {
  return value.replace(/^£-/, "-£");
}

function cleanText(value: string) {
  return value
    .replace(/\bis appears\b/gi, "appears")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanValue(value: string) {
  return cleanText(normaliseCurrencyString(value));
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 34,
    fontSize: 10,
    color: "#0f172a",
    lineHeight: 1.45,
    backgroundColor: "#ffffff",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
    paddingBottom: 10,
    borderBottom: "1 solid #e2e8f0",
  },
  headerLeft: {
    width: "68%",
  },
  headerRight: {
    width: "28%",
    alignItems: "flex-end",
    paddingTop: 2,
  },
  headerSpacer: {
    width: "68%",
  },
  moduleLabel: {
    fontSize: 7.5,
    color: "#94a3b8",
    textTransform: "uppercase",
    marginBottom: 3,
    letterSpacing: 0.6,
  },
  moduleName: {
    fontSize: 9.8,
    color: "#334155",
    fontWeight: 700,
    textAlign: "right",
    lineHeight: 1.3,
  },

  title: {
    fontSize: 22,
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1.18,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: "#475569",
    lineHeight: 1.42,
    marginBottom: 7,
    maxWidth: "92%",
  },
  metaLine: {
    fontSize: 8.2,
    color: "#64748b",
    lineHeight: 1.35,
  },

  section: {
    marginTop: 15,
  },
  sectionTight: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 11.6,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 7,
  },
  subSectionTitle: {
    fontSize: 9.6,
    fontWeight: 700,
    color: "#334155",
    marginTop: 11,
    marginBottom: 7,
  },
  paragraph: {
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.55,
  },

  executiveSummaryBox: {
    marginTop: 4,
    padding: 12,
    border: "1 solid #cbd5e1",
    borderRadius: 8,
    backgroundColor: "#f8fafc",
  },
  executiveSummaryLead: {
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.55,
    marginBottom: 10,
  },

  infoRow: {
    paddingBottom: 7,
    marginBottom: 7,
    borderBottom: "1 solid #e2e8f0",
  },
  infoRowLast: {
    paddingBottom: 0,
    marginBottom: 0,
    borderBottom: "0 solid #ffffff",
  },
  rowLabel: {
    fontSize: 9.2,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 9.6,
    color: "#334155",
    lineHeight: 1.5,
  },
  rowNote: {
    fontSize: 8.6,
    color: "#64748b",
    lineHeight: 1.45,
    marginTop: 3,
  },

  metricsGrid: {
    marginTop: 2,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  metricCard: {
    width: "48%",
    border: "1 solid #cbd5e1",
    borderRadius: 8,
    padding: 9,
    backgroundColor: "#ffffff",
    minHeight: 68,
  },
  metricLabel: {
    fontSize: 8.1,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 4,
    lineHeight: 1.25,
  },
  metricValue: {
    fontSize: 12.5,
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1.25,
  },

  bulletBlock: {
    marginTop: 2,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 7,
  },
  bulletDot: {
    width: 10,
    fontSize: 10,
    color: "#0f172a",
    lineHeight: 1.4,
  },
  bulletText: {
    flex: 1,
    fontSize: 9.8,
    color: "#334155",
    lineHeight: 1.55,
  },

  assumptionsIntro: {
    fontSize: 9.2,
    color: "#475569",
    lineHeight: 1.45,
    marginBottom: 10,
  },

  table: {
    width: "100%",
    border: "1 solid #cbd5e1",
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 4,
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    fontSize: 8.5,
    fontWeight: 700,
    color: "#0f172a",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottom: "1 solid #e2e8f0",
  },
  tableRowLast: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottom: "0 solid #ffffff",
  },
  colAssumption: {
    width: "26%",
    paddingRight: 8,
  },
  colValue: {
    width: "18%",
    paddingRight: 8,
  },
  colRationale: {
    width: "56%",
  },
  tableCellLabel: {
    fontSize: 8.8,
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1.35,
  },
  tableCellValue: {
    fontSize: 8.8,
    color: "#334155",
    lineHeight: 1.4,
  },
  tableCellRationale: {
    fontSize: 8.3,
    color: "#475569",
    lineHeight: 1.4,
  },

  caveatBox: {
    marginTop: 12,
    padding: 9,
    border: "1 solid #e2e8f0",
    borderRadius: 8,
    backgroundColor: "#f8fafc",
  },
  caveatTitle: {
    fontSize: 9.4,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 4,
  },
  caveatText: {
    fontSize: 8.7,
    color: "#475569",
    lineHeight: 1.45,
  },

  threeColTable: {
    width: "100%",
    border: "1 solid #cbd5e1",
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 6,
    backgroundColor: "#ffffff",
  },
  threeColHeader: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  threeColRow: {
    flexDirection: "row",
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderBottom: "1 solid #e2e8f0",
  },
  threeColRowLast: {
    flexDirection: "row",
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderBottom: "0 solid #ffffff",
  },
  threeColLabelCol: {
    width: "28%",
    paddingRight: 8,
  },
  threeColValueCol: {
    width: "24%",
    paddingRight: 8,
  },
  threeColNoteCol: {
    width: "48%",
  },
  threeColHeaderText: {
    fontSize: 8.3,
    fontWeight: 700,
    color: "#0f172a",
    textTransform: "uppercase",
  },
  threeColCaseLabel: {
    fontSize: 8.8,
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1.35,
  },
  threeColValue: {
    fontSize: 8.8,
    color: "#334155",
    lineHeight: 1.4,
  },
  threeColNote: {
    fontSize: 8.2,
    color: "#475569",
    lineHeight: 1.4,
  },

  sensitivityDriverBox: {
    marginTop: 10,
    padding: 9,
    border: "1 solid #cbd5e1",
    borderRadius: 8,
    backgroundColor: "#ffffff",
  },
  sensitivityDriverTitle: {
    fontSize: 9.1,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 5,
  },
  sensitivityDriverMeta: {
    fontSize: 8.5,
    color: "#475569",
    lineHeight: 1.45,
  },

  footer: {
    position: "absolute",
    left: 34,
    right: 34,
    bottom: 18,
    paddingTop: 8,
    borderTop: "1 solid #e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    color: "#64748b",
  },
  pageNumber: {
    fontSize: 8,
    color: "#64748b",
  },
});

function renderInfoRows(
  items: Array<{ label: string; value: string; note?: string }>,
) {
  return items.map((item, index) => {
    const rowStyle =
      index === items.length - 1 ? styles.infoRowLast : styles.infoRow;

    return (
      <View key={item.label} style={rowStyle}>
        <Text style={styles.rowLabel}>{cleanText(item.label)}</Text>
        <Text style={styles.rowValue}>{cleanValue(item.value)}</Text>
        {item.note ? <Text style={styles.rowNote}>{cleanText(item.note)}</Text> : null}
      </View>
    );
  });
}

function renderMetricCards(items: Array<{ label: string; value: string }>) {
  const rows: Array<Array<{ label: string; value: string }>> = [];

  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }

  return (
    <View style={styles.metricsGrid}>
      {rows.map((row, rowIndex) => (
        <View key={`metric-row-${rowIndex}`} style={styles.metricRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>{cleanText(row[0].label)}</Text>
            <Text style={styles.metricValue}>{cleanValue(row[0].value)}</Text>
          </View>

          {row[1] ? (
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>{cleanText(row[1].label)}</Text>
              <Text style={styles.metricValue}>{cleanValue(row[1].value)}</Text>
            </View>
          ) : (
            <View style={styles.metricCard} />
          )}
        </View>
      ))}
    </View>
  );
}

function renderBulletBlocks(items: Array<string> | Array<{ body: string }>) {
  return (
    <View style={styles.bulletBlock}>
      {items.map((item, index) => {
        const body = typeof item === "string" ? item : item.body;

        return (
          <View key={`${body}-${index}`} style={styles.bulletRow}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>{cleanText(body)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function renderAssumptionTable(
  rows: Array<{
    assumption: string;
    value: string;
    rationale: string;
  }>,
) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <View style={styles.colAssumption}>
          <Text style={styles.tableHeaderText}>Assumption</Text>
        </View>
        <View style={styles.colValue}>
          <Text style={styles.tableHeaderText}>Value</Text>
        </View>
        <View style={styles.colRationale}>
          <Text style={styles.tableHeaderText}>Why it matters</Text>
        </View>
      </View>

      {rows.map((row, index) => {
        const rowStyle =
          index === rows.length - 1 ? styles.tableRowLast : styles.tableRow;

        return (
          <View key={`${row.assumption}-${index}`} style={rowStyle}>
            <View style={styles.colAssumption}>
              <Text style={styles.tableCellLabel}>{cleanText(row.assumption)}</Text>
            </View>
            <View style={styles.colValue}>
              <Text style={styles.tableCellValue}>{cleanValue(row.value)}</Text>
            </View>
            <View style={styles.colRationale}>
              <Text style={styles.tableCellRationale}>
                {cleanText(row.rationale)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function renderUncertaintyColumns(
  rows: Array<{
    label: string;
    value: string;
    note: string;
  }>,
) {
  return (
    <View style={styles.threeColTable}>
      <View style={styles.threeColHeader}>
        {rows.map((row) => (
          <View key={`uncertainty-header-${row.label}`} style={styles.threeColValueCol}>
            <Text style={styles.threeColHeaderText}>{cleanText(row.label)}</Text>
          </View>
        ))}
        <View style={styles.threeColNoteCol}>
          <Text style={styles.threeColHeaderText}>Interpretation</Text>
        </View>
      </View>

      <View style={styles.threeColRowLast}>
        {rows.map((row) => (
          <View key={`uncertainty-value-${row.label}`} style={styles.threeColValueCol}>
            <Text style={styles.threeColValue}>{cleanValue(row.value)}</Text>
          </View>
        ))}
        <View style={styles.threeColNoteCol}>
          <Text style={styles.threeColNote}>
            {cleanText(rows.map((row) => `${row.label}: ${row.note}`).join(" · "))}
          </Text>
        </View>
      </View>
    </View>
  );
}

function RepeatingHeader({ module }: { module: string }) {
  return (
    <View style={styles.header} fixed>
      <View style={styles.headerSpacer} />
      <View style={styles.headerRight}>
        <Text style={styles.moduleLabel}>SafeStep</Text>
        <Text style={styles.moduleName}>{cleanText(module)}</Text>
      </View>
    </View>
  );
}

function Footer() {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>Health Economics Scenario Lab · SafeStep</Text>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

export function SafeStepReportDocument({
  data,
}: SafeStepReportDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <RepeatingHeader module={data.cover.module} />

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>SafeStep scenario brief</Text>
            <Text style={styles.subtitle}>
              Exploratory assessment of potential pathway and economic value
            </Text>
            <Text style={styles.metaLine}>
              Prepared: {formatGeneratedAt(data.cover.generatedAt)}
            </Text>
            <Text style={styles.metaLine}>Prepared by Oliver Carey</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.caveatBox}>
          <Text style={styles.caveatTitle}>Scope and use note</Text>
          <Text style={styles.caveatText}>{cleanText(data.caveats.useNote)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive summary</Text>
          <View style={styles.executiveSummaryBox}>
            <Text style={styles.executiveSummaryLead}>
              {cleanText(data.executiveSummary.overview)}
            </Text>
            {renderInfoRows([
              {
                label: "Overall signal",
                value: data.executiveSummary.overallSignal,
              },
              {
                label: "What the model suggests",
                value: data.executiveSummary.whatModelSuggests,
              },
              {
                label: "Main dependency",
                value: data.executiveSummary.mainDependency,
              },
              {
                label: "Main fragility",
                value: data.executiveSummary.mainFragility,
              },
              {
                label: "Best next step",
                value: data.executiveSummary.bestNextStep,
              },
            ])}
          </View>
        </View>

        <Footer />
      </Page>

      <Page size="A4" style={styles.page}>
        <RepeatingHeader module={data.cover.module} />

        <View style={styles.sectionTight}>
          <Text style={styles.sectionTitle}>Question explored</Text>
          <Text style={styles.paragraph}>{cleanText(data.purpose.question)}</Text>
          <Text style={[styles.paragraph, { marginTop: 8 }]}>
            {cleanText(data.purpose.context)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scenario framing</Text>
          {renderInfoRows([
            {
              label: "Intervention concept",
              value: data.scenario.interventionConcept,
            },
            {
              label: "Target population and pathway logic",
              value: data.scenario.targetPopulationLogic,
            },
            {
              label: "Economic mechanism",
              value: data.scenario.economicMechanism,
            },
          ])}
        </View>

        <View style={styles.section} break>
          <Text style={styles.sectionTitle}>Headline metrics</Text>
          {renderMetricCards(data.headlineMetrics)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key results in plain English</Text>
          {renderBulletBlocks(data.plainEnglishResults)}
        </View>

        <Footer />
      </Page>

      <Page size="A4" style={styles.page}>
        <RepeatingHeader module={data.cover.module} />

        <View style={styles.sectionTight}>
          <Text style={styles.sectionTitle}>Uncertainty and sensitivity</Text>
          <Text style={styles.paragraph}>
            {cleanText(data.uncertaintyAndSensitivity.robustnessSummary)}
          </Text>

          <View style={[styles.sectionTight, { marginTop: 10 }]}>
            {renderUncertaintyColumns(data.uncertaintyAndSensitivity.uncertaintyRows)}
          </View>

          <View style={[styles.sectionTight, { marginTop: 12 }]}>
            <Text style={styles.subSectionTitle}>Sensitivity interpretation</Text>
            {renderBulletBlocks(data.uncertaintyAndSensitivity.sensitivitySummary)}
          </View>

          {data.uncertaintyAndSensitivity.topSensitivityDrivers?.length ? (
            <View style={[styles.sectionTight, { marginTop: 12 }]}>
              <Text style={styles.subSectionTitle}>Top parameter drivers</Text>
              {data.uncertaintyAndSensitivity.topSensitivityDrivers.map((driver) => (
                <View
                  key={`${driver.rank}-${driver.label}`}
                  style={styles.sensitivityDriverBox}
                >
                  <Text style={styles.sensitivityDriverTitle}>
                    {driver.rank ? `${driver.rank}. ` : ""}
                    {cleanText(driver.label)}
                  </Text>
                  {driver.lowCase ? (
                    <Text style={styles.sensitivityDriverMeta}>
                      Low case: {cleanValue(driver.lowCase)}
                    </Text>
                  ) : null}
                  {driver.highCase ? (
                    <Text style={styles.sensitivityDriverMeta}>
                      High case: {cleanValue(driver.highCase)}
                    </Text>
                  ) : null}
                  {driver.swing ? (
                    <Text style={styles.sensitivityDriverMeta}>
                      ICER swing: {cleanValue(driver.swing)}
                    </Text>
                  ) : null}
                  {driver.note ? (
                    <Text style={styles.sensitivityDriverMeta}>
                      {cleanText(driver.note)}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <Footer />
      </Page>

      <Page size="A4" style={styles.page}>
        <RepeatingHeader module={data.cover.module} />

        <View style={styles.sectionTight}>
          <Text style={styles.sectionTitle}>
            Scenario and comparator interpretation
          </Text>
          {renderInfoRows([
            {
              label: "Scenario readout",
              value: data.scenarioAndComparator.scenarioSummary,
            },
            {
              label: "Strongest scenario pattern",
              value: data.scenarioAndComparator.strongestScenario,
            },
            {
              label: "Weakest or most fragile scenario pattern",
              value: data.scenarioAndComparator.weakestScenario,
            },
            {
              label: "Comparator implication",
              value: data.scenarioAndComparator.comparatorSummary,
            },
          ])}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Decision implications</Text>
          {renderInfoRows([
            {
              label: "What supports progression",
              value: data.decisionImplications.progressionView,
            },
            {
              label: "Main evidence gap",
              value: data.decisionImplications.mainEvidenceGap,
            },
            {
              label: "Recommended next move",
              value: data.decisionImplications.recommendedNextMove,
            },
          ])}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Local evidence needed next</Text>
          {renderBulletBlocks(data.localEvidenceNeeded.items)}
        </View>

        <Footer />
      </Page>

      <Page size="A4" style={styles.page}>
        <RepeatingHeader module={data.cover.module} />

        <View style={styles.sectionTight}>
          <Text style={styles.sectionTitle}>Assumptions</Text>
          <Text style={styles.assumptionsIntro}>
            The following assumptions define the current scenario run. They shape
            the size of the pathway effect, the scale of any economic benefit, and
            the strength of the decision signal.
          </Text>

          {data.assumptions.sections.map((section) => (
            <View
              key={section.title}
              break={
                section.title === "Pathway assumptions" ||
                section.title === "Cost assumptions"
              }
            >
              <Text style={styles.subSectionTitle}>{cleanText(section.title)}</Text>
              {renderAssumptionTable(section.rows)}
            </View>
          ))}
        </View>

        <Footer />
      </Page>
    </Document>
  );
}