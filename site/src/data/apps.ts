export const apps: AppItem[] = [
  {
    slug: "safestep",
    name: "SafeStep",
    descriptor: "Falls Prevention Sandbox",
    category: "Prevent Need",
    status: "Live",
    shortDescription:
      "Explore how different assumptions affect the value case for falls prevention.",
    longDescription:
      "Falls prevention often sounds obviously worthwhile. SafeStep is designed to explore what would actually need to be true for the value case to hold.",
    question:
      "What would need to be true for falls prevention to create value?",
    whyItMatters:
      "Prevention cases often sound intuitively convincing, but the economic logic can become vague very quickly once effectiveness, delivery cost, targeting, and time horizon come into play.",
    bullets: [
      "intervention effectiveness",
      "delivery cost",
      "falls avoided",
      "admissions and bed days",
      "threshold position",
      "bounded uncertainty",
    ],
    liveUrl: "https://safestep-mnjcyn8idt5rrddqsmnncd.streamlit.app/",
    githubUrl: "https://github.com/olivercareyncl/health-economics-scenario-lab",
    image: "/images/safestep.png",
  },
  {
    slug: "clearpath",
    name: "ClearPath",
    descriptor: "Early Diagnosis Sandbox",
    category: "Detect Earlier",
    status: "Live",
    shortDescription:
      "Explore how earlier diagnosis might change pathway pressure, cost, and value.",
    longDescription:
      "ClearPath explores how shifting diagnosis earlier might affect pathway pressure, treatment-related costs, and value.",
    question:
      "What would need to shift for earlier diagnosis to create value?",
    whyItMatters:
      "Earlier diagnosis is attractive in principle, but the value case depends on what actually shifts downstream — not just the ambition to diagnose sooner.",
    bullets: [
      "cases shifted earlier",
      "admissions and bed days",
      "cost differences",
      "QALYs",
      "threshold position",
      "scenario comparison",
    ],
    liveUrl: "#",
    githubUrl: "https://github.com/olivercareyncl/health-economics-scenario-lab",
    image: "/images/clearpath.png",
  },
  {
    slug: "waitwise",
    name: "WaitWise",
    descriptor: "Waiting List Strategy Sandbox",
    category: "Improve Access",
    status: "Live",
    shortDescription:
      "Explore how waiting list interventions might affect backlog pressure, downstream demand, and value.",
    longDescription:
      "WaitWise focuses on whether waiting list interventions create value once escalation, admissions, and downstream impact are considered.",
    question:
      "Under what conditions do waiting list interventions create value, not just throughput?",
    whyItMatters:
      "Waiting list interventions are often framed operationally. The harder question is whether they also create value once escalation, admissions, and downstream pressure are considered.",
    bullets: [
      "waiting list reduction",
      "escalations avoided",
      "admissions and bed days",
      "programme cost",
      "QALYs",
      "threshold position",
    ],
    liveUrl: "#",
    githubUrl: "https://github.com/olivercareyncl/health-economics-scenario-lab",
    image: "/images/waitwise.png",
  },
  {
    slug: "pathshift",
    name: "PathShift",
    descriptor: "Care Pathway Redesign Sandbox",
    category: "Redesign Flow",
    status: "Live",
    shortDescription:
      "Explore how pathway redesign might change activity, follow-up burden, and value.",
    longDescription:
      "PathShift is designed to make pathway redesign logic more testable by separating activity change, admission impact, follow-up burden, and value.",
    question:
      "Under what conditions does pathway redesign create value?",
    whyItMatters:
      "Pathway redesign can bundle many promised effects together. Separating activity change, admission impact, follow-up burden, and bed use makes the logic easier to test.",
    bullets: [
      "patients shifted in pathway",
      "admissions avoided",
      "follow-ups avoided",
      "bed-day impact",
      "programme cost",
      "cost per QALY",
    ],
    liveUrl: "#",
    githubUrl: "https://github.com/olivercareyncl/health-economics-scenario-lab",
    image: "/images/pathshift.png",
  },
  {
    slug: "frailtyforward",
    name: "FrailtyForward",
    descriptor: "Frailty Support Sandbox",
    category: "Stabilise Risk",
    status: "Live",
    shortDescription:
      "Explore how earlier frailty support might change crisis events, admissions, and value.",
    longDescription:
      "FrailtyForward explores how earlier frailty support might change crisis events, admissions, bed use, and value under different assumptions.",
    question:
      "What would need to be true for earlier frailty support to create value?",
    whyItMatters:
      "Earlier frailty support is intuitively appealing, but the case often depends heavily on targeting, persistence, and how much acute use is actually avoided.",
    bullets: [
      "patients stabilised",
      "crisis events avoided",
      "admissions avoided",
      "bed days avoided",
      "programme cost",
      "cost per QALY",
    ],
    liveUrl: "#",
      githubUrl: "https://github.com/olivercareyncl/health-economics-scenario-lab",
    image: "/images/frailtyforward.png",
  },
];