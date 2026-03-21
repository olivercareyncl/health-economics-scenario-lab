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
    paddingBottom: 30,
    paddingHorizontal: 32,
    fontSize: 10,
    color: "#0f172a",
    lineHeight: 1.4,
  },

  coverTitle: {
    fontSize: 22,
    marginBottom: 4,
    fontWeight: 700,
  },
  coverSubtitle: {
    fontSize: 11,
    color: "#475569",
    marginBottom: 4,
  },
  coverMeta: {
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
    marginBottom: 3,
  },
  signalValue: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 2,
  },
  signalStatus: {
    fontSize: 10,
    color: "#334155",
  },

  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.5,
  },

  summaryGrid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  summaryCard: {
    width: "48%",
    border: "1 solid #cbd5e1",
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
    backgroundColor: "#ffffff",
  },
  summaryCardLabel: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 4,
  },
  summaryCardValue: {
    fontSize: 12,
    fontWeight: 700,
    color: "#0f172a",
  },

  executiveBlock: {
    borderBottom: "1 solid #e2e8f0",
    paddingBottom: 6,
    marginBottom: 6,
  },
  executiveLabel: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 2,
  },
  executiveValue: {
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.5,
  },

  narrativeBlock: {
    borderBottom: "1 solid #e2e8f0",
    paddingBottom: 6,
    marginBottom: 6,
  },
  narrativeTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 3,
  },
  narrativeText: {
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.5,
  },

  tableSection: {
    marginTop: 10,
  },
  tableSectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 6,
    color: "#0f172a",
  },
  tableHeader: {
    display: "flex",
    flexDirection: "row",
    borderTop: "1 solid #cbd5e1",
    borderBottom: "1 solid #cbd5e1",
    backgroundColor: "#f8fafc",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: 700,
    color: "#475569",
  },
  tableRow: {
    display: "flex",
    flexDirection: "row",
    borderBottom: "1 solid #e2e8f0",
    paddingVertical: 6,
    paddingHorizontal: 6,
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

  bulletList: {
    marginTop: 4,
  },
  bulletRow: {
    display: "flex",
    flexDirection: "row",
    marginBottom: 5,
  },
  bullet: {
    width: 10,
    fontSize: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: "#334155",
    lineHeight: 1.5,
  },

  caveatBox: {
    marginTop: 16,
    padding: 10,
    border: "1 solid #e2e8f0",
    borderRadius: 6,
    backgroundColor: "#f8fafc",
  },
  caveatTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 6,
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
  },
});

