export const GITHUB_URL =
  "https://github.com/olivercareyncl/health-economics-scenario-lab";
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
    githubUrl: GITHUB_URL,
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
      "Earlier diagnosis is attractive in principle, but the value case depends on what actually shifts downstream, not just the ambition to diagnose sooner.",
    bullets: [
      "cases shifted earlier",
      "admissions and bed days",
      "cost differences",
      "QALYs",
      "threshold position",
      "scenario comparison",
    ],
    liveUrl:
      "https://health-economics-scenario-lab-fzfkngiwwyynydcjpfuwii.streamlit.app/",
    githubUrl: GITHUB_URL,
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
    liveUrl:
      "https://health-economics-scenario-lab-7nhwymodtxwru3ftvwhdoc.streamlit.app/",
    githubUrl: GITHUB_URL,
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
    liveUrl:
      "https://health-economics-scenario-lab-dyynjvgfplkuvsxkzrjgwc.streamlit.app/",
    githubUrl: GITHUB_URL,
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
    liveUrl:
      "https://health-economics-scenario-lab-gp9ar7jzr8kcpnckcwgyuf.streamlit.app/",
    githubUrl: GITHUB_URL,
    image: "/images/frailtyforward.png",
  },
  {
    slug: "stableheart",
    name: "StableHeart",
    descriptor: "Cardiovascular Prevention Sandbox",
    category: "Prevent Need",
    status: "Live",
    shortDescription:
      "Explore how proactive cardiovascular management might reduce recurrent events and create value.",
    longDescription:
      "StableHeart explores how secondary prevention and high-risk cardiovascular management might reduce recurrent acute events, admissions, and system cost.",
    question:
      "What would need to be true for proactive cardiovascular management to create value?",
    whyItMatters:
      "Cardiovascular prevention programmes are often attractive at a strategic level, but their economic case depends on uptake, targeting, delivery cost, and the scale of event reduction achieved.",
    bullets: [
      "high-risk population",
      "event reduction",
      "admissions avoided",
      "bed days avoided",
      "programme cost",
      "threshold position",
    ],
    liveUrl:
      "https://health-economics-scenario-lab-jvqybhvadqymamynbwmhov.streamlit.app/",
    githubUrl: GITHUB_URL,
    image: "/images/stableheart.png",
  },
  {
    slug: "steadylungs",
    name: "SteadyLungs",
    descriptor: "Respiratory Stability Sandbox",
    category: "Stabilise Risk",
    status: "Planned",
    shortDescription:
      "Explore how proactive respiratory support might reduce exacerbations, admissions, and value risk.",
    longDescription:
      "SteadyLungs will explore how COPD and respiratory stability interventions might affect exacerbations, admissions, bed use, and value under different assumptions.",
    question:
      "What would need to be true for proactive respiratory support to create value?",
    whyItMatters:
      "Respiratory management programmes are often justified through avoided exacerbations and admissions, but the value case depends heavily on targeting, adherence, and achievable reduction in acute events.",
    bullets: [
      "patients stabilised",
      "exacerbations avoided",
      "admissions avoided",
      "bed days avoided",
      "programme cost",
      "threshold position",
    ],
    liveUrl: "#",
    githubUrl: GITHUB_URL,
    image: "/images/steadylungs.png",
  },
  {
    slug: "kidneykind",
    name: "KidneyKind",
    descriptor: "Kidney Care Sandbox",
    category: "Stabilise Risk",
    status: "Planned",
    shortDescription:
      "Explore how earlier kidney management might reduce progression, acute use, and downstream cost.",
    longDescription:
      "KidneyKind will explore how chronic kidney disease management might affect progression, hospital activity, and value under different assumptions.",
    question:
      "What would need to be true for earlier kidney support to create value?",
    whyItMatters:
      "Kidney pathways carry substantial long-term cost and risk, but the economic logic of proactive management depends on timing, uptake, persistence, and how much progression is actually slowed.",
    bullets: [
      "patients stabilised",
      "progression avoided",
      "admissions avoided",
      "downstream cost avoided",
      "programme cost",
      "threshold position",
    ],
    liveUrl: "#",
    githubUrl: GITHUB_URL,
    image: "/images/kidneykind.png",
  },
  {
    slug: "diabetesforward",
    name: "DiabetesForward",
    descriptor: "Diabetes Prevention Sandbox",
    category: "Prevent Need",
    status: "Planned",
    shortDescription:
      "Explore how diabetes prevention and management might reduce complications and create value.",
    longDescription:
      "DiabetesForward will explore how prevention and proactive diabetes management might affect complications, admissions, and system value under uncertainty.",
    question:
      "What would need to be true for proactive diabetes management to create value?",
    whyItMatters:
      "Diabetes programmes are often strategically attractive, but the value case depends on sustained behaviour change, progression delay, complication reduction, and programme cost.",
    bullets: [
      "patients reached",
      "complications avoided",
      "admissions avoided",
      "long-term cost impact",
      "programme cost",
      "threshold position",
    ],
    liveUrl: "#",
    githubUrl: GITHUB_URL,
    image: "/images/diabetesforward.png",
  },
  {
    slug: "careshift",
    name: "CareShift",
    descriptor: "Care Setting Shift Sandbox",
    category: "Shift Care Setting",
    status: "Planned",
    shortDescription:
      "Explore how shifting care to lower-intensity settings might reduce cost and create value.",
    longDescription:
      "CareShift will explore how moving activity from higher-cost settings to lower-intensity community, outpatient, or home-based models might change utilisation, cost, and value under different assumptions.",
    question:
      "Under what conditions does shifting care to a lower-intensity setting create value?",
    whyItMatters:
      "Care setting shift is often strategically attractive, but the value case depends on whether activity is genuinely substituted, whether quality is maintained, and whether delivery costs remain controlled.",
    bullets: [
      "patients shifted in setting",
      "acute activity avoided",
      "bed days avoided",
      "cost substitution",
      "programme cost",
      "threshold position",
    ],
    liveUrl: "#",
    githubUrl: GITHUB_URL,
    image: "/images/careshift.png",
  },
  {
    slug: "signalpath",
    name: "SignalPath",
    descriptor: "Triage and Decision Support Sandbox",
    category: "Improve Decisions",
    status: "Planned",
    shortDescription:
      "Explore how better triage and decision support might improve routing, reduce unnecessary activity, and create value.",
    longDescription:
      "SignalPath will explore how triage improvement, prioritisation, and decision support might change downstream activity, escalation, and value under different assumptions.",
    question:
      "Under what conditions does better triage or decision support create value?",
    whyItMatters:
      "Decision support interventions often sound efficient in principle, but the value case depends on how much decision quality improves, whether unnecessary activity is actually avoided, and how reliably users follow the guidance.",
    bullets: [
      "triage accuracy",
      "activity avoided",
      "better routing",
      "escalations avoided",
      "programme cost",
      "threshold position",
    ],
    liveUrl: "#",
    githubUrl: GITHUB_URL,
    image: "/images/signalpath.png",
  },
];