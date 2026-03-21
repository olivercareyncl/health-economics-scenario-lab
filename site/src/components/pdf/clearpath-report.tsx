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
    paddingTop: 34,
    paddingBottom: 30,
    paddingHorizontal: 34,
    fontSize: 10,
    color: "#0f172a",
    lineHeight: 1.45,
    backgroundColor: "#ffffff",
  },

  coverBlock: {
    marginBottom: 18,
    paddingBottom: 14,
    borderBottom: "1 solid #cbd5e1",
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 6,
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 11,
    color: "#475569",
    marginBottom: 8,
  },
  metaRow: {
    marginTop: 2,
  },
  metaText: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 2,
  },

  useNoteBox: {
    marginTop: 14,
    padding: 12,
    border: "1 solid #e2e8f0",
    borderRadius: 8,
    backgroundColor: "#f8fafc",
  },
  useNoteTitle: {
    fontSize: 9,
    fontWeight: 700,
    marginBottom: 5,
    color: "#334155",
    textTransform: "uppercase",
  },
  useNoteText: {
    fontSize: 9,
    color: "#475569",
    lineHeight: 1.5,
  },

  section: {
    marginTop: 18,
  },
  sectionCompact: {
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 8,
    color: "#0f172a",
  },
  subSectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginTop: 12,
    marginBottom: 8,
    color: "#0f172a",
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.55,
    color: "#334155",
  },

  summaryGrid: {
    marginTop: 4,
  },
  summaryCard: {
    border: "1 solid #dbe4ee",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#ffffff",
  },
  summaryCardLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: "#64748b",
    marginBottom: 4,
  },
  summaryCardValue: {
    fontSize: 10,
    color: "#1e293b",
    lineHeight: 1.5,
  },

  scenarioBlock: {
    border: "1 solid #e2e8f0",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#ffffff",
  },
  scenarioLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: "#64748b",
    marginBottom: 4,
  },
  scenarioText: {
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.5,
  },

  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 2,
  },
  metricCard: {
    width: "48%",
    border: "1 solid #cbd5e1",
    borderRadius: 8,
    padding: 10,
    marginRight: "4%",
    marginBottom: 8,
    backgroundColor: "#ffffff",
  },
  metricCardAlt: {
    marginRight: 0,
  },
  metricLabel: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: 700,
    color: "#0f172a",
  },

  bulletBlock: {
    marginTop: 2,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 7,
  },
  bulletMark: {
    width: 10,
    fontSize: 10,
    color: "#334155",
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.5,
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
    fontSize: 9,
    fontWeight: 700,
    color: "#64748b",
    marginBottom: 3,
  },
  rowValue: {
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.5,
  },
  rowNote: {
    fontSize: 9,
    color: "#64748b",
    lineHeight: 1.45,
    marginTop: 3,
  },

  table: {
    border: "1 solid #cbd5e1",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    borderBottom: "1 solid #cbd5e1",
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: 700,
    color: "#334155",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottom: "1 solid #e2e8f0",
  },
  tableRowLast: {
    borderBottom: "0 solid #ffffff",
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
  tableCellLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: "#334155",
    lineHeight: 1.4,
  },
  tableCellValue: {
    fontSize: 9,
    color: "#0f172a",
    lineHeight: 1.4,
  },
  tableCellRationale: {
    fontSize: 9,
    color: "#475569",
    lineHeight: 1.45,
  },

  footer: {
    position: "absolute",
    bottom: 14,
    left: 34,
    right: 34,
    paddingTop: 6,
    borderTop: "1 solid #e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: "#94a3b8",
  },
});

