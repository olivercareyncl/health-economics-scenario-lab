const routes = [
  {
    title: "Prevent Need",
    desc: "Reduce avoidable events before they happen.",
  },
  {
    title: "Detect Earlier",
    desc: "Shift patients to earlier and less costly states.",
  },
  {
    title: "Stabilise Risk",
    desc: "Reduce deterioration and unplanned activity.",
  },
  {
    title: "Improve Access",
    desc: "Reduce delay, backlog, and misallocation.",
  },
  {
    title: "Redesign Flow",
    desc: "Remove inefficiency within pathways.",
  },
  {
    title: "Shift Care Setting",
    desc: "Substitute higher-cost care with lower-intensity care.",
  },
  {
    title: "Improve Decisions",
    desc: "Improve triage, prioritisation, and clinical choices.",
  },
];

export default function RoutesGrid() {
  return (
    <section>
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
          Framework
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          Seven routes to health system value
        </h2>
        <p className="mt-3 max-w-3xl text-slate-600">
          Most healthcare transformation strategies improve systems through a
          small number of recurring mechanisms. The sandboxes are organised
          around those routes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {routes.map((route) => (
          <div
            key={route.title}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <h3 className="text-lg font-semibold tracking-tight">{route.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{route.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}