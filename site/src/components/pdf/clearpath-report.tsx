import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

type ClearPathReportDocumentProps = {
  data: {
    title: string;
    subtitle?: string;
    generatedAt?: string;
    decisionStatus?: string;
    purpose?: string;
    scenarioQuestion?: string;
    scenarioContext?: Array<{ label: string; value: string }>;
    headlineMetrics?: Array<{ label: string; value: string }>;
    summary?: string;
    interpretation?: Array<{ label: string; value: string }>;
    assumptions?: Array<{
      section: string;
      items: Array<{ label: string; value: string; note?: string }>;
    }>;
    uncertainty?: Array<{ label: string; value: string; note?: string }>;
    recommendations?: Array<{ label: string; value: string }>;
    caveat?: string;
  };
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
  title: {
    fontSize: 20,
    marginBottom: 4,
    fontWeight: 700,
  },
  subtitle: {
    fontSize: 11,
    marginBottom: 4,
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
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: 700,
  },
  paragraph: {
    lineHeight: 1.5,
    color: "#334155",
  },
  grid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  card: {
    border: "1 solid #cbd5e1",
    borderRadius: 6,
    padding: 8,
    width: "48%",
    marginBottom: 8,
  },
  label: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 4,
  },
  value: {
    fontSize: 12,
    fontWeight: 700,
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
  },
  rowNote: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 2,
  },
  subSectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginTop: 10,
    marginBottom: 6,
    color: "#0f172a",
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
});

export function ClearPathReportDocument({
  data,
}: ClearPathReportDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{data.title}</Text>
        {data.subtitle ? <Text style={styles.subtitle}>{data.subtitle}</Text> : null}
        {data.generatedAt ? (
          <Text style={styles.metaLine}>Generated: {data.generatedAt}</Text>
        ) : null}

        {data.decisionStatus ? (
          <View style={styles.signalBox}>
            <Text style={styles.signalLabel}>Indicative economic signal</Text>
            <Text style={styles.signalValue}>{data.decisionStatus}</Text>
          </View>
        ) : null}

        {data.purpose ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What ClearPath is</Text>
            <Text style={styles.paragraph}>{data.purpose}</Text>
          </View>
        ) : null}

        {data.scenarioQuestion ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Question explored in this run</Text>
            <Text style={styles.paragraph}>{data.scenarioQuestion}</Text>
          </View>
        ) : null}

        {data.scenarioContext?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scenario context</Text>
            {data.scenarioContext.map((item) => (
              <View key={item.label} style={styles.row}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {data.headlineMetrics?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Headline findings</Text>
            <View style={styles.grid}>
              {data.headlineMetrics.map((item) => (
                <View key={item.label} style={styles.card}>
                  <Text style={styles.label}>{item.label}</Text>
                  <Text style={styles.value}>{item.value}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {data.summary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interpretation summary</Text>
            <Text style={styles.paragraph}>{data.summary}</Text>
          </View>
        ) : null}

        {data.interpretation?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Decision readout</Text>
            {data.interpretation.map((item) => (
              <View key={item.label} style={styles.row}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {data.assumptions?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assumptions used</Text>
            {data.assumptions.map((group) => (
              <View key={group.section}>
                <Text style={styles.subSectionTitle}>{group.section}</Text>
                {group.items.map((item) => (
                  <View key={`${group.section}-${item.label}`} style={styles.row}>
                    <Text style={styles.rowLabel}>{item.label}</Text>
                    <Text style={styles.rowValue}>{item.value}</Text>
                    {item.note ? <Text style={styles.rowNote}>{item.note}</Text> : null}
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : null}
      </Page>

      <Page size="A4" style={styles.page}>
        {data.uncertainty?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Uncertainty</Text>
            <Text style={styles.paragraph}>
              These bounded uncertainty cases show how the economic picture changes
              under lower, base, and higher-case conditions.
            </Text>
            <View style={{ marginTop: 8 }}>
              {data.uncertainty.map((item) => (
                <View key={item.label} style={styles.row}>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Text style={styles.rowValue}>{item.value}</Text>
                  {item.note ? <Text style={styles.rowNote}>{item.note}</Text> : null}
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {data.recommendations?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommended next checks</Text>
            {data.recommendations.map((item) => (
              <View key={item.label} style={styles.row}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {data.caveat ? (
          <View style={styles.caveatBox}>
            <Text style={styles.sectionTitle}>Scope note</Text>
            <Text style={styles.caveatText}>{data.caveat}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}