function MetricCards({
  metrics,
}: {
  metrics: ClearPathReportData["headlineMetrics"];
}) {
  if (!metrics?.length) return null;

  return (
    <View style={styles.summaryGrid}>
      {metrics.map((item) => (
        <View key={item.label} style={styles.summaryCard}>
          <Text style={styles.summaryCardLabel}>{item.label}</Text>
          <Text style={styles.summaryCardValue}>{item.value}</Text>
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
    <View style={styles.tableSection}>
      <Text style={styles.tableSectionTitle}>{title}</Text>

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
          key={`${title}-${row.assumption}`}
          style={
            index === rows.length - 1
              ? [styles.tableRow, { borderBottomWidth: 0 }]
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
            <Text style={styles.tableCellText}>{row.rationale}</Text>
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
        <Text style={styles.coverTitle}>{data.cover.title}</Text>
        <Text style={styles.coverSubtitle}>{data.cover.subtitle}</Text>
        <Text style={styles.coverMeta}>{data.cover.module}</Text>
        <Text style={styles.coverMeta}>Generated: {data.cover.generatedAt}</Text>

        <View style={styles.signalBox}>
          <Text style={styles.signalLabel}>{data.cover.signalLabel}</Text>
          <Text style={styles.signalValue}>{data.cover.decisionStatus}</Text>
          <Text style={styles.signalStatus}>
            Indicative decision signal for this scenario run
          </Text>
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

          <View style={styles.executiveBlock}>
            <Text style={styles.executiveLabel}>Overview</Text>
            <Text style={styles.executiveValue}>
              {data.executiveSummary.overview}
            </Text>
          </View>

          <View style={styles.executiveBlock}>
            <Text style={styles.executiveLabel}>Overall signal</Text>
            <Text style={styles.executiveValue}>
              {data.executiveSummary.overallSignal}
            </Text>
          </View>

          <View style={styles.executiveBlock}>
            <Text style={styles.executiveLabel}>What the model suggests</Text>
            <Text style={styles.executiveValue}>
              {data.executiveSummary.whatModelSuggests}
            </Text>
          </View>

          <View style={styles.executiveBlock}>
            <Text style={styles.executiveLabel}>Main dependency</Text>
            <Text style={styles.executiveValue}>
              {data.executiveSummary.mainDependency}
            </Text>
          </View>

          <View style={styles.executiveBlock}>
            <Text style={styles.executiveLabel}>Main fragility</Text>
            <Text style={styles.executiveValue}>
              {data.executiveSummary.mainFragility}
            </Text>
          </View>

          <View style={{ marginBottom: 0 }}>
            <Text style={styles.executiveLabel}>Best next step</Text>
            <Text style={styles.executiveValue}>
              {data.executiveSummary.bestNextStep}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scenario being explored</Text>

          <View style={styles.narrativeBlock}>
            <Text style={styles.narrativeTitle}>Intervention concept</Text>
            <Text style={styles.narrativeText}>
              {data.scenario.interventionConcept}
            </Text>
          </View>

          <View style={styles.narrativeBlock}>
            <Text style={styles.narrativeTitle}>Target population and pathway logic</Text>
            <Text style={styles.narrativeText}>
              {data.scenario.targetPopulationLogic}
            </Text>
          </View>

          <View style={{ marginBottom: 0 }}>
            <Text style={styles.narrativeTitle}>Economic mechanism</Text>
            <Text style={styles.narrativeText}>
              {data.scenario.economicMechanism}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Headline metrics</Text>
          <MetricCards metrics={data.headlineMetrics} />
        </View>

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `${data.cover.title} • ${data.cover.module} • Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key results in plain English</Text>
          {data.plainEnglishResults.map((item, index) => (
            <View key={`${item.title ?? "result"}-${index}`} style={styles.narrativeBlock}>
              {item.title ? (
                <Text style={styles.narrativeTitle}>{item.title}</Text>
              ) : null}
              <Text style={styles.narrativeText}>{item.body}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assumptions</Text>
          {data.assumptions.sections.map((section) => (
            <AssumptionTable
              key={section.title}
              title={section.title}
              rows={section.rows}
            />
          ))}
        </View>

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `${data.cover.title} • ${data.cover.module} • Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Uncertainty and sensitivity</Text>

          <View style={styles.narrativeBlock}>
            <Text style={styles.narrativeTitle}>Robustness interpretation</Text>
            <Text style={styles.narrativeText}>
              {data.uncertaintyAndSensitivity.robustnessSummary}
            </Text>
          </View>

          <View style={styles.tableSection}>
            <Text style={styles.tableSectionTitle}>Bounded uncertainty cases</Text>

            <View style={styles.tableHeader}>
              <View style={styles.colAssumption}>
                <Text style={styles.tableHeaderText}>Case</Text>
              </View>
              <View style={styles.colValue}>
                <Text style={styles.tableHeaderText}>Cost per QALY</Text>
              </View>
              <View style={styles.colRationale}>
                <Text style={styles.tableHeaderText}>Interpretation</Text>
              </View>
            </View>

            {data.uncertaintyAndSensitivity.uncertaintyRows.map((row, index, arr) => (
              <View
                key={row.label}
                style={
                  index === arr.length - 1
                    ? [styles.tableRow, { borderBottomWidth: 0 }]
                    : styles.tableRow
                }
              >
                <View style={styles.colAssumption}>
                  <Text style={styles.tableCellLabel}>{row.label}</Text>
                </View>
                <View style={styles.colValue}>
                  <Text style={styles.tableCellValue}>{row.value}</Text>
                </View>
                <View style={styles.colRationale}>
                  <Text style={styles.tableCellText}>{row.note}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.tableSection}>
            <Text style={styles.tableSectionTitle}>Sensitivity summary</Text>
            <View style={styles.bulletList}>
              {data.uncertaintyAndSensitivity.sensitivitySummary.map((item, index) => (
                <View key={`${item}-${index}`} style={styles.bulletRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scenario and comparator interpretation</Text>

          <View style={styles.executiveBlock}>
            <Text style={styles.executiveLabel}>Scenario summary</Text>
            <Text style={styles.executiveValue}>
              {data.scenarioAndComparator.scenarioSummary}
            </Text>
          </View>

          <View style={styles.executiveBlock}>
            <Text style={styles.executiveLabel}>Strongest scenario pattern</Text>
            <Text style={styles.executiveValue}>
              {data.scenarioAndComparator.strongestScenario}
            </Text>
          </View>

          <View style={styles.executiveBlock}>
            <Text style={styles.executiveLabel}>Weakest or most fragile pattern</Text>
            <Text style={styles.executiveValue}>
              {data.scenarioAndComparator.weakestScenario}
            </Text>
          </View>

          <View>
            <Text style={styles.executiveLabel}>Comparator interpretation</Text>
            <Text style={styles.executiveValue}>
              {data.scenarioAndComparator.comparatorSummary}
            </Text>
          </View>
        </View>

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `${data.cover.title} • ${data.cover.module} • Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Decision implications</Text>

          <View style={styles.executiveBlock}>
            <Text style={styles.executiveLabel}>What supports progression</Text>
            <Text style={styles.executiveValue}>
              {data.decisionImplications.progressionView}
            </Text>
          </View>

          <View style={styles.executiveBlock}>
            <Text style={styles.executiveLabel}>Main evidence gap</Text>
            <Text style={styles.executiveValue}>
              {data.decisionImplications.mainEvidenceGap}
            </Text>
          </View>

          <View style={styles.executiveBlock}>
            <Text style={styles.executiveLabel}>Current case position</Text>
            <Text style={styles.executiveValue}>
              {data.decisionImplications.currentCasePosition}
            </Text>
          </View>

          <View>
            <Text style={styles.executiveLabel}>Recommended next move</Text>
            <Text style={styles.executiveValue}>
              {data.decisionImplications.recommendedNextMove}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Local evidence needed next</Text>
          <View style={styles.bulletList}>
            {data.localEvidenceNeeded.items.map((item, index) => (
              <View key={`${item}-${index}`} style={styles.bulletRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.caveatBox}>
          <Text style={styles.caveatTitle}>Caveats and use note</Text>
          <Text style={styles.caveatText}>{data.caveats.useNote}</Text>
        </View>

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `${data.cover.title} • ${data.cover.module} • Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}