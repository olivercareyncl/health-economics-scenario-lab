import { NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";

import { StableHeartReportDocument } from "@/components/pdf/stableheart-report";
import { buildStableHeartReportData } from "@/lib/stableheart/report";
import { DEFAULT_INPUTS } from "@/lib/stableheart/defaults";
import { runBoundedUncertainty, runModel } from "@/lib/stableheart/calculations";
import type { Inputs } from "@/lib/stableheart/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { inputs?: Partial<Inputs> };

    const inputs: Inputs = {
      ...DEFAULT_INPUTS,
      ...(body.inputs ?? {}),
    };

    const results = runModel(inputs);
    const uncertainty = runBoundedUncertainty(inputs);

    const reportData = buildStableHeartReportData({
      inputs,
      results,
      uncertainty,
      exportedAt: new Date().toISOString(),
    });

    const stream = await renderToStream(
      <StableHeartReportDocument data={reportData} />,
    );

    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="stableheart-report.pdf"',
      },
    });
  } catch (error) {
    console.error("StableHeart PDF export failed:", error);

    return NextResponse.json(
      {
        error: "Failed to generate StableHeart PDF",
        detail:
          error instanceof Error ? error.message : "Unknown export error",
      },
      { status: 500 },
    );
  }
}