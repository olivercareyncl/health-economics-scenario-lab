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
    headlineMetrics?: Array<{ label: string; value: string }>;
    summary?: string;
    assumptions?: Array<{ label: string; value: string; note?: string }>;
    uncertainty?: Array<{ label: string; value: string; note?: string }>;
    recommendations?: Array<{ label: string; value: string }>;
  };
};

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    color: "#0f172a",
  },
  title: {
    fontSize: 20,
    marginBottom: 6,
    fontWeight: 700,
  },
  subtitle: {
    fontSize: 11,
    marginBottom: 12,
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
          <Text style={styles.subtitle}>Generated: {data.generatedAt}</Text>
        ) : null}

        {data.summary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Executive summary</Text>
            <Text style={styles.paragraph}>{data.summary}</Text>
          </View>
        ) : null}

        {data.headlineMetrics?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Headline metrics</Text>
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

        {data.assumptions?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Assumptions</Text>
            {data.assumptions.map((item) => (
              <View key={item.label} style={styles.row}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowValue}>{item.value}</Text>
                {item.note ? <Text style={styles.rowNote}>{item.note}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {data.uncertainty?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Uncertainty</Text>
            {data.uncertainty.map((item) => (
              <View key={item.label} style={styles.row}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowValue}>{item.value}</Text>
                {item.note ? <Text style={styles.rowNote}>{item.note}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        {data.recommendations?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Decision readout</Text>
            {data.recommendations.map((item) => (
              <View key={item.label} style={styles.row}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}