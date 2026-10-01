export function formatElapsedTime(
  timestamp: string | null | undefined,
  nowMs: number = Date.now()
): { primary: string; secondary: string } {
  if (!timestamp) return { primary: '—', secondary: 'never' };

  const date = new Date(timestamp);
  const then = date.getTime();
  if (!Number.isFinite(then)) return { primary: '—', secondary: 'invalid date' };

  const diffMs = Math.max(0, nowMs - then);
  const totalMinutes = Math.floor(diffMs / 60_000);
  const totalHours = Math.floor(diffMs / 3_600_000);
  const totalDays = Math.floor(diffMs / 86_400_000);

  let primary: string;
  if (totalMinutes < 1) {
    primary = 'just now';
  } else if (totalMinutes < 60) {
    primary = `${totalMinutes}m`;
  } else if (totalHours < 24) {
    const remainder = totalMinutes % 60;
    primary = remainder ? `${totalHours}h ${remainder}m` : `${totalHours}h`;
  } else if (totalDays < 7) {
    const remainder = totalHours % 24;
    primary = remainder ? `${totalDays}d ${remainder}h` : `${totalDays}d`;
  } else {
    primary = `${totalDays}d`;
  }

  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const today = new Date(nowMs);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

  const dateLabel = date >= todayStart
    ? 'Today'
    : date >= yesterdayStart
      ? 'Yesterday'
      : date.toLocaleDateString([], { month: 'short', day: 'numeric' });

  return { primary, secondary: `${dateLabel} · ${timeStr}` };
}
