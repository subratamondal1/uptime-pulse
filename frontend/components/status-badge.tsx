export function StatusBadge({ isUp }: { isUp: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-0.5 font-mono text-xs font-bold uppercase tracking-wide ${
        isUp
          ? "border-status-up text-status-up"
          : "border-status-down text-status-down"
      }`}
    >
      <span className={`size-1.5 rounded-full ${isUp ? "bg-status-up" : "bg-status-down"}`} />
      {isUp ? "Up" : "Down"}
    </span>
  );
}
