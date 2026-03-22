import { NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";

import { SafeStepReportDocument } from "@/components/pdf/safestep-report";
import { defaultInputs as DEFAULT_INPUTS } from "@/lib/safestep/defaults";
import {
  runBoundedUncertainty,
  runModel,
  runParameterSensitivity,
} from "@/lib/safestep/calculations";
import { buildSafeStepReportData } from "@/lib/safestep/report";
import type { SafeStepInputs } from "@/lib/safestep/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      inputs?: Partial<SafeStepInputs>;
    };

    const inputs: SafeStepInputs = {
      ...DEFAULT_INPUTS,
      ...(body.inputs ?? {}),
    };

    const results = runModel(inputs);
    const uncertainty = runBoundedUncertainty(inputs);
    const oneWaySensitivity = runParameterSensitivity(inputs);

    const reportData = buildSafeStepReportData({
      inputs,
      results,
      uncertainty,
      oneWaySensitivity,
      exportedAt: new Date().toISOString(),
    });

    const stream = await renderToStream(
      <SafeStepReportDocument data={reportData} />,
    );

    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="safestep-report.pdf"',
      },
    });
  } catch (error) {
    console.error("SafeStep PDF export failed:", error);

    return NextResponse.json(
      {
        error: "Failed to generate SafeStep PDF",
        detail:
          error instanceof Error ? error.message : "Unknown export error",
      },
      { status: 500 },
    );
  }
}