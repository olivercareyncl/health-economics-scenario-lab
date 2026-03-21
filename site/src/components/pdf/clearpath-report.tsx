import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ClearPathReportData } from "@/lib/clearpath/report";

type ClearPathReportDocumentProps = {
  data: ClearPathReportData;
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 36,
    paddingHorizontal: 32,
    fontSize: 10,
    color: "#0f172a",
    lineHeight: 1.45,
  },

  headerBand: {
    paddingBottom: 10,
    borderBottom: "1 solid #cbd5e1",
  },
  module: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 20,
    marginBottom: 4,
    fontWeight: 700,
  },
  subtitle: {
    fontSize: 11,
    color: "#475569",
    marginBottom: 6,
  },
  metaLine: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 2,
  },

  signalBox: {
    marginTop: 12,
    padding: 10,
    border: "1 solid #cbd5e1",
    borderRadius: 6,
    backgroundColor: "#f8fafc",
  },
  signalLabel: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 4,
  },
  signalValue: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 2,
  },
  signalStatus: {
    fontSize: 9,
    color: "#475569",
  },

  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: 700,
  },
  subSectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 6,
    color: "#0f172a",
  },
  paragraph: {
    color: "#334155",
    lineHeight: 1.5,
  },

  metricGrid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metricCard: {
    border: "1 solid #cbd5e1",
    borderRadius: 6,
    padding: 8,
    width: "48%",
    marginBottom: 8,
    backgroundColor: "#ffffff",
  },
  metricLabel: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: 700,
  },

  summaryBox: {
    border: "1 solid #e2e8f0",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#ffffff",
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.45,
  },

  resultBlock: {
    borderBottom: "1 solid #e2e8f0",
    paddingBottom: 6,
    marginBottom: 6,
  },
  resultText: {
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.5,
  },

  tableSection: {
    marginTop: 10,
    marginBottom: 8,
  },
  table: {
    border: "1 solid #cbd5e1",
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottom: "1 solid #cbd5e1",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 700,
    color: "#334155",
  },
  colAssumption: {
    width: "28%",
    paddingRight: 8,
  },
  colValue: {
    width: "20%",
    paddingRight: 8,
  },
  colRationale: {
    width: "52%",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottom: "1 solid #e2e8f0",
  },
  tableCellLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: "#0f172a",
  },
  tableCellValue: {
    fontSize: 9,
    color: "#334155",
  },
  tableCellText: {
    fontSize: 9,
    color: "#475569",
    lineHeight: 1.4,
  },

  row: {
    borderBottom: "1 solid #e2e8f0",
    paddingBottom: 6,
    marginBottom: 6,
  },
  rowLabel: {
    fontSize: 10,
    fontWeight: 700,
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
    marginBottom: 5,
    paddingRight: 8,
  },
  bullet: {
    width: 10,
    fontSize: 10,
    color: "#334155",
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.45,
  },

  caveatBox: {
    marginTop: 16,
    padding: 10,
    border: "1 solid #e2e8f0",
    borderRadius: 6,
    backgroundColor: "#f8fafc",
  },
  caveatText: {
    fontSize: 9,
    color: "#475569",
    lineHeight: 1.5,
  },

  footer: {
    position: "absolute",
    bottom: 16,
    left: 32,
    right: 32,
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
    borderTop: "1 solid #e2e8f0",
    paddingTop: 6,
  },
});

