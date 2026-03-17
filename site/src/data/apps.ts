export const GITHUB_URL = "https://github.com/olivercareyncl/health-economics-scenario-lab";
export const LINKEDIN_URL = "https://uk.linkedin.com/in/oliver-carey";

export type AppStatus = "Live" | "In progress" | "Planned";

export type AppItem = {
  slug: string;
  name: string;
  descriptor: string;
  category: string;
  status: AppStatus;
  shortDescription: string;
  longDescription: string;
  question: string;
  whyItMatters: string;
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
    category: "Prevention",
    status: "Live",
    shortDescription:
      "Test how different assumptions affect the value case for falls prevention.",
    longDescription:
      "Falls prevention often sounds obviously worthwhile. SafeStep is designed to test what would actually need to be true for the value case to hold.",
    question:
      "What would need to be true for falls prevention to look worthwhile?",
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
    descriptor: "Early Diagnosis Value Sandbox",
    category: "Diagnosis",
    status: "Live",
    shortDescription:
      "Explore how shifting diagnosis earlier might change pressure, cost, and value.",
    longDescription:
      "ClearPath explores how shifting diagnosis earlier might affect pathway pressure, treatment-related costs, and value.",
    question:
      "What shifts would make earlier diagnosis create value?",
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
    descriptor: "Waiting List Intervention Value Sandbox",
    category: "Access",
    status: "Live",
    shortDescription:
      "Test how waiting list interventions might affect backlog pressure and downstream impact.",
    longDescription:
      "WaitWise focuses on whether waiting list interventions create value once escalation, admissions, and downstream impact are considered.",
    question:
      "When do waiting list interventions improve value, not just throughput optics?",
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
    descriptor: "Service Redesign Value Sandbox",
    category: "Redesign",
    status: "Live",
    shortDescription:
      "Explore where value might come from in pathway redesign.",
    longDescription:
      "PathShift is designed to make pathway redesign logic more testable by separating activity change, admission impact, follow-up burden, and value.",
    question:
      "Where does value actually come from in pathway redesign?",
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
    descriptor: "Frailty and Community Support Value Sandbox",
    category: "Community care",
    status: "Live",
    shortDescription:
      "Test how earlier frailty support might change crisis events, admissions, and value.",
    longDescription:
      "FrailtyForward explores how earlier frailty support might change crisis events, admissions, bed use, and value under different assumptions.",
    question:
      "When does earlier frailty support hold up economically?",
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