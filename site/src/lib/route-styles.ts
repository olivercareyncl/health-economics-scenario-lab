export function getRouteStyle(route: string) {
  switch (route) {
    case "Prevent Need":
      return {
        pill: "border-emerald-200 bg-emerald-50 text-emerald-700",
        soft: "bg-emerald-50 border-emerald-200",
        text: "text-emerald-700",
      };
    case "Detect Earlier":
      return {
        pill: "border-blue-200 bg-blue-50 text-blue-700",
        soft: "bg-blue-50 border-blue-200",
        text: "text-blue-700",
      };
    case "Stabilise Risk":
      return {
        pill: "border-amber-200 bg-amber-50 text-amber-700",
        soft: "bg-amber-50 border-amber-200",
        text: "text-amber-700",
      };
    case "Improve Access":
      return {
        pill: "border-violet-200 bg-violet-50 text-violet-700",
        soft: "bg-violet-50 border-violet-200",
        text: "text-violet-700",
      };
    case "Redesign Flow":
      return {
        pill: "border-cyan-200 bg-cyan-50 text-cyan-700",
        soft: "bg-cyan-50 border-cyan-200",
        text: "text-cyan-700",
      };
    case "Shift Care Setting":
      return {
        pill: "border-teal-200 bg-teal-50 text-teal-700",
        soft: "bg-teal-50 border-teal-200",
        text: "text-teal-700",
      };
    case "Improve Decisions":
      return {
        pill: "border-rose-200 bg-rose-50 text-rose-700",
        soft: "bg-rose-50 border-rose-200",
        text: "text-rose-700",
      };
    default:
      return {
        pill: "border-slate-200 bg-slate-50 text-slate-700",
        soft: "bg-slate-50 border-slate-200",
        text: "text-slate-700",
      };
  }
}