import { NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";


import { WaitWiseReportDocument } from "@/components/pdf/waitwise-report";
import { buildWaitWiseReportData } from "@/lib/waitwise/report";
import { DEFAULT_INPUTS } from "@/lib/waitwise/defaults";
import { runBoundedUncertainty, runModel } from "@/lib/waitwise/calculations";
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

    const reportData = buildWaitWiseReportData({
      inputs,
      results,
      uncertainty,
      exportedAt: new Date().toISOString(),
    });

    const stream = await renderToStream(
      <WaitWiseReportDocument data={reportData} />,
    );

    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="waitwise-report.pdf"',
      },
    });
  } catch (error) {
    console.error("WaitWise PDF export failed:", error);

    return NextResponse.json(
      {
        error: "Failed to generate WaitWise PDF",
        detail:
          error instanceof Error ? error.message : "Unknown export error",
      },
      { status: 500 },
    );
  }
}