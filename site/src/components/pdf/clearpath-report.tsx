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

function formatExportedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingBottom: 30,
    paddingHorizontal: 32,
    fontSize: 10,
    color: "#0f172a",
    lineHeight: 1.45,
  },

  header: {
    marginBottom: 18,
    paddingBottom: 14,
    borderBottom: "1 solid #e2e8f0",
  },
  title: {
    fontSize: 25,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: 500,
    color: "#475569",
    marginBottom: 10,
  },
  metaLine: {
    fontSize: 9,
    color: "#64748b",
  },

  useNoteBox: {
    marginBottom: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    border: "1 solid #e2e8f0",
    borderRadius: 6,
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
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: 700,
    color: "#0f172a",
  },
  subSectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginTop: 10,
    marginBottom: 6,
    color: "#0f172a",
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.55,
    color: "#334155",
  },
  paragraphTight: {
    fontSize: 9,
    lineHeight: 1.5,
    color: "#475569",
  },

  summaryCard: {
    border: "1 solid #cbd5e1",
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#ffffff",
  },
  summaryCardLabel: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  summaryCardValue: {
    fontSize: 10,
    color: "#0f172a",
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
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    backgroundColor: "#ffffff",
  },
  metricCardRight: {
    marginLeft: "4%",
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

  infoRow: {
    paddingBottom: 6,
    marginBottom: 6,
    borderBottom: "1 solid #e2e8f0",
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
    color: "#0f172a",
  },
  rowValue: {
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.5,
  },
  rowNote: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 2,
    lineHeight: 1.45,
  },

  bulletRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  bulletDot: {
    width: 10,
    fontSize: 10,
    color: "#475569",
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.5,
  },

  assumptionsPage: {
    paddingTop: 34,
    paddingBottom: 30,
    paddingHorizontal: 32,
    fontSize: 10,
    color: "#0f172a",
    lineHeight: 1.45,
  },
  assumptionsIntro: {
    marginBottom: 12,
  },

  tableWrap: {
    marginTop: 6,
    border: "1 solid #cbd5e1",
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottom: "1 solid #cbd5e1",
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: 700,
    color: "#334155",
    textTransform: "uppercase",
    letterSpacing: 0.3,
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
    width: "18%",
    paddingRight: 8,
  },
  colRationale: {
    width: "54%",
  },
  tableCellPrimary: {
    fontSize: 9,
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1.4,
  },
  tableCell: {
    fontSize: 9,
    color: "#334155",
    lineHeight: 1.45,
  },
});

function InfoRows({
  items,
}: {
  items: Array<{ label: string; value: string }>;
}) {
  return (
    <View>
      {items.map((item, index) => {
        const infoRowStyles: Array<Record<string, string | number>> = [
          styles.infoRow,
        ];

        if (index === items.length - 1) {
          infoRowStyles.push(styles.infoRowLast);
        }

        return (
          <View key={item.label} style={infoRowStyles}>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={styles.rowValue}>{item.value}</Text>
          </View>
        );
      })}
    </View>
  );
}

function NarrativeBullets({
  items,
}: {
  items: Array<{ body: string; title?: string }>;
}) {
  return (
    <View>
      {items.map((item, index) => (
        <View key={`${item.title ?? "item"}-${index}`} style={styles.bulletRow}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>
            {item.title ? `${item.title}: ` : ""}
            {item.body}
          </Text>
        </View>
      ))}
    </View>
  );
}

function AssumptionTable({
  rows,
}: {
  rows: Array<{
    assumption: string;
    value: string;
    rationale: string;
  }>;
}) {
  return (
    <View style={styles.tableWrap}>
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
        const tableRowStyles: Array<Record<string, string | number>> = [
          styles.tableRow,
        ];

        if (index === rows.length - 1) {
          tableRowStyles.push(styles.tableRowLast);
        }

        return (
          <View
            key={`${row.assumption}-${index}`}
            style={tableRowStyles}
          >
            <View style={styles.colAssumption}>
              <Text style={styles.tableCellPrimary}>{row.assumption}</Text>
            </View>
            <View style={styles.colValue}>
              <Text style={styles.tableCell}>{row.value}</Text>
            </View>
            <View style={styles.colRationale}>
              <Text style={styles.tableCell}>{row.rationale}</Text>
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
          <Text style={styles.title}>{data.cover.title}</Text>
          <Text style={styles.subtitle}>
            Decision brief on the potential value of earlier diagnosis
          </Text>
          <Text style={styles.metaLine}>
            {data.cover.module} · Exported {formatExportedAt(data.cover.generatedAt)}
          </Text>
        </View>

        <View style={styles.useNoteBox}>
          <Text style={styles.useNoteTitle}>Caveats and use note</Text>
          <Text style={styles.useNoteText}>{data.caveats.useNote}</Text>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scenario being explored</Text>

          <Text style={styles.subSectionTitle}>Intervention concept</Text>
          <Text style={styles.paragraph}>
            {data.scenario.interventionConcept}
          </Text>

          <Text style={styles.subSectionTitle}>Target population and pathway logic</Text>
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
          <View style={styles.metricsGrid}>
            {data.headlineMetrics.map((item, index) => {
              const metricCardStyles: Array<Record<string, string | number>> = [
                styles.metricCard,
              ];

              if (index % 2 === 1) {
                metricCardStyles.push(styles.metricCardRight);
              }

              return (
                <View key={item.label} style={metricCardStyles}>
                  <Text style={styles.metricLabel}>{item.label}</Text>
                  <Text style={styles.metricValue}>{item.value}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key results in plain English</Text>
          <NarrativeBullets items={data.plainEnglishResults} />
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
                value: `${row.value} — ${row.note}`,
              }))}
            />
          </View>

          <Text style={styles.subSectionTitle}>Sensitivity summary</Text>
          <NarrativeBullets
            items={data.uncertaintyAndSensitivity.sensitivitySummary.map((body) => ({
              body,
            }))}
          />
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
                label: "Weakest or most fragile pattern",
                value: data.scenarioAndComparator.weakestScenario,
              },
              {
                label: "Comparator interpretation",
                value: data.scenarioAndComparator.comparatorSummary,
              },
            ]}
          />
        </View>

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
          <Text style={styles.sectionTitle}>Local evidence needed next</Text>
          <NarrativeBullets
            items={data.localEvidenceNeeded.items.map((body) => ({ body }))}
          />
        </View>
      </Page>

      <Page size="A4" style={styles.assumptionsPage}>
        <View style={styles.assumptionsIntro}>
          <Text style={styles.sectionTitle}>Assumptions</Text>
          <Text style={styles.paragraphTight}>
            The tables below set out the assumptions used in this run, the value
            applied, and why each assumption matters to the resulting signal.
          </Text>
        </View>

        {data.assumptions.sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.subSectionTitle}>{section.title}</Text>
            <AssumptionTable rows={section.rows} />
          </View>
        ))}
      </Page>
    </Document>
  );
}