"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active =
    pathname === href || (href !== "/" && pathname?.startsWith(href));
  return (
    <Link
      href={href}
      className={[
        "px-3 py-2 rounded-md text-sm font-medium transition",
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-700 hover:bg-white/70 hover:text-slate-900",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

// PUBLIC_INTERFACE
export function AppShell({ children }: { children: React.ReactNode }) {
  /** Application shell with header navigation and responsive content container. */
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500" />
              <div className="leading-tight">
                <div className="text-sm font-semibold">AutoBrowse</div>
                <div className="text-xs text-slate-500">
                  Car brochure & inquiries
                </div>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              <NavLink href="/">Browse</NavLink>
              <NavLink href="/compare">Compare</NavLink>
              <NavLink href="/favorites">Favorites</NavLink>
              <NavLink href="/inquiry">Inquiry</NavLink>
              <NavLink href="/admin">Admin</NavLink>
            </nav>

            <div className="md:hidden">
              <Link
                href="/"
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
              >
                Menu
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-600">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              Built with Next.js + FastAPI. Primary:{" "}
              <span className="font-medium text-blue-600">#3b82f6</span>, Accent:{" "}
              <span className="font-medium text-cyan-600">#06b6d4</span>
            </div>
            <div className="text-xs">
              Tip: Favorites are stored per-browser via a local anonymous user
              key.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
