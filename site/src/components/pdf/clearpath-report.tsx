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
    paddingBottom: 34,
    paddingHorizontal: 34,
    fontSize: 10,
    color: "#0f172a",
    lineHeight: 1.45,
  },

  headerBlock: {
    marginBottom: 18,
    paddingBottom: 14,
    borderBottom: "1 solid #cbd5e1",
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: "#334155",
    marginBottom: 6,
  },
  metaLine: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 2,
  },

  useNoteBox: {
    marginTop: 12,
    padding: 10,
    border: "1 solid #dbeafe",
    borderRadius: 6,
    backgroundColor: "#f8fafc",
  },
  useNoteTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  useNoteText: {
    fontSize: 9,
    color: "#475569",
    lineHeight: 1.5,
  },

  section: {
    marginTop: 14,
  },
  sectionCompact: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 7,
    color: "#0f172a",
  },
  paragraph: {
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.55,
  },

  summaryGrid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
    marginHorizontal: -4,
  },
  summaryCard: {
    width: "50%",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  summaryCardInner: {
    border: "1 solid #cbd5e1",
    borderRadius: 6,
    padding: 8,
    backgroundColor: "#ffffff",
  },
  metricLabel: {
    fontSize: 8.5,
    color: "#64748b",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  metricValue: {
    fontSize: 11.5,
    fontWeight: 700,
    color: "#0f172a",
  },

  keyPoint: {
    marginBottom: 7,
    paddingBottom: 7,
    borderBottom: "1 solid #e2e8f0",
  },
  keyPointLast: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottom: "0 solid #ffffff",
  },
  keyPointText: {
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.5,
  },

  infoRow: {
    marginBottom: 7,
    paddingBottom: 7,
    borderBottom: "1 solid #e2e8f0",
  },
  infoRowLast: {
    marginBottom: 0,
    paddingBottom: 0,
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
    marginTop: 2,
  },
  bulletItem: {
    fontSize: 10,
    color: "#334155",
    marginBottom: 5,
    lineHeight: 1.45,
  },

  assumptionsIntro: {
    fontSize: 9.5,
    color: "#475569",
    marginBottom: 8,
    lineHeight: 1.45,
  },
  subSectionTitle: {
    fontSize: 10.5,
    fontWeight: 700,
    color: "#0f172a",
    marginTop: 10,
    marginBottom: 6,
  },

  table: {
    border: "1 solid #cbd5e1",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottom: "1 solid #cbd5e1",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    fontSize: 8.5,
    fontWeight: 700,
    color: "#475569",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
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
    width: "22%",
    paddingRight: 8,
  },
  colRationale: {
    width: "50%",
  },
  tableCellLabel: {
    fontSize: 9.5,
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1.35,
  },
  tableCellValue: {
    fontSize: 9.5,
    color: "#334155",
    lineHeight: 1.35,
  },
  tableCellRationale: {
    fontSize: 9,
    color: "#475569",
    lineHeight: 1.45,
  },

  caveatBox: {
    marginTop: 6,
    padding: 10,
    border: "1 solid #e2e8f0",
    borderRadius: 6,
    backgroundColor: "#f8fafc",
  },
  caveatText: {
    fontSize: 9.5,
    color: "#475569",
    lineHeight: 1.5,
  },
});

