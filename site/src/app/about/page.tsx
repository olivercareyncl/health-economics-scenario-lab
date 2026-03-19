export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-16">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
          About
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
          Why I built the lab
        </h1>

        <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600 md:hidden">
          An exploration of how healthcare strategy and economic reasoning might
          become more interactive, transparent, and testable.
        </p>

        <p className="mt-6 hidden max-w-3xl text-base leading-8 text-slate-600 md:block md:text-lg">
          The Health Economics Scenario Lab explores how healthcare strategy and
          economic reasoning might become more interactive, transparent, and
          testable before ideas harden into static cases.
        </p>

        <div className="mt-12 space-y-8 md:space-y-10">
          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8">
            <h2 className="text-xl font-semibold">Why it exists</h2>

            <div className="mt-4 max-w-3xl leading-8 text-slate-600 md:hidden">
              <p>
                A lot of service change thinking still happens through static
                decks, rough spreadsheets, and loosely structured conversations.
                I built the lab to explore whether that stage could be made more
                decision-useful.
              </p>
            </div>

            <div className="mt-4 hidden max-w-3xl space-y-5 leading-8 text-slate-600 md:block">
              <p>
                A lot of service change thinking still happens through static
                decks, rough spreadsheets, and loosely structured conversations.
                Those tools are often enough to start a discussion, but they are
                not always good at showing which assumptions are really doing
                the work, where value is expected to come from, or how fragile a
                case might be under different conditions.
              </p>
              <p>
                I built the lab to explore whether that stage could be made more
                decision-useful.
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8">
            <h2 className="text-xl font-semibold">What the lab is</h2>

            <div className="mt-4 max-w-3xl leading-8 text-slate-600 md:hidden">
              <p>
                A set of lightweight interactive sandboxes for exploring how
                healthcare interventions and service changes might affect
                activity, cost, outcomes, and value under uncertainty.
              </p>
            </div>

            <div className="mt-4 hidden max-w-3xl space-y-5 leading-8 text-slate-600 md:block">
              <p>
                The platform brings together a set of lightweight interactive
                sandboxes for exploring how healthcare interventions and service
                changes might affect activity, cost, outcomes, and value under
                uncertainty.
              </p>
              <p>
                Each sandbox focuses on a different intervention context, but
                they share the same broad logic: define a population, estimate
                risk, apply an intervention, model a change in events, and test
                whether value appears under the chosen assumptions.
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8">
            <h2 className="text-xl font-semibold">Why this stage matters</h2>

            <div className="mt-4 max-w-3xl leading-8 text-slate-600 md:hidden">
              <p>
                Before formal modelling or business cases are written, there is
                usually a messier stage where people are trying to work out
                whether an idea is plausible at all.
              </p>
            </div>

            <div className="mt-4 hidden max-w-3xl space-y-5 leading-8 text-slate-600 md:block">
              <p>
                Before formal modelling, business cases, or evaluation plans are
                written, there is usually a messier stage where people are
                trying to work out whether an idea is plausible at all.
              </p>
              <p>
                That is often where the most important questions should become
                clearer: what would need to be true for this to work, what is
                driving the value case, what looks fragile, and what should be
                validated next.
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8">
            <h2 className="text-xl font-semibold">What these tools are not</h2>

            <div className="mt-4 max-w-3xl leading-8 text-slate-600 md:hidden">
              <p>
                These tools are illustrative only. They are not substitutes for
                formal economic evaluation, detailed service modelling, or local
                validation.
              </p>
            </div>

            <div className="mt-4 hidden max-w-3xl space-y-5 leading-8 text-slate-600 md:block">
              <p>
                These tools are illustrative only. They are not substitutes for
                formal economic evaluation, detailed service modelling, or local
                validation.
              </p>
              <p>
                They are designed to support better framing, clearer thinking,
                and more transparent decision discussion — not to produce a
                final answer on their own.
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8">
            <h2 className="text-xl font-semibold">Why I built it this way</h2>

            <div className="mt-4 max-w-3xl leading-8 text-slate-600 md:hidden">
              <p>
                I wanted the work to be visible, inspectable, and usable, which
                is why the project is open, lightweight, and built around
                explicit assumptions rather than black-box outputs.
              </p>
            </div>

            <div className="mt-4 hidden max-w-3xl space-y-5 leading-8 text-slate-600 md:block">
              <p>
                I wanted the work to be visible, inspectable, and usable. That
                is why the project is open, lightweight, and built around
                explicit assumptions rather than black-box outputs.
              </p>
              <p>
                My interest here is not just in individual models, but in the
                broader question of how healthcare strategy, economic reasoning,
                and decision support might become more interactive in practice.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}