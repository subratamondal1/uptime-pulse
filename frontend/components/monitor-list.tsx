"use client";

import { Check, Copy, ExternalLink, Trash2 } from "lucide-react";
import { useState } from "react";
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

function RowActions({ url, onDelete }: { url: string; onDelete: () => void }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-center justify-end gap-0.5">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Copy URL"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="size-4 text-status-up" />
        ) : (
          <Copy className="size-4" />
        )}
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label="Open URL" asChild>
        <a href={url} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="size-4" />
        </a>
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Delete monitor"
        onClick={onDelete}
      >
        <Trash2 className="size-4 text-status-down" />
      </Button>
    </div>
  );
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
                  <a
                    href={monitor.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent hover:underline"
                  >
                    {monitor.url}
                  </a>
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
                  <RowActions
                    url={monitor.url}
                    onDelete={() => onDelete(monitor.id)}
                  />
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
              <a
                href={monitor.url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all font-medium hover:text-accent hover:underline"
              >
                {monitor.url}
              </a>
              <RowActions
                url={monitor.url}
                onDelete={() => onDelete(monitor.id)}
              />
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
