import type { Metadata } from "next";
import Link from "next/link";
import { GITHUB_URL, LINKEDIN_URL } from "@/data/apps";
import "./globals.css";

export const metadata: Metadata = {
  title: "Health Economics Scenario Lab",
  description:
    "Interactive decision sandboxes for exploring how healthcare interventions generate value under uncertainty.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-900 antialiased">
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
              <Link href="/" className="font-semibold tracking-tight">
                Health Economics Scenario Lab
              </Link>

              <nav className="flex items-center gap-6 text-sm text-slate-600">
                <Link href="/">Home</Link>
                <Link href="/framework">Framework</Link>
                <Link href="/sandboxes">Sandboxes</Link>
                <Link href="/how-to-use">How to use</Link>
                <Link href="/about">About</Link>
              </nav>
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="mt-16 border-t border-slate-200 bg-slate-50">
            <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-[1.4fr_0.8fr]">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                  Health Economics Scenario Lab
                </p>
                <h2 className="mt-3 text-lg font-semibold tracking-tight">
                  Built by Oliver Carey
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  A platform of interactive healthcare decision sandboxes for
                  exploring how interventions and service changes might affect
                  activity, cost, outcomes, and value under uncertainty.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                  Links
                </p>
                <div className="mt-3 flex flex-col gap-3 text-sm text-slate-700">
                  <Link
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="transition hover:text-slate-900"
                  >
                    GitHub
                  </Link>
                  <Link
                    href={LINKEDIN_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="transition hover:text-slate-900"
                  >
                    LinkedIn
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}