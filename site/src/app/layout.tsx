import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Health Economics Scenario Lab",
  description: "Interactive sandboxes for exploring value under uncertainty.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="font-semibold tracking-tight text-slate-900">
              Health Economics Scenario Lab
            </Link>
            <nav className="flex items-center gap-6 text-sm text-slate-600">
              <Link href="/" className="hover:text-slate-900">
                Home
              </Link>
              <Link href="/about" className="hover:text-slate-900">
                About
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}