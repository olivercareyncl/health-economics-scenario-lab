import Image from "next/image";
import Link from "next/link";
import { apps } from "@/data/apps";
import { apps, GITHUB_URL, LINKEDIN_URL } from "@/data/apps";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-4xl">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
            Health Economics Scenario Lab
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Interactive sandboxes for exploring value under uncertainty.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            A set of lightweight tools for testing how different interventions
            and service changes might affect cost, activity, outcomes, and
            value in healthcare — before ideas harden into static business
            cases or full formal models.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#apps"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Explore apps
            </a>
            <a
              href="https://github.com/olivercsreyncl/health-economics-scenario-lab"
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              View GitHub
            </a>
          </div>
        </div>
      </section>

      <section className="border-y border-amber-200 bg-amber-50">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <p className="text-sm leading-7 text-amber-900/80">
            <span className="font-semibold text-amber-900">Important:</span>{" "}
            These tools are illustrative and exploratory. They are designed to
            support earlier-stage decision thinking, not replace formal economic
            evaluation or local validation.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Why this exists
            </h2>
            <div className="mt-4 space-y-5 text-slate-600 leading-8">
              <p>
                A lot of early economic thinking in healthcare still happens in
                static decks, rough spreadsheets, and loosely structured
                conversations.
              </p>
              <p>
                These tools are an attempt to make that stage more interactive,
                transparent, and testable — helping people explore what might
                need to be true for an intervention or service change to look
                worthwhile.
              </p>
              <p>
                They sit somewhere between a rough calculator, a service design
                thinking tool, and an early economic framing aid.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="text-lg font-semibold tracking-tight">
              What they are useful for
            </h3>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
              <li>• testing assumptions before building a full business case</li>
              <li>• comparing delivery or targeting strategies</li>
              <li>• exploring thresholds and fragility</li>
              <li>• identifying what should be validated next</li>
              <li>• structuring earlier decision conversations</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="apps" className="border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-10">
            <h2 className="text-2xl font-semibold tracking-tight">Current apps</h2>
            <p className="mt-3 text-slate-600">
              Each module focuses on a different decision problem, but follows
              the same broad sandbox approach.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {apps.map((app) => (
              <div
                key={app.slug}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {app.category}
                  </span>
                  <span className="inline-flex rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500">
                    {app.status}
                  </span>
                </div>

                <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  <Image
                    src={app.image}
                    alt={app.name}
                    width={1200}
                    height={700}
                    className="h-44 w-full object-cover"
                  />
                </div>

                <h3 className="text-xl font-semibold">{app.name}</h3>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {app.descriptor}
                </p>

                <p className="mt-4 text-sm font-medium leading-7 text-slate-800">
                  {app.question}
                </p>

                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {app.shortDescription}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={app.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
                  >
                    Open app
                  </a>
                  <Link
                    href={`/apps/${app.slug}`}
                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Read more
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                How to read these tools
              </h2>
              <div className="mt-4 space-y-5 text-slate-600 leading-8">
                <p>
                  These apps are designed for earlier-stage structured thinking.
                  They are most useful when the question is not “is this
                  decision already proven?” but “what would need to be true for
                  this to look convincing?”
                </p>
                <p>
                  They are best used to test assumptions, explore scenarios,
                  compare strategic options, and surface what should be locally
                  validated next.
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold tracking-tight">What they are not</h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <li>• not formal NICE-style models</li>
                <li>• not full cost-effectiveness analyses</li>
                <li>• not probabilistic sensitivity analyses</li>
                <li>• not patient-level simulations</li>
                <li>• not suitable for real-world use without local validation</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl font-semibold tracking-tight">Roadmap</h2>
          <p className="mt-3 max-w-3xl text-slate-600 leading-8">
            The wider project is still evolving. Planned next modules include
            long-term condition management and other pathway-specific value
            sandboxes.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {["StableHeart", "SteadyLungs", "KidneyKind", "DiabetesForward"].map(
              (item) => (
                <div
                  key={item}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700"
                >
                  {item}
                </div>
              )
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p><p>Health Economics Scenario Lab · Built by Oliver Carey</p></p>
          <div className="flex items-center gap-5">
            <a
              href="https://github.com/olivercareyncl/health-economics-scenario-lab"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-900"
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/posts/oliver-carey_healtheconomics-healthtech-nhsanalytics-activity-7439742257710141441-rNAy?utm_source=share&utm_medium=member_ios&rcm=ACoAABp4fIQB3VoRmdwTsL63V4Cf9esmJbekqwo"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-900"
            >
              LinkedIn
            </a>
            <Link href="/about" className="hover:text-slate-900">
              About
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}