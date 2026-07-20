"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createMonitor } from "@/lib/api";

export function AddMonitorDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createMonitor(url);
      setUrl("");
      setOpen(false);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to add monitor");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5 rounded-md border-2 border-brutal-border bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="size-4" />
          Add monitor
        </Button>
      </DialogTrigger>
      <DialogContent className="border-2 border-brutal-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a URL to monitor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              required
              placeholder="https://example.com"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              className="border-2 border-brutal-border"
            />
            {error && <p className="text-sm text-status-down">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full border-2 border-brutal-border bg-primary text-primary-foreground"
            >
              {submitting ? "Adding..." : "Add monitor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
