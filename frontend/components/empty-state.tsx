import { Activity } from "lucide-react";
import { AddMonitorDialog } from "@/components/add-monitor-dialog";

export function EmptyState({ onCreated }: { onCreated: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-brutal-border px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border-2 border-brutal-border">
        <Activity className="size-5 text-muted-foreground" />
      </div>
      <div>
        <p className="font-bold">No monitors yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a URL to start tracking its uptime and response time.
        </p>
      </div>
      <AddMonitorDialog onCreated={onCreated} />
    </div>
  );
}