function renderMetricCards(
  metrics: ClearPathReportData["headlineMetrics"],
) {
  return (
    <View style={styles.summaryGrid}>
      {metrics.map((item) => (
        <View key={item.label} style={styles.summaryCard}>
          <View style={styles.summaryCardInner}>
            <Text style={styles.metricLabel}>{item.label}</Text>
            <Text style={styles.metricValue}>{item.value}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function renderInfoRows(
  items: Array<{ label: string; value: string; note?: string }>,
) {
  return items.map((item, index) => {
    const rowStyles = [styles.infoRow];
    if (index === items.length - 1) rowStyles.push(styles.infoRowLast);

    return (
      <View key={item.label} style={rowStyles}>
        <Text style={styles.rowLabel}>{item.label}</Text>
        <Text style={styles.rowValue}>{item.value}</Text>
        {item.note ? <Text style={styles.rowNote}>{item.note}</Text> : null}
      </View>
    );
  });
}

function renderNarrativeBlocks(
  items: Array<{ title?: string; body: string }>,
) {
  return items.map((item, index) => {
    const rowStyles = [styles.keyPoint];
    if (index === items.length - 1) rowStyles.push(styles.keyPointLast);

    return (
      <View key={`${item.title ?? "item"}-${index}`} style={rowStyles}>
        {item.title ? <Text style={styles.rowLabel}>{item.title}</Text> : null}
        <Text style={styles.keyPointText}>{item.body}</Text>
      </View>
    );
  });
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
        const tableRowStyles = [styles.tableRow];
        if (index === rows.length - 1) tableRowStyles.push(styles.tableRowLast);

        return (
          <View
            key={`${row.assumption}-${index}`}
            style={tableRowStyles}
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
        );
      })}
    </View>
  );
}

export function ClearPathReportDocument({
  data,
}: ClearPathReportDocumentProps) {
  const topUseNote =
    "Exploratory scenario briefing for early-stage decision thinking. This output is intended to structure discussion, not replace formal evaluation or local evidence.";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBlock}>
          <Text style={styles.title}>{data.cover.title}</Text>
          <Text style={styles.subtitle}>{data.cover.subtitle}</Text>
          <Text style={styles.metaLine}>{data.cover.module}</Text>
          <Text style={styles.metaLine}>Generated: {data.cover.generatedAt}</Text>

          <View style={styles.useNoteBox}>
            <Text style={styles.useNoteTitle}>Use note</Text>
            <Text style={styles.useNoteText}>{topUseNote}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purpose of this run</Text>
          <Text style={styles.paragraph}>{data.purpose.question}</Text>
          <Text style={[styles.paragraph, { marginTop: 6 }]}>
            {data.purpose.context}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive summary</Text>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scenario being explored</Text>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Headline metrics</Text>
          {renderMetricCards(data.headlineMetrics)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key results in plain English</Text>
          {renderNarrativeBlocks(data.plainEnglishResults)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Uncertainty and sensitivity</Text>
          <Text style={styles.paragraph}>
            {data.uncertaintyAndSensitivity.robustnessSummary}
          </Text>

          <View style={[styles.sectionCompact, { marginTop: 8 }]}>
            {renderInfoRows(
              data.uncertaintyAndSensitivity.uncertaintyRows,
            )}
          </View>

          <View style={styles.sectionCompact}>
            <Text style={styles.rowLabel}>Sensitivity interpretation</Text>
            <View style={styles.bulletList}>
              {data.uncertaintyAndSensitivity.sensitivitySummary.map((item) => (
                <Text key={item} style={styles.bulletItem}>
                  • {item}
                </Text>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Scenario and comparator interpretation
          </Text>
          {renderInfoRows([
            {
              label: "Scenario interpretation",
              value: data.scenarioAndComparator.scenarioSummary,
            },
            {
              label: "Strongest scenario",
              value: data.scenarioAndComparator.strongestScenario,
            },
            {
              label: "Weakest or most fragile scenario",
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
            {data.localEvidenceNeeded.items.map((item) => (
              <Text key={item} style={styles.bulletItem}>
                • {item}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Caveats and use note</Text>
          <View style={styles.caveatBox}>
            <Text style={styles.caveatText}>{data.caveats.useNote}</Text>
          </View>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Assumptions</Text>
          <Text style={styles.subtitle}>
            Full assumption set used in this scenario run
          </Text>
          <Text style={styles.assumptionsIntro}>
            The sections below show the assumptions applied in the current run,
            the values used, and why each matters to the resulting economic and
            pathway signal.
          </Text>
        </View>

        {data.assumptions.sections.map((section) => (
          <View key={section.title} style={styles.sectionCompact}>
            <Text style={styles.subSectionTitle}>{section.title}</Text>
            {renderAssumptionTable(section.rows)}
          </View>
        ))}
      </Page>
    </Document>
  );
}