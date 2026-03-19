"use client";

import Link from "next/link";

type EmbeddedSandboxPreviewProps = {
  title?: string;
  description?: string;
  embedUrl?: string;
  openUrl?: string;
};

export default function EmbeddedSandboxPreview({
  title = "Try SafeStep",
  description = "A live preview of the falls prevention sandbox. Adjust assumptions and explore how changes in risk, effect, and delivery cost affect value.",
  embedUrl = "https://safestep-mnjcyn8idt5rrddqsmnncd.streamlit.app/?embed=true",
  openUrl = "https://safestep-mnjcyn8idt5rrddqsmnncd.streamlit.app/",
}: EmbeddedSandboxPreviewProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
            Live preview
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-3 max-w-3xl text-slate-600">{description}</p>
        </div>

        <Link
          href={openUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white"
        >
          Open full sandbox
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <iframe
          src={embedUrl}
          title={title}
          className="h-[760px] w-full"
          allow="fullscreen"
        />
      </div>

      <p className="mt-4 text-sm text-slate-500">
        If the embedded view feels cramped on your device, open the full sandbox
        in a new tab for the best experience.
      </p>
    </section>
  );
}