function renderMetricCards(
  metrics: Array<{ label: string; value: string }>,
) {
  return (
    <View style={styles.metricsGrid}>
      {metrics.map((item, index) => (
        <View
          key={item.label}
          style={
            index % 2 === 1
              ? [styles.metricCard, styles.metricCardAlt]
              : styles.metricCard
          }
        >
          <Text style={styles.metricLabel}>{item.label}</Text>
          <Text style={styles.metricValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

function renderBulletList(items: string[]) {
  return (
    <View style={styles.bulletBlock}>
      {items.map((item, index) => (
        <View key={`${item}-${index}`} style={styles.bulletRow}>
          <Text style={styles.bulletMark}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function renderInfoRows(
  items: Array<{ label: string; value: string }>,
) {
  return (
    <View>
      {items.map((item, index) => (
        <View
          key={`${item.label}-${index}`}
          style={
            index === items.length - 1
              ? [styles.infoRow, styles.infoRowLast]
              : styles.infoRow
          }
        >
          <Text style={styles.rowLabel}>{item.label}</Text>
          <Text style={styles.rowValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

function renderUncertaintyRows(
  items: Array<{ label: string; value: string; note: string }>,
) {
  return (
    <View>
      {items.map((item, index) => (
        <View
          key={`${item.label}-${index}`}
          style={
            index === items.length - 1
              ? [styles.infoRow, styles.infoRowLast]
              : styles.infoRow
          }
        >
          <Text style={styles.rowLabel}>{item.label}</Text>
          <Text style={styles.rowValue}>{item.value}</Text>
          <Text style={styles.rowNote}>{item.note}</Text>
        </View>
      ))}
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

      {rows.map((row, index) => (
        <View
          key={`${row.assumption}-${index}`}
          style={
            index === rows.length - 1
              ? [styles.tableRow, styles.tableRowLast]
              : styles.tableRow
          }
        >
          <View style={styles.colAssumption}>
            <Text style={styles.tableCellLabel}>{row.assumption}</Text>
          </View>
          <View style={styles.colValue}>
            <Text style={styles.tableCellValue}>{row.value}</Text>
          </View>
          <View style={styles.colRationale}>
            <Text style={styles.tableCellRationale}>{row.rationale}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function ClearPathReportDocument({
  data,
}: ClearPathReportDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.coverBlock}>
          <Text style={styles.title}>{data.cover.title}</Text>
          <Text style={styles.subtitle}>{data.cover.subtitle}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{data.cover.module}</Text>
            <Text style={styles.metaText}>Generated: {data.cover.generatedAt}</Text>
          </View>

          <View style={styles.useNoteBox}>
            <Text style={styles.useNoteTitle}>Caveats and use note</Text>
            <Text style={styles.useNoteText}>{data.caveats.useNote}</Text>
          </View>
        </View>

        <View style={styles.sectionCompact}>
          <Text style={styles.sectionTitle}>Purpose of this run</Text>
          <Text style={styles.paragraph}>{data.purpose.question}</Text>
          <Text style={[styles.paragraph, { marginTop: 7 }]}>
            {data.purpose.context}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive summary</Text>

          <View style={styles.summaryGrid}>
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
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scenario being explored</Text>

          <View style={styles.scenarioBlock}>
            <Text style={styles.scenarioLabel}>Intervention concept</Text>
            <Text style={styles.scenarioText}>
              {data.scenario.interventionConcept}
            </Text>
          </View>

          <View style={styles.scenarioBlock}>
            <Text style={styles.scenarioLabel}>Target population and pathway logic</Text>
            <Text style={styles.scenarioText}>
              {data.scenario.targetPopulationLogic}
            </Text>
          </View>

          <View style={styles.scenarioBlock}>
            <Text style={styles.scenarioLabel}>Economic mechanism</Text>
            <Text style={styles.scenarioText}>
              {data.scenario.economicMechanism}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Headline metrics</Text>
          {renderMetricCards(data.headlineMetrics)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key results in plain English</Text>
          {renderBulletList(data.plainEnglishResults.map((item) => item.body))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Uncertainty and sensitivity</Text>
          <Text style={styles.paragraph}>
            {data.uncertaintyAndSensitivity.robustnessSummary}
          </Text>

          <View style={[styles.sectionCompact, { marginTop: 10 }]}>
            <Text style={styles.subSectionTitle}>Bounded uncertainty cases</Text>
            {renderUncertaintyRows(data.uncertaintyAndSensitivity.uncertaintyRows)}
          </View>

          <View style={[styles.sectionCompact, { marginTop: 12 }]}>
            <Text style={styles.subSectionTitle}>Sensitivity summary</Text>
            {renderBulletList(data.uncertaintyAndSensitivity.sensitivitySummary)}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scenario and comparator interpretation</Text>
          {renderInfoRows([
            {
              label: "Scenario summary",
              value: data.scenarioAndComparator.scenarioSummary,
            },
            {
              label: "Strongest scenario pattern",
              value: data.scenarioAndComparator.strongestScenario,
            },
            {
              label: "Weakest or most fragile pattern",
              value: data.scenarioAndComparator.weakestScenario,
            },
            {
              label: "Comparator interpretation",
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
              label: "Current position",
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
          {renderBulletList(data.localEvidenceNeeded.items)}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{data.cover.module}</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.coverBlock}>
          <Text style={styles.title}>Assumptions</Text>
          <Text style={styles.subtitle}>
            Full assumption set used for this scenario run
          </Text>
          <Text style={styles.metaText}>{data.cover.module}</Text>
        </View>

        <View style={styles.sectionCompact}>
          {data.assumptions.sections.map((section, index) => (
            <View
              key={section.title}
              style={index === 0 ? undefined : styles.section}
            >
              <Text style={styles.subSectionTitle}>{section.title}</Text>
              {renderAssumptionTable(section.rows)}
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{data.cover.module}</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}