export function StatTile({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border-2 border-brutal-border bg-card px-4 py-4 sm:px-5 sm:py-5">
      <p
        className={`font-mono text-2xl font-bold tabular-nums sm:text-3xl ${accent ? "text-accent" : "text-foreground"}`}
      >
        {value}
      </p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
