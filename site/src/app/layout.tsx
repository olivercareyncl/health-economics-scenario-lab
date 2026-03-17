import type { Metadata } from "next";
import Link from "next/link";
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
        <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link href="/" className="font-semibold tracking-tight">
              Health Economics Scenario Lab
            </Link>

            <nav className="flex items-center gap-6 text-sm text-slate-600">
              <Link href="/">Home</Link>
              <Link href="/framework">Framework</Link>
              <Link href="/sandboxes">Sandboxes</Link>
              <Link href="/about">About</Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>
      </body>
    </html>
  );
}