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
          An open exploration of how healthcare strategy, health economics, and
          decision support might become more interactive, transparent, and testable.
        </p>

        <p className="mt-6 hidden max-w-3xl text-base leading-8 text-slate-600 md:block md:text-lg">
          The Health Economics Scenario Lab is an open project exploring how
          healthcare strategy, health economics, and decision support might become
          more interactive, transparent, and testable before ideas harden into
          static business cases.
        </p>

        <div className="mt-12 space-y-8 md:space-y-10">
          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8">
            <h2 className="text-xl font-semibold">Why it exists</h2>

            <div className="mt-4 max-w-3xl leading-8 text-slate-600 md:hidden">
              <p>
                A lot of early service change thinking still happens through
                static decks, rough spreadsheets, and loosely structured
                conversations. I built the lab to explore whether that stage
                could be made more decision-useful.
              </p>
            </div>

            <div className="mt-4 hidden max-w-3xl space-y-5 leading-8 text-slate-600 md:block">
              <p>
                A lot of early service change thinking still happens through
                static decks, rough spreadsheets, and loosely structured
                conversations. Those formats are often good enough to begin a
                discussion, but they are not always good at showing which
                assumptions are really doing the work, where value is expected
                to come from, or how fragile a case might be under different
                conditions.
              </p>
              <p>
                I built the lab to explore whether that earlier stage could be
                made more decision-useful: more explicit, more inspectable, and
                more testable before formal modelling or business case writing begins.
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8">
            <h2 className="text-xl font-semibold">What the lab is</h2>

            <div className="mt-4 max-w-3xl leading-8 text-slate-600 md:hidden">
              <p>
                A set of lightweight interactive sandboxes for exploring how
                interventions and service changes might affect activity, cost,
                outcomes, and value under uncertainty.
              </p>
            </div>

            <div className="mt-4 hidden max-w-3xl space-y-5 leading-8 text-slate-600 md:block">
              <p>
                The platform brings together a set of lightweight interactive
                sandboxes for exploring how interventions and service changes
                might affect activity, cost, outcomes, and value under
                uncertainty.
              </p>
              <p>
                Each sandbox focuses on a different intervention logic, but they
                share the same broad structure: define a population, estimate
                baseline risk or pressure, apply an intervention, model changes
                in events or activity, and test whether value appears under the
                chosen assumptions.
              </p>
              <p>
                The aim is not to simulate the whole system in full detail. It is
                to create a more disciplined way to ask: what would need to be true
                for this idea to look worthwhile?
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
              <p>
                In practice, a lot of weak cases survive too long because the
                assumptions stay vague, while some strong ideas are never framed
                clearly enough to show where their value really sits. This project
                is an attempt to make that stage more rigorous.
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
                and more transparent decision discussion — not to produce a final
                answer on their own.
              </p>
              <p>
                The outputs should be treated as structured exploratory signals,
                not as decision-ready evidence.
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
                is why the project is open source, lightweight, and built around
                explicit assumptions rather than black-box outputs.
              </p>
              <p>
                The point is partly methodological and partly practical. I am
                interested not just in individual models, but in how strategy,
                analytics, and economic reasoning might be turned into tools that
                people can actually interrogate.
              </p>
              <p>
                In that sense, the lab is also a public working example of how I
                think: structured, assumption-led, product-oriented, and focused
                on making complex reasoning easier to inspect and use.
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8">
            <h2 className="text-xl font-semibold">What this project represents</h2>

            <div className="mt-4 max-w-3xl leading-8 text-slate-600 md:hidden">
              <p>
                This is both a practical tool and a public portfolio project. It
                reflects my interest in health economics, decision support,
                product thinking, and applied analytics.
              </p>
            </div>

            <div className="mt-4 hidden max-w-3xl space-y-5 leading-8 text-slate-600 md:block">
              <p>
                This is both a practical tool and a public portfolio project. It
                reflects my interest in health economics, decision support,
                product thinking, and applied analytics.
              </p>
              <p>
                More broadly, it is an exploration of the space between strategy
                work, economic reasoning, and interactive products: not just
                analysing decisions after the fact, but helping structure them
                earlier and more clearly.
              </p>
              <p>
                That is the direction I am increasingly interested in: work that
                combines analytical depth, real-world decision context, and
                usable tools.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}