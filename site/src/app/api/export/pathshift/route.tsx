
import { NextResponse } from "next/server";
import { pdf } from "@react-pdf/renderer";

import { PathShiftReportDocument } from "@/components/pdf/pathshift-report";
import { DEFAULT_INPUTS } from "@/lib/pathshift/defaults";
import { runBoundedUncertainty, runModel } from "@/lib/pathshift/calculations";
import { buildPathShiftReportData } from "@/lib/pathshift/report";
import {
  runOneWaySensitivity,
  SENSITIVITY_VARIABLES,
} from "@/lib/pathshift/sensitivity";
import type {
  Inputs,
  ParameterSensitivityRow,
  SensitivitySummary,
} from "@/lib/pathshift/types";

function buildSensitivitySummary(inputs: Inputs): SensitivitySummary {
  const rows = runOneWaySensitivity(
    inputs,
    SENSITIVITY_VARIABLES as Array<keyof Inputs>,
  );

  const mappedRows: ParameterSensitivityRow[] = rows.map((row) => ({
    parameter_key: row.variable as keyof Inputs,
    parameter_label: row.label,
    base_value: row.base_input,
    low_value: row.low_input,
    high_value: row.high_input,
    low_value_label: String(row.low_input),
    high_value_label: String(row.high_input),
    base_icer: row.base_outcome,
    low_icer: row.low_outcome,
    high_icer: row.high_outcome,
    low_delta: row.low_delta,
    high_delta: row.high_delta,
    max_abs_icer_change: Math.max(
      Math.abs(row.low_delta),
      Math.abs(row.high_delta),
    ),
  }));

  const sorted = [...mappedRows].sort(
    (a, b) => b.max_abs_icer_change - a.max_abs_icer_change,
  );

  return {
    rows: sorted,
    primary_driver: sorted[0] ?? null,
    top_drivers: sorted.slice(0, 3),
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<{
      inputs: Partial<Inputs>;
    }>;

    const inputs: Inputs = {
      ...DEFAULT_INPUTS,
      ...(body.inputs ?? {}),
    };

    const results = runModel(inputs);
    const uncertainty = runBoundedUncertainty(inputs);
    const sensitivity = buildSensitivitySummary(inputs);

    const reportData = buildPathShiftReportData({
      inputs,
      results,
      uncertainty,
      sensitivity,
      exportedAt: new Date().toISOString(),
    });

    const blob = await pdf(
      <PathShiftReportDocument data={reportData} />,
    ).toBlob();

    const arrayBuffer = await blob.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="pathshift-report.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to export PathShift report:", error);

    return NextResponse.json(
      { error: "Failed to export PathShift report" },
      { status: 500 },
    );
  }
}