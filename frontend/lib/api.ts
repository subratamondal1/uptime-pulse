import { z } from "zod";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export const CheckSchema = z.object({
  id: z.number(),
  status_code: z.number().nullable(),
  response_time_ms: z.number().nullable(),
  is_up: z.boolean(),
  checked_at: z.string(),
});

export const MonitorSchema = z.object({
  id: z.string(),
  url: z.string(),
  created_at: z.string(),
  latest_check: CheckSchema.nullable(),
});

export type Check = z.infer<typeof CheckSchema>;
export type Monitor = z.infer<typeof MonitorSchema>;

export async function listMonitors(): Promise<Monitor[]> {
  const res = await fetch(`${API_BASE}/monitors`, { cache: "no-store" });
  if (!res.ok) throw new Error("failed to load monitors");
  return z.array(MonitorSchema).parse(await res.json());
}

export async function createMonitor(url: string): Promise<Monitor> {
  const res = await fetch(`${API_BASE}/monitors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error((await res.json()).detail ?? "failed to create monitor");
  return MonitorSchema.parse(await res.json());
}

export async function deleteMonitor(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/monitors/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("failed to delete monitor");
}

export async function listChecks(id: string): Promise<Check[]> {
  const res = await fetch(`${API_BASE}/monitors/${id}/checks`, { cache: "no-store" });
  if (!res.ok) throw new Error("failed to load checks");
  return z.array(CheckSchema).parse(await res.json());
}
