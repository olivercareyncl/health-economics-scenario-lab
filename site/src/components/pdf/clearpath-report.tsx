import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image as PdfImage,
} from "@react-pdf/renderer";
import type { ClearPathReportData } from "@/lib/clearpath/report";

type ClearPathReportDocumentProps = {
  data: ClearPathReportData;
};

/**
 * Replace with your actual site cover/logo asset path if available.
 * Example:
 * const LOGO_SRC = "/images/hesl-logo.png";
 */
const LOGO_SRC: string | null = null;

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 32,
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
    paddingBottom: 12,
    borderBottom: "1 solid #e2e8f0",
  },
  headerLeft: {
    flexGrow: 1,
    paddingRight: 12,
  },
  headerRight: {
    width: 160,
    alignItems: "flex-end",
  },
  title: {
    fontSize: 21,
    fontWeight: 700,
    lineHeight: 1.2,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 10.5,
    color: "#475569",
    lineHeight: 1.5,
  },
  metaLine: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 6,
  },
  moduleLabel: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 3,
    textAlign: "right",
  },
  moduleName: {
    fontSize: 11,
    fontWeight: 700,
    color: "#0f172a",
    textAlign: "right",
    lineHeight: 1.25,
  },
  appName: {
    fontSize: 9.5,
    color: "#475569",
    textAlign: "right",
    marginTop: 2,
    lineHeight: 1.3,
  },
  logo: {
    width: 74,
    height: 74,
    objectFit: "contain",
    marginTop: 8,
  },

  useNoteBox: {
    marginBottom: 16,
    padding: 10,
    border: "1 solid #e2e8f0",
    borderRadius: 8,
    backgroundColor: "#f8fafc",
  },
  useNoteTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: "#334155",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  useNoteText: {
    fontSize: 9,
    color: "#475569",
    lineHeight: 1.5,
  },

  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 12.5,
    fontWeight: 700,
    marginBottom: 8,
    color: "#0f172a",
  },
  subSectionTitle: {
    fontSize: 10.5,
    fontWeight: 700,
    marginTop: 10,
    marginBottom: 6,
    color: "#0f172a",
  },
  paragraph: {
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.55,
  },

  summaryCard: {
    border: "1 solid #e2e8f0",
    borderRadius: 8,
    padding: 9,
    marginBottom: 8,
    backgroundColor: "#ffffff",
  },
  summaryCardLabel: {
    fontSize: 8.8,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  summaryCardValue: {
    fontSize: 10,
    color: "#0f172a",
    lineHeight: 1.5,
  },

  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  metricCard: {
    width: "48%",
    border: "1 solid #cbd5e1",
    borderRadius: 8,
    padding: 9,
    marginBottom: 8,
    backgroundColor: "#f8fafc",
  },
  metricLabel: {
    fontSize: 8.8,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1.3,
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
    fontSize: 9.5,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.45,
  },
  rowNote: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 2,
    lineHeight: 1.4,
  },

  bulletList: {
    marginTop: 4,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  bullet: {
    width: 10,
    fontSize: 10,
    color: "#0f172a",
  },
  bulletText: {
    flexGrow: 1,
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.5,
  },

  assumptionsPageTitle: {
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 10,
    color: "#0f172a",
  },

  table: {
    border: "1 solid #cbd5e1",
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 6,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottom: "1 solid #cbd5e1",
  },
  tableHeaderText: {
    fontSize: 8.8,
    fontWeight: 700,
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottom: "1 solid #e2e8f0",
  },
  tableRowLast: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottom: "0 solid #ffffff",
  },
  colAssumption: {
    width: "26%",
    paddingRight: 8,
  },
  colValue: {
    width: "20%",
    paddingRight: 8,
  },
  colRationale: {
    width: "54%",
  },
  tableTextStrong: {
    fontSize: 9.4,
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1.35,
  },
  tableText: {
    fontSize: 9.3,
    color: "#334155",
    lineHeight: 1.45,
  },

  footer: {
    position: "absolute",
    left: 32,
    right: 32,
    bottom: 16,
    paddingTop: 8,
    borderTop: "1 solid #e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8.5,
    color: "#94a3b8",
  },
});

