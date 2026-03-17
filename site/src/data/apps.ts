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
  // ...your app objects
];