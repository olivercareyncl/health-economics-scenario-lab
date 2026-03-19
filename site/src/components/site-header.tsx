"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/framework", label: "Framework" },
    { href: "/sandboxes", label: "Sandboxes" },
    { href: "/how-to-use", label: "How to use" },
    { href: "/about", label: "About" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-slate-900 transition hover:text-slate-700"
            onClick={() => setIsOpen(false)}
          >
            Health Economics Scenario Lab
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

          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {isOpen && (
          <nav className="mt-4 grid gap-2 border-t border-slate-200 pt-4 md:hidden">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}