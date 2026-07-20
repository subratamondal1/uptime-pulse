"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-8 w-16 rounded-full border-2 border-brutal-border" />;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="flex h-8 w-16 items-center justify-between rounded-full border-2 border-brutal-border px-1.5"
    >
      <Sun className={`size-4 ${isDark ? "text-muted-foreground" : "text-accent"}`} />
      <Moon className={`size-4 ${isDark ? "text-accent" : "text-muted-foreground"}`} />
    </button>
  );
}
