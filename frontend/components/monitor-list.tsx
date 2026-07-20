import { Trash2 } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Monitor } from "@/lib/api";

function formatResponseTime(ms: number | null): string {
  if (ms === null) return "—";
  return `${ms.toFixed(0)} ms`;
}

function formatTimestamp(iso: string | undefined): string {
  if (!iso) return "never";
  return new Date(iso).toLocaleTimeString();
}

export function MonitorList({
  monitors,
  onDelete,
}: {
  monitors: Monitor[];
  onDelete: (id: string) => void;
}) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-lg border-2 border-brutal-border md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Response time</TableHead>
              <TableHead>Last checked</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {monitors.map((monitor) => (
              <TableRow key={monitor.id}>
                <TableCell className="max-w-64 truncate font-medium">
                  {monitor.url}
                </TableCell>
                <TableCell>
                  <StatusBadge isUp={monitor.latest_check?.is_up ?? false} />
                </TableCell>
                <TableCell className="font-mono tabular-nums">
                  {formatResponseTime(
                    monitor.latest_check?.response_time_ms ?? null,
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatTimestamp(monitor.latest_check?.checked_at)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete monitor"
                    onClick={() => onDelete(monitor.id)}
                  >
                    <Trash2 className="size-4 text-status-down" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 md:hidden">
        {monitors.map((monitor) => (
          <div
            key={monitor.id}
            className="rounded-lg border-2 border-brutal-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="break-all font-medium">{monitor.url}</p>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete monitor"
                onClick={() => onDelete(monitor.id)}
              >
                <Trash2 className="size-4 text-status-down" />
              </Button>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <StatusBadge isUp={monitor.latest_check?.is_up ?? false} />
              <span className="font-mono text-sm tabular-nums text-muted-foreground">
                {formatResponseTime(
                  monitor.latest_check?.response_time_ms ?? null,
                )}
              </span>
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Checked {formatTimestamp(monitor.latest_check?.checked_at)}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
