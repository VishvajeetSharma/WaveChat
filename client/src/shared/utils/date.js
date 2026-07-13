export function initials(name) {
  return name.slice(0, 2).toUpperCase();
}

export function formatClockTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Short relative time for the sidebar: clock time if today, else a short date. */
export function formatContactTimestamp(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return formatClockTime(iso);
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

/** "Today" / "Yesterday" / full date, for day dividers in a message list. */
export function formatDayLabel(iso) {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
}
