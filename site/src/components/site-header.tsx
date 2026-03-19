"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/framework", label: "Framework" },
  { href: "/sandboxes", label: "Sandboxes" },
  { href: "/how-to-use", label: "How to use" },
  { href: "/about", label: "About" },
];

export default function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="group flex min-w-0 items-center gap-3"
            onClick={() => setIsOpen(false)}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-slate-50 text-slate-700 transition group-hover:border-slate-400 group-hover:bg-white">
              <div className="grid grid-cols-2 gap-1">
                <span className="block h-1.5 w-1.5 rounded-sm bg-current" />
                <span className="block h-1.5 w-1.5 rounded-sm bg-current opacity-70" />
                <span className="block h-1.5 w-1.5 rounded-sm bg-current opacity-70" />
                <span className="block h-1.5 w-1.5 rounded-sm bg-current" />
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                Health Economics
              </p>
              <p className="truncate text-sm font-semibold tracking-tight text-slate-900 transition group-hover:text-slate-700">
                Scenario Lab
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white p-2 text-slate-700 transition hover:bg-slate-50 md:hidden"
            aria-expanded={isOpen}
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            {isOpen ? (
              <X className="h-5 w-5" strokeWidth={1.8} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.8} />
            )}
          </button>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {isOpen && (
          <nav className="mt-4 grid gap-2 border-t border-slate-200 pt-4 md:hidden">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}