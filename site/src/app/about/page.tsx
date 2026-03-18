export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-20">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
          About
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">
          Why I built the lab
        </h1>

        <div className="mt-8 space-y-10 text-slate-600">
          <section className="space-y-6 leading-8">
            <p>
              I built the Health Economics Scenario Lab to explore how economic
              reasoning in healthcare might become more interactive,
              transparent, and testable at an earlier stage.
            </p>
            <p>
              A lot of service change thinking still happens through static
              decks, rough spreadsheets, and loosely structured conversations.
              Those tools are often enough to start a conversation, but they are
              not always good at showing what assumptions are doing the work,
              where value is really coming from, or how fragile a case might be
              under different conditions.
            </p>
            <p>
              The lab is an attempt to make that earlier stage more
              decision-useful.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900">
              What the lab is
            </h2>
            <div className="mt-4 space-y-4 leading-8">
              <p>
                The platform brings together a set of lightweight interactive
                sandboxes for exploring how different healthcare interventions
                and service changes might affect activity, cost, outcomes, and
                value under uncertainty.
              </p>
              <p>
                Each sandbox focuses on a different intervention archetype, but
                they share the same broad logic: define a population, estimate
                risk, apply an intervention, model a change in events, and test
                whether value appears under the chosen assumptions.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Why this stage matters
            </h2>
            <div className="mt-4 space-y-4 leading-8">
              <p>
                Before formal modelling, business cases, or evaluation plans are
                written, there is usually a messier stage where people are
                trying to work out whether an idea is plausible at all.
              </p>
              <p>
                That is often where the most important questions should be made
                clearer: what would need to be true for this to work, what is
                driving the value case, what looks fragile, and what should be
                validated next.
              </p>
              <p>
                The sandboxes are designed for that stage.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900">
              What these tools are not
            </h2>
            <div className="mt-4 space-y-4 leading-8">
              <p>
                These tools are illustrative only. They are not substitutes for
                formal economic evaluation, detailed service modelling, or local
                validation.
              </p>
              <p>
                They are designed to support better framing, clearer thinking,
                and more transparent early-stage decision discussion — not to
                produce a final answer on their own.
              </p>
            </div>
          </section>

          <section className="space-y-6 leading-8">
            <h2 className="text-xl font-semibold text-slate-900">
              Why I built it this way
            </h2>
            <p>
              I wanted the work to be visible, inspectable, and usable. That is
              why the project is open, lightweight, and built around explicit
              assumptions rather than black-box outputs.
            </p>
            <p>
              My interest here is not just in individual models, but in the
              broader question of how healthcare strategy, economic reasoning,
              and decision support might become more interactive in practice.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}