import { NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";

import { ClearPathReportDocument } from "@/components/pdf/clearpath-report";
import { DEFAULT_INPUTS } from "@/lib/clearpath/defaults";
import { runBoundedUncertainty, runModel } from "@/lib/clearpath/calculations";
import { buildClearPathReportData } from "@/lib/clearpath/report";
import type { Inputs } from "@/lib/clearpath/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { inputs?: Partial<Inputs> };

    const inputs: Inputs = {
      ...DEFAULT_INPUTS,
      ...(body.inputs ?? {}),
    };

    const results = runModel(inputs);
    const uncertainty = runBoundedUncertainty(inputs);

    const reportData = buildClearPathReportData({
      inputs,
      results,
      uncertainty,
      exportedAt: new Date().toISOString(),
    });

    const stream = await renderToStream(
      <ClearPathReportDocument data={reportData} />,
    );

    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="clearpath-report.pdf"',
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 },
    );
  }
}