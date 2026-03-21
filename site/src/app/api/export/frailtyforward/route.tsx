import { NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";

import { FrailtyForwardReportDocument } from "@/components/pdf/frailtyforward-report";
import { DEFAULT_INPUTS } from "@/lib/frailtyforward/defaults";
import {
  runBoundedUncertainty,
  runModel,
} from "@/lib/frailtyforward/calculations";
import { buildFrailtyForwardReportData } from "@/lib/frailtyforward/report";
import type { Inputs } from "@/lib/frailtyforward/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { inputs?: Partial<Inputs> };

    const inputs: Inputs = {
      ...DEFAULT_INPUTS,
      ...(body.inputs ?? {}),
    };

    const results = runModel(inputs);
    const uncertainty = runBoundedUncertainty(inputs);

    const reportData = buildFrailtyForwardReportData({
      inputs,
      results,
      uncertainty,
      exportedAt: new Date().toISOString(),
    });

    const stream = await renderToStream(
      <FrailtyForwardReportDocument data={reportData} />,
    );

    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="frailtyforward-report.pdf"',
      },
    });
  } catch (error) {
    console.error("FrailtyForward PDF export failed:", error);

    return NextResponse.json(
      {
        error: "Failed to generate FrailtyForward PDF",
        detail:
          error instanceof Error ? error.message : "Unknown export error",
      },
      { status: 500 },
    );
  }
}