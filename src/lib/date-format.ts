const GHANA_TIMEZONE = "Africa/Accra";

export function formatGhanaDate(
  date: Date | string,
  options?: {
    includeTime?: boolean;
    includeSeconds?: boolean;
  }
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const { includeTime = true, includeSeconds = false } = options ?? {};

  const dateOptions: Intl.DateTimeFormatOptions = {
    timeZone: GHANA_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  if (includeTime) {
    dateOptions.hour = "numeric";
    dateOptions.minute = "2-digit";
    if (includeSeconds) {
      dateOptions.second = "2-digit";
    }
    dateOptions.hour12 = true;
  }

  return new Intl.DateTimeFormat("en-GH", dateOptions).format(d);
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return diffMinutes === 1 ? "1 minute ago" : `${diffMinutes} minutes ago`;
  }

  if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  }

  if (diffDays === 1) {
    return "Yesterday";
  }

  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }

  return formatGhanaDate(d, { includeTime: false });
}
