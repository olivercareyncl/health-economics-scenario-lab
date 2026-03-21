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
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 30,
    fontSize: 10,
    color: "#0f172a",
    lineHeight: 1.45,
  },

  title: {
    fontSize: 20,
    marginBottom: 4,
    fontWeight: 700,
  },
  subtitle: {
    fontSize: 11,
    marginBottom: 3,
    color: "#475569",
  },
  metaLine: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 2,
  },

  signalBox: {
    marginTop: 10,
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
  signalPill: {
    marginTop: 4,
    alignSelf: "flex-start",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    border: "1 solid #cbd5e1",
    backgroundColor: "#ffffff",
    fontSize: 9,
    color: "#334155",
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
    marginTop: 10,
    marginBottom: 6,
    color: "#0f172a",
  },
  paragraph: {
    lineHeight: 1.5,
    color: "#334155",
  },

  twoCol: {
    display: "flex",
    flexDirection: "row",
    gap: 10,
  },
  twoColItem: {
    width: "48%",
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

  narrativeBlock: {
    borderBottom: "1 solid #e2e8f0",
    paddingBottom: 6,
    marginBottom: 8,
  },
  narrativeTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 3,
  },

  infoRow: {
    borderBottom: "1 solid #e2e8f0",
    paddingBottom: 6,
    marginBottom: 6,
  },
  infoRowLast: {
    paddingBottom: 0,
    marginBottom: 0,
    borderBottom: "0 solid #ffffff",
  },
  rowLabel: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 10,
    color: "#334155",
  },
  rowNote: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 2,
    lineHeight: 1.4,
  },

  table: {
    border: "1 solid #cbd5e1",
    borderRadius: 6,
    overflow: "hidden",
    marginTop: 4,
    marginBottom: 10,
  },
  tableHeader: {
    display: "flex",
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottom: "1 solid #cbd5e1",
  },
  tableHeaderCell: {
    paddingVertical: 7,
    paddingHorizontal: 8,
    fontSize: 9,
    fontWeight: 700,
    color: "#334155",
  },
  tableRow: {
    display: "flex",
    flexDirection: "row",
    borderBottom: "1 solid #e2e8f0",
  },
  tableRowLast: {
    borderBottom: "0 solid #ffffff",
  },
  tableCell: {
    paddingVertical: 7,
    paddingHorizontal: 8,
    fontSize: 9,
    color: "#334155",
    lineHeight: 1.35,
  },
  colAssumption: {
    width: "28%",
  },
  colValue: {
    width: "18%",
  },
  colWhy: {
    width: "54%",
  },

  bulletList: {
    marginTop: 4,
  },
  bulletRow: {
    display: "flex",
    flexDirection: "row",
    marginBottom: 5,
  },
  bulletDot: {
    width: 10,
    fontSize: 10,
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
    bottom: 14,
    left: 30,
    right: 30,
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
  },
});

