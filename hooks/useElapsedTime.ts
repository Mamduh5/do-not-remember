import { useMemo } from 'react';

/**
 * Given an ISO 8601 timestamp, returns human-readable elapsed components.
 *
 * Returns:
 *   primary   — "14h 23m", "3d 2h", "just now"
 *   secondary — "Yesterday · 9:18 PM", "Oct 1 · 3:45 AM"
 */
export function useElapsedTime(timestamp: string | null | undefined): {
  primary: string;
  secondary: string;
} {
  return useMemo(() => {
    if (!timestamp) {
      return { primary: '—', secondary: 'never' };
    }

    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const diffMs = now - then;

    if (diffMs < 0) {
      return { primary: '0m', secondary: 'just now' };
    }

    const totalMinutes = Math.floor(diffMs / 60_000);
    const totalHours = Math.floor(diffMs / 3_600_000);
    const totalDays = Math.floor(diffMs / 86_400_000);

    let primary: string;
    if (totalMinutes < 1) {
      primary = 'just now';
    } else if (totalMinutes < 60) {
      primary = `${totalMinutes}m`;
    } else if (totalHours < 24) {
      const h = totalHours;
      const m = totalMinutes - h * 60;
      primary = m > 0 ? `${h}h ${m}m` : `${h}h`;
    } else if (totalDays < 7) {
      const d = totalDays;
      const h = totalHours - d * 24;
      primary = h > 0 ? `${d}d ${h}h` : `${d}d`;
    } else {
      primary = `${totalDays}d`;
    }

    // Secondary: label + time
    const date = new Date(timestamp);
    const timeStr = date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const yesterdayStart = new Date(todayStart.getTime() - 86_400_000);

    let dateLabel: string;
    if (date >= todayStart) {
      dateLabel = 'Today';
    } else if (date >= yesterdayStart) {
      dateLabel = 'Yesterday';
    } else {
      dateLabel = date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
      });
    }

    return {
      primary,
      secondary: `${dateLabel} · ${timeStr}`,
    };
  }, [timestamp]);
}