function renderMetricGrid(items: ClearPathReportData["headlineMetrics"]) {
  return (
    <View style={styles.metricGrid}>
      {items.map((item) => (
        <View key={item.label} style={styles.metricCard}>
          <Text style={styles.metricLabel}>{item.label}</Text>
          <Text style={styles.metricValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

function renderInfoRows(
  items: Array<{ label: string; value: string; note?: string }>,
) {
  return items.map((item, index) => {
    const rowStyle =
      index === items.length - 1 ? styles.infoRowLast : styles.infoRow;

    return (
      <View key={item.label} style={rowStyle}>
        <Text style={styles.rowLabel}>{item.label}</Text>
        <Text style={styles.rowValue}>{item.value}</Text>
        {item.note ? <Text style={styles.rowNote}>{item.note}</Text> : null}
      </View>
    );
  });
}

function renderNarrativeBlocks(
  items: ClearPathReportData["plainEnglishResults"],
) {
  return items.map((item, index) => (
    <View key={`${item.title ?? "result"}-${index}`} style={styles.bulletRow}>
      <Text style={styles.bullet}>•</Text>
      <View style={{ flexGrow: 1 }}>
        {item.title ? <Text style={styles.rowLabel}>{item.title}</Text> : null}
        <Text style={styles.bulletText}>{item.body}</Text>
      </View>
    </View>
  ));
}

function renderAssumptionTable(
  rows: Array<{ assumption: string; value: string; rationale: string }>,
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
              <Text style={styles.tableTextStrong}>{row.assumption}</Text>
            </View>
            <View style={styles.colValue}>
              <Text style={styles.tableText}>{row.value}</Text>
            </View>
            <View style={styles.colRationale}>
              <Text style={styles.tableText}>{row.rationale}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function ClearPathReportDocument({
  data,
}: ClearPathReportDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>
              Decision brief on the potential value of earlier diagnosis
            </Text>
            <Text style={styles.subtitle}>
              Structured export from ClearPath exploring whether earlier
              diagnosis could reduce emergency pathway pressure, admissions, bed
              use, and downstream economic burden under the selected
              assumptions.
            </Text>
            <Text style={styles.metaLine}>
              Generated: {data.cover.generatedAt}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.moduleLabel}>Module</Text>
            <Text style={styles.moduleName}>{data.cover.module}</Text>
            <Text style={styles.appName}>ClearPath</Text>
            {LOGO_SRC ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <PdfImage src={LOGO_SRC} style={styles.logo} alt="" />
            ) : null}
          </View>
        </View>

        <View style={styles.useNoteBox}>
          <Text style={styles.useNoteTitle}>Caveats and use note</Text>
          <Text style={styles.useNoteText}>{data.caveats.useNote}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive summary</Text>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>Overview</Text>
            <Text style={styles.summaryCardValue}>
              {data.executiveSummary.overview}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>Overall signal</Text>
            <Text style={styles.summaryCardValue}>
              {data.executiveSummary.overallSignal}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>What the model suggests</Text>
            <Text style={styles.summaryCardValue}>
              {data.executiveSummary.whatModelSuggests}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>Main dependency</Text>
            <Text style={styles.summaryCardValue}>
              {data.executiveSummary.mainDependency}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>Main fragility</Text>
            <Text style={styles.summaryCardValue}>
              {data.executiveSummary.mainFragility}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>Best next step</Text>
            <Text style={styles.summaryCardValue}>
              {data.executiveSummary.bestNextStep}
            </Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Health Economics Scenario Lab</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purpose of this run</Text>
          <Text style={styles.paragraph}>{data.purpose.question}</Text>
          <Text style={[styles.paragraph, { marginTop: 6 }]}>
            {data.purpose.context}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scenario being explored</Text>

          <Text style={styles.subSectionTitle}>Intervention concept</Text>
          <Text style={styles.paragraph}>
            {data.scenario.interventionConcept}
          </Text>

          <Text style={styles.subSectionTitle}>
            Target population and pathway logic
          </Text>
          <Text style={styles.paragraph}>
            {data.scenario.targetPopulationLogic}
          </Text>

          <Text style={styles.subSectionTitle}>Economic mechanism</Text>
          <Text style={styles.paragraph}>
            {data.scenario.economicMechanism}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Headline metrics</Text>
          {renderMetricGrid(data.headlineMetrics)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key results in plain English</Text>
          <View style={styles.bulletList}>
            {renderNarrativeBlocks(data.plainEnglishResults)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Uncertainty and sensitivity</Text>
          <Text style={styles.paragraph}>
            {data.uncertaintyAndSensitivity.robustnessSummary}
          </Text>

          <View style={{ marginTop: 8 }}>
            {renderInfoRows(data.uncertaintyAndSensitivity.uncertaintyRows)}
          </View>

          <Text style={styles.subSectionTitle}>Sensitivity summary</Text>
          <View style={styles.bulletList}>
            {data.uncertaintyAndSensitivity.sensitivitySummary.map(
              (item, index) => (
                <View key={`sensitivity-${index}`} style={styles.bulletRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ),
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Scenario and comparator interpretation
          </Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>Scenario interpretation</Text>
            <Text style={styles.summaryCardValue}>
              {data.scenarioAndComparator.scenarioSummary}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>Stronger scenario pattern</Text>
            <Text style={styles.summaryCardValue}>
              {data.scenarioAndComparator.strongestScenario}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>Weaker scenario pattern</Text>
            <Text style={styles.summaryCardValue}>
              {data.scenarioAndComparator.weakestScenario}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardLabel}>Comparator readout</Text>
            <Text style={styles.summaryCardValue}>
              {data.scenarioAndComparator.comparatorSummary}
            </Text>
          </View>
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
              label: "Current case position",
              value: data.decisionImplications.currentCasePosition,
            },
            {
              label: "Recommended next move",
              value: data.decisionImplications.recommendedNextMove,
            },
          ])}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Local evidence needed next</Text>
          <View style={styles.bulletList}>
            {data.localEvidenceNeeded.items.map((item, index) => (
              <View key={`local-evidence-${index}`} style={styles.bulletRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Health Economics Scenario Lab</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.assumptionsPageTitle}>Assumptions</Text>

        {data.assumptions.sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.subSectionTitle}>{section.title}</Text>
            {renderAssumptionTable(section.rows)}
          </View>
        ))}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Health Economics Scenario Lab</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}