function MetricGrid({
  metrics,
}: {
  metrics: Array<{ label: string; value: string }>;
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

function InfoRows({
  items,
}: {
  items: Array<{ label: string; value: string; note?: string }>;
}) {
  return (
    <View>
      {items.map((item, index) => (
        <View
          key={item.label}
          style={[
            styles.infoRow,
            index === items.length - 1 ? styles.infoRowLast : undefined,
          ]}
        >
          <Text style={styles.rowLabel}>{item.label}</Text>
          <Text style={styles.rowValue}>{item.value}</Text>
          {item.note ? <Text style={styles.rowNote}>{item.note}</Text> : null}
        </View>
      ))}
    </View>
  );
}

function AssumptionTable({
  title,
  rows,
}: {
  title: string;
  rows: Array<{
    assumption: string;
    value: string;
    rationale: string;
  }>;
}) {
  return (
    <View>
      <Text style={styles.subSectionTitle}>{title}</Text>

      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <View style={[styles.tableHeaderCell, styles.colAssumption]}>
            <Text>Assumption</Text>
          </View>
          <View style={[styles.tableHeaderCell, styles.colValue]}>
            <Text>Value</Text>
          </View>
          <View style={[styles.tableHeaderCell, styles.colWhy]}>
            <Text>Why it matters</Text>
          </View>
        </View>

        {rows.map((row, index) => (
          <View
            key={`${title}-${row.assumption}`}
            style={[
              styles.tableRow,
              index === rows.length - 1 ? styles.tableRowLast : undefined,
            ]}
          >
            <View style={[styles.tableCell, styles.colAssumption]}>
              <Text>{row.assumption}</Text>
            </View>
            <View style={[styles.tableCell, styles.colValue]}>
              <Text>{row.value}</Text>
            </View>
            <View style={[styles.tableCell, styles.colWhy]}>
              <Text>{row.rationale}</Text>
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
        <Text style={styles.title}>{data.cover.title}</Text>
        <Text style={styles.subtitle}>{data.cover.subtitle}</Text>
        <Text style={styles.metaLine}>{data.cover.module}</Text>
        <Text style={styles.metaLine}>Generated: {data.cover.generatedAt}</Text>

        <View style={styles.signalBox}>
          <Text style={styles.signalLabel}>{data.cover.signalLabel}</Text>
          <Text style={styles.signalValue}>{data.cover.decisionStatus}</Text>
          <Text style={styles.signalPill}>Decision brief export</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Purpose of this run</Text>
          <Text style={styles.paragraph}>{data.purpose.question}</Text>
          <Text style={[styles.paragraph, { marginTop: 8 }]}>
            {data.purpose.context}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive summary</Text>
          <InfoRows
            items={[
              {
                label: "Overview",
                value: data.executiveSummary.overview,
              },
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
            ]}
          />
        </View>

        <Text style={styles.footer}>
          {data.cover.module} · {data.cover.title} · 1
        </Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scenario being explored</Text>

          <View style={styles.narrativeBlock}>
            <Text style={styles.narrativeTitle}>Intervention concept</Text>
            <Text style={styles.paragraph}>
              {data.scenario.interventionConcept}
            </Text>
          </View>

          <View style={styles.narrativeBlock}>
            <Text style={styles.narrativeTitle}>Target population and pathway logic</Text>
            <Text style={styles.paragraph}>
              {data.scenario.targetPopulationLogic}
            </Text>
          </View>

          <View style={[styles.narrativeBlock, styles.infoRowLast]}>
            <Text style={styles.narrativeTitle}>Economic mechanism</Text>
            <Text style={styles.paragraph}>
              {data.scenario.economicMechanism}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Headline metrics</Text>
          <MetricGrid metrics={data.headlineMetrics} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key results in plain English</Text>
          {data.plainEnglishResults.map((item, index) => (
            <View
              key={`result-${index}`}
              style={[
                styles.narrativeBlock,
                index === data.plainEnglishResults.length - 1
                  ? styles.infoRowLast
                  : undefined,
              ]}
            >
              {item.title ? (
                <Text style={styles.narrativeTitle}>{item.title}</Text>
              ) : null}
              <Text style={styles.paragraph}>{item.body}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          {data.cover.module} · {data.cover.title} · 2
        </Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Decision implications</Text>
          <InfoRows
            items={[
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
            ]}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Uncertainty and sensitivity</Text>
          <Text style={styles.paragraph}>
            {data.uncertaintyAndSensitivity.robustnessSummary}
          </Text>

          <View style={{ marginTop: 8 }}>
            <InfoRows
              items={data.uncertaintyAndSensitivity.uncertaintyRows.map((row) => ({
                label: row.label,
                value: row.value,
                note: row.note,
              }))}
            />
          </View>

          <Text style={styles.subSectionTitle}>Sensitivity interpretation</Text>
          <View style={styles.bulletList}>
            {data.uncertaintyAndSensitivity.sensitivitySummary.map((item, index) => (
              <View key={`sens-${index}`} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scenario and comparator interpretation</Text>
          <InfoRows
            items={[
              {
                label: "Scenario summary",
                value: data.scenarioAndComparator.scenarioSummary,
              },
              {
                label: "Strongest scenario pattern",
                value: data.scenarioAndComparator.strongestScenario,
              },
              {
                label: "Weakest scenario pattern",
                value: data.scenarioAndComparator.weakestScenario,
              },
              {
                label: "Comparator interpretation",
                value: data.scenarioAndComparator.comparatorSummary,
              },
            ]}
          />
        </View>

        <Text style={styles.footer}>
          {data.cover.module} · {data.cover.title} · 3
        </Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Local evidence needed next</Text>
          <View style={styles.bulletList}>
            {data.localEvidenceNeeded.items.map((item, index) => (
              <View key={`local-${index}`} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assumptions used</Text>
          {data.assumptions.sections.slice(0, 2).map((section) => (
            <AssumptionTable
              key={section.title}
              title={section.title}
              rows={section.rows}
            />
          ))}
        </View>

        <Text style={styles.footer}>
          {data.cover.module} · {data.cover.title} · 4
        </Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assumptions used</Text>
          {data.assumptions.sections.slice(2).map((section) => (
            <AssumptionTable
              key={section.title}
              title={section.title}
              rows={section.rows}
            />
          ))}
        </View>

        <View style={styles.caveatBox}>
          <Text style={styles.sectionTitle}>Caveats and use note</Text>
          <Text style={styles.caveatText}>{data.caveats.useNote}</Text>
        </View>

        <Text style={styles.footer}>
          {data.cover.module} · {data.cover.title} · 5
        </Text>
      </Page>
    </Document>
  );
}