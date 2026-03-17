export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-20">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
          About
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">
          Why I built these tools
        </h1>

        <div className="mt-8 space-y-6 leading-8 text-slate-600">
          <p>
            I built these tools to explore how economic reasoning in healthcare
            might become more interactive, transparent, and testable at an
            earlier stage.
          </p>
          <p>
            A lot of service change thinking still happens through static decks,
            rough spreadsheets, and loosely structured conversations. These
            sandboxes are an attempt to make that stage more decision-useful.
          </p>
          <p>
            Each app focuses on a different problem area, but they share the
            same broad goal: helping people explore what might need to be true
            for a service change or intervention to look worthwhile.
          </p>
          <p>
            These tools are illustrative only and are not substitutes for formal
            economic evaluation or local validation.
          </p>
        </div>
      </div>
    </main>
  );
}