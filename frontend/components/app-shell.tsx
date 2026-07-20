"use client";

import { Activity, Menu, X } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

function BrandBlock() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex size-8 items-center justify-center rounded-md border-2 border-brutal-border bg-accent text-accent-foreground">
        <Activity className="size-4" />
      </div>
      <div>
        <p className="text-sm font-bold tracking-tight">Uptime Monitor</p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Epifi Take-Home
        </p>
      </div>
    </div>
  );
}

function SidebarBody() {
  return (
    <div className="flex h-full flex-col justify-between p-5">
      <div className="flex flex-col gap-8">
        <BrandBlock />
        <nav className="flex flex-col gap-1">
          <span className="rounded-md border-2 border-brutal-border bg-primary px-3 py-2 text-sm font-bold text-primary-foreground">
            Dashboard
          </span>
        </nav>
      </div>
      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Theme
        </span>
        <ThemeToggle />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b-2 border-brutal-border bg-background px-4 lg:hidden">
        <BrandBlock />
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setDrawerOpen(true)}
          className="flex size-9 items-center justify-center rounded-md border-2 border-brutal-border"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 border-r-2 border-brutal-border bg-background">
            <div className="flex justify-end p-3">
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
                className="flex size-8 items-center justify-center rounded-md border-2 border-brutal-border"
              >
                <X className="size-4" />
              </button>
            </div>
            <SidebarBody />
          </div>
        </div>
      )}

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r-2 border-brutal-border bg-background lg:flex">
        <SidebarBody />
      </aside>

      <main className="pt-14 lg:pl-64 lg:pt-0">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
