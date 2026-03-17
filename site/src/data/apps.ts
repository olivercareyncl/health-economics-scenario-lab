export type AppItem = {
  slug: string;
  name: string;
  descriptor: string;
  shortDescription: string;
  longDescription: string;
  bullets: string[];
  liveUrl: string;
  githubUrl: string;
  image: string;
};

export const apps: AppItem[] = [
  {
    slug: "safestep",
    name: "SafeStep",
    descriptor: "Falls Prevention ROI Sandbox",
    shortDescription:
      "Test how different assumptions affect the value case for falls prevention.",
    longDescription:
      "Falls prevention often sounds obviously worthwhile. SafeStep is designed to test what would actually need to be true for the value case to hold.",
    bullets: [
      "intervention effectiveness",
      "delivery cost",
      "falls avoided",
      "admissions and bed days",
      "threshold position",
      "bounded uncertainty",
    ],
    liveUrl: "https://safestep-mnjcyn8idt5rrddqsmnncd.streamlit.app/",
    githubUrl: "https://github.com/YOUR-USERNAME/health-economics-scenario-lab",
    image: "/images/safestep.png",
  },
  {
    slug: "clearpath",
    name: "ClearPath",
    descriptor: "Early Diagnosis Value Sandbox",
    shortDescription:
      "Explore how shifting diagnosis earlier might change pressure, cost, and value.",
    longDescription:
      "ClearPath explores how shifting diagnosis earlier might affect pathway pressure, treatment-related costs, and value.",
    bullets: [
      "cases shifted earlier",
      "admissions and bed days",
      "cost differences",
      "QALYs",
      "threshold position",
      "scenario comparison",
    ],
    liveUrl: "#",
    githubUrl: "https://github.com/YOUR-USERNAME/health-economics-scenario-lab",
    image: "/images/clearpath.png",
  },
  {
    slug: "waitwise",
    name: "WaitWise",
    descriptor: "Waiting List Intervention Value Sandbox",
    shortDescription:
      "Test how waiting list interventions might affect backlog pressure and downstream impact.",
    longDescription:
      "WaitWise focuses on whether waiting list interventions create value once escalation, admissions, and downstream impact are considered.",
    bullets: [
      "waiting list reduction",
      "escalations avoided",
      "admissions and bed days",
      "programme cost",
      "QALYs",
      "threshold position",
    ],
    liveUrl: "#",
    githubUrl: "https://github.com/YOUR-USERNAME/health-economics-scenario-lab",
    image: "/images/waitwise.png",
  },
  {
    slug: "pathshift",
    name: "PathShift",
    descriptor: "Service Redesign Value Sandbox",
    shortDescription:
      "Explore where value might come from in pathway redesign.",
    longDescription:
      "PathShift is designed to make pathway redesign logic more testable by separating activity change, admission impact, follow-up burden, and value.",
    bullets: [
      "patients shifted in pathway",
      "admissions avoided",
      "follow-ups avoided",
      "bed-day impact",
      "programme cost",
      "cost per QALY",
    ],
    liveUrl: "#",
    githubUrl: "https://github.com/YOUR-USERNAME/health-economics-scenario-lab",
    image: "/images/pathshift.png",
  },
  {
    slug: "frailtyforward",
    name: "FrailtyForward",
    descriptor: "Frailty and Community Support Value Sandbox",
    shortDescription:
      "Test how earlier frailty support might change crisis events, admissions, and value.",
    longDescription:
      "FrailtyForward explores how earlier frailty support might change crisis events, admissions, bed use, and value under different assumptions.",
    bullets: [
      "patients stabilised",
      "crisis events avoided",
      "admissions avoided",
      "bed days avoided",
      "programme cost",
      "cost per QALY",
    ],
    liveUrl: "#",
    githubUrl: "https://github.com/YOUR-USERNAME/health-economics-scenario-lab",
    image: "/images/frailtyforward.png",
  },
];