"use client";

import { useCallback, useEffect, useState } from "react";
import { AddMonitorDialog } from "@/components/add-monitor-dialog";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { MonitorList } from "@/components/monitor-list";
import { StatTile } from "@/components/stat-tile";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteMonitor, listMonitors, type Monitor } from "@/lib/api";

const POLL_INTERVAL_MS = 10_000;

export default function DashboardPage() {
  const [monitors, setMonitors] = useState<Monitor[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    listMonitors()
      .then((data) => {
        setMonitors(data);
        setError(null);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "failed to load"),
      );
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  async function handleDelete(id: string) {
    await deleteMonitor(id);
    refresh();
  }

  const total = monitors?.length ?? 0;
  const up = monitors?.filter((m) => m.latest_check?.is_up).length ?? 0;
  const down = total - up;
  const responseTimes = (monitors ?? [])
    .map((m) => m.latest_check?.response_time_ms)
    .filter((v): v is number => v !== null && v !== undefined);
  const avgResponse =
    responseTimes.length > 0
      ? Math.round(
          responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        )
      : null;

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Monitors
            </h1>
            <p className="text-sm text-muted-foreground">
              Live status, checked every minute.
            </p>
          </div>
          {total > 0 && <AddMonitorDialog onCreated={refresh} />}
        </div>

        {error && (
          <div className="rounded-lg border-2 border-status-down px-4 py-3 text-sm text-status-down">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatTile label="Total monitors" value={String(total)} />
          <StatTile label="Up" value={String(up)} />
          <StatTile label="Down" value={String(down)} accent={down > 0} />
          <StatTile
            label="Avg response"
            value={avgResponse !== null ? `${avgResponse} ms` : "—"}
          />
        </div>

        {monitors === null ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        ) : monitors.length === 0 ? (
          <EmptyState onCreated={refresh} />
        ) : (
          <MonitorList monitors={monitors} onDelete={handleDelete} />
        )}
      </div>
    </AppShell>
  );
}
