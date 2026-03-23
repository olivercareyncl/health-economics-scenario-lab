import { NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";

import { FrailtyForwardReportDocument } from "@/components/pdf/frailtyforward-report";
import { DEFAULT_INPUTS } from "@/lib/frailtyforward/defaults";
import {
  runBoundedUncertainty,
  runModel,
} from "@/lib/frailtyforward/calculations";
import { buildFrailtyForwardReportData } from "@/lib/frailtyforward/report";
import {
  runOneWaySensitivity,
  SENSITIVITY_VARIABLES,
} from "@/lib/frailtyforward/sensitivity";
import type {
  Inputs,
  SensitivitySummary,
} from "@/lib/frailtyforward/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { inputs?: Partial<Inputs> };

    const inputs: Inputs = {
      ...DEFAULT_INPUTS,
      ...(body.inputs ?? {}),
    };

    const results = runModel(inputs);
    const uncertainty = runBoundedUncertainty(inputs);

    const sensitivityRows = runOneWaySensitivity(
      inputs,
      [...SENSITIVITY_VARIABLES],
      0.2,
      "discounted_cost_per_qaly",
    );

    const sensitivity: SensitivitySummary = {
      rows: sensitivityRows,
      primary_driver: sensitivityRows[0] ?? null,
      top_drivers: sensitivityRows.slice(0, 3),
    };

    const reportData = buildFrailtyForwardReportData({
      inputs,
      results,
      uncertainty,
      sensitivity,
      exportedAt: new Date().toISOString(),
    });

    const stream = await renderToStream(
      <FrailtyForwardReportDocument data={reportData} />,
    );

    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="frailtyforward-report.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("FrailtyForward PDF export failed:", error);

    return NextResponse.json(
      { error: "Failed to generate FrailtyForward PDF report" },
      { status: 500 },
    );
  }
}