function MetricGrid({
  metrics,
}: {
  metrics: ClearPathReportData["headlineMetrics"];
}) {
  return (
    <View style={styles.metricGrid}>
      {metrics.map((item) => (
        <View key={item.label} style={styles.metricCard}>
          <Text style={styles.metricLabel}>{item.label}</Text>
          <Text style={styles.metricValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

function AssumptionsTable({
  title,
  rows,
}: {
  title: string;
  rows: ClearPathReportData["assumptions"]["sections"][number]["rows"];
}) {
  return (
    <View style={styles.tableSection} wrap={false}>
      <Text style={styles.subSectionTitle}>{title}</Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <View style={styles.colAssumption}>
            <Text style={styles.tableHeaderCell}>Assumption</Text>
          </View>
          <View style={styles.colValue}>
            <Text style={styles.tableHeaderCell}>Value</Text>
          </View>
          <View style={styles.colRationale}>
            <Text style={styles.tableHeaderCell}>Why it matters</Text>
          </View>
        </View>

        {rows.map((row, index) => (
          <View
            key={`${title}-${row.assumption}`}
            style={[
              styles.tableRow,
              index === rows.length - 1 ? { borderBottom: "0 solid #ffffff" } : null,
            ]}
          >
            <View style={styles.colAssumption}>
              <Text style={styles.tableCellLabel}>{row.assumption}</Text>
            </View>
            <View style={styles.colValue}>
              <Text style={styles.tableCellValue}>{row.value}</Text>
            </View>
            <View style={styles.colRationale}>
              <Text style={styles.tableCellText}>{row.rationale}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function ClearPathReportDocument({
  data,
}: ClearPathReportDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBand}>
          <Text style={styles.module}>{data.cover.module}</Text>
          <Text style={styles.title}>{data.cover.title}</Text>
          <Text style={styles.subtitle}>{data.cover.subtitle}</Text>
          <Text style={styles.metaLine}>Generated: {data.cover.generatedAt}</Text>

          <View style={styles.signalBox}>
            <Text style={styles.signalLabel}>{data.cover.signalLabel}</Text>
            <Text style={styles.signalValue}>{data.cover.decisionStatus}</Text>
            <Text style={styles.signalStatus}>
              This is the current indicative decision signal for the selected
              scenario run.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purpose of this run</Text>
          <Text style={styles.paragraph}>{data.purpose.context}</Text>
          <Text style={[styles.paragraph, { marginTop: 8 }]}>
            {data.purpose.question}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive summary</Text>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Overview</Text>
            <Text style={styles.summaryValue}>
              {data.executiveSummary.overview}
            </Text>
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Overall signal</Text>
            <Text style={styles.summaryValue}>
              {data.executiveSummary.overallSignal}
            </Text>
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>What the model suggests</Text>
            <Text style={styles.summaryValue}>
              {data.executiveSummary.whatModelSuggests}
            </Text>
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Main dependency</Text>
            <Text style={styles.summaryValue}>
              {data.executiveSummary.mainDependency}
            </Text>
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Main fragility</Text>
            <Text style={styles.summaryValue}>
              {data.executiveSummary.mainFragility}
            </Text>
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Best next step</Text>
            <Text style={styles.summaryValue}>
              {data.executiveSummary.bestNextStep}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scenario being explored</Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Intervention concept</Text>
            <Text style={styles.rowValue}>
              {data.scenario.interventionConcept}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Target population and pathway logic</Text>
            <Text style={styles.rowValue}>
              {data.scenario.targetPopulationLogic}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Economic mechanism</Text>
            <Text style={styles.rowValue}>
              {data.scenario.economicMechanism}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Headline metrics</Text>
          <MetricGrid metrics={data.headlineMetrics} />
        </View>

        <Text style={styles.footer}>
          {data.cover.title} · {data.cover.module}
        </Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key results in plain English</Text>
          {data.plainEnglishResults.map((item, index) => (
            <View key={`result-${index}`} style={styles.resultBlock}>
              {item.title ? (
                <Text style={styles.rowLabel}>{item.title}</Text>
              ) : null}
              <Text style={styles.resultText}>{item.body}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assumptions</Text>
          {data.assumptions.sections.map((section) => (
            <AssumptionsTable
              key={section.title}
              title={section.title}
              rows={section.rows}
            />
          ))}
        </View>

        <Text style={styles.footer}>
          {data.cover.title} · Assumptions and results
        </Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Uncertainty and sensitivity</Text>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Robustness interpretation</Text>
            <Text style={styles.summaryValue}>
              {data.uncertaintyAndSensitivity.robustnessSummary}
            </Text>
          </View>

          <View style={{ marginTop: 8 }}>
            <Text style={styles.subSectionTitle}>Bounded uncertainty cases</Text>
            {data.uncertaintyAndSensitivity.uncertaintyRows.map((item) => (
              <View key={item.label} style={styles.row}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowValue}>{item.value}</Text>
                <Text style={styles.rowNote}>{item.note}</Text>
              </View>
            ))}
          </View>

          <View style={{ marginTop: 8 }}>
            <Text style={styles.subSectionTitle}>Sensitivity summary</Text>
            <View style={styles.bulletList}>
              {data.uncertaintyAndSensitivity.sensitivitySummary.map(
                (item, index) => (
                  <View key={`sens-${index}`} style={styles.bulletRow}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.bulletText}>{item}</Text>
                  </View>
                ),
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Scenario and comparator interpretation
          </Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Scenario comparison</Text>
            <Text style={styles.rowValue}>
              {data.scenarioAndComparator.scenarioSummary}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Strongest scenario pattern</Text>
            <Text style={styles.rowValue}>
              {data.scenarioAndComparator.strongestScenario}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Weakest or most fragile pattern</Text>
            <Text style={styles.rowValue}>
              {data.scenarioAndComparator.weakestScenario}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Comparator interpretation</Text>
            <Text style={styles.rowValue}>
              {data.scenarioAndComparator.comparatorSummary}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Decision implications</Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>What supports progression</Text>
            <Text style={styles.rowValue}>
              {data.decisionImplications.progressionView}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Main evidence gap</Text>
            <Text style={styles.rowValue}>
              {data.decisionImplications.mainEvidenceGap}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Current case position</Text>
            <Text style={styles.rowValue}>
              {data.decisionImplications.currentCasePosition}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Recommended next move</Text>
            <Text style={styles.rowValue}>
              {data.decisionImplications.recommendedNextMove}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Local evidence needed next</Text>
          <View style={styles.bulletList}>
            {data.localEvidenceNeeded.items.map((item, index) => (
              <View key={`local-${index}`} style={styles.bulletRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.caveatBox}>
          <Text style={styles.sectionTitle}>Caveats and use note</Text>
          <Text style={styles.caveatText}>{data.caveats.useNote}</Text>
        </View>

        <Text style={styles.footer}>
          {data.cover.title} · Decision implications and next evidence
        </Text>
      </Page>
    </Document>
  );
}