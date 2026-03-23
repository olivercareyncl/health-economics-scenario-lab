import { NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";

import { WaitWiseReportDocument } from "@/components/pdf/waitwise-report";
import { DEFAULT_INPUTS } from "@/lib/waitwise/defaults";
import { runBoundedUncertainty, runModel } from "@/lib/waitwise/calculations";
import { buildWaitWiseReportData } from "@/lib/waitwise/report";
import {
  runOneWaySensitivity,
  SENSITIVITY_VARIABLES,
} from "@/lib/waitwise/sensitivity";
import type { Inputs } from "@/lib/waitwise/types";

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
      SENSITIVITY_VARIABLES,
      0.2,
      "discounted_cost_per_qaly",
    );

    const sensitivity = {
      rows: sensitivityRows,
      primary_driver: sensitivityRows[0] ?? null,
      top_drivers: sensitivityRows.slice(0, 5),
    };

    const reportData = buildWaitWiseReportData({
      inputs,
      results,
      uncertainty,
      sensitivity,
      exportedAt: new Date().toISOString(),
    });

    const stream = await renderToStream(
      <WaitWiseReportDocument data={reportData} />,
    );

    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="waitwise-report.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("WaitWise PDF export failed:", error);

    return NextResponse.json(
      {
        error: "Failed to generate WaitWise PDF report",
        detail:
          error instanceof Error ? error.message : "Unknown export error",
      },
      { status: 500 },
    );
  }
}