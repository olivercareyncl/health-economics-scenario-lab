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
import type { Inputs } from "@/lib/pathshift/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<{ inputs: Partial<Inputs> }>;
    const inputs: Inputs = {
      ...DEFAULT_INPUTS,
      ...(body?.inputs ?? {}),
    };

    const results = runModel(inputs);
    const uncertainty = runBoundedUncertainty(inputs);

    const sensitivityRows = runOneWaySensitivity(
      inputs,
      [...SENSITIVITY_VARIABLES],
    );

    const sensitivity = {
      rows: sensitivityRows,
      primary_driver: sensitivityRows[0] ?? null,
      top_drivers: sensitivityRows.slice(0, 3),
    };

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
    console.error("Failed to generate PathShift report:", error);

    return NextResponse.json(
      { error: "Failed to generate PathShift report." },
      { status: 500 },
    );
  }
}