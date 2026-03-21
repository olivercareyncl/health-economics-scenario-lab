import { NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";

import { PathShiftReportDocument } from "@/components/pdf/pathshift-report";
import { DEFAULT_INPUTS } from "@/lib/pathshift/defaults";
import {
  runBoundedUncertainty,
  runModel,
} from "@/lib/pathshift/calculations";
import { buildPathShiftReportData } from "@/lib/pathshift/report";
import type { Inputs } from "@/lib/pathshift/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { inputs?: Partial<Inputs> };

    const inputs: Inputs = {
      ...DEFAULT_INPUTS,
      ...(body.inputs ?? {}),
    };

    const results = runModel(inputs);
    const uncertainty = runBoundedUncertainty(inputs);

    const reportData = buildPathShiftReportData({
      inputs,
      results,
      uncertainty,
      exportedAt: new Date().toISOString(),
    });

    const stream = await renderToStream(
      <PathShiftReportDocument data={reportData} />,
    );

    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="pathshift-report.pdf"',
      },
    });
  } catch (error) {
    console.error("PathShift PDF export failed:", error);

    return NextResponse.json(
      {
        error: "Failed to generate PathShift PDF",
        detail:
          error instanceof Error ? error.message : "Unknown export error",
      },
      { status: 500 },
    );
  }
}