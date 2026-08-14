export const HOSTELS = [
  "H1",
  "H2",
  "Old Boys Hostel",
  "Girls Hostel",
  "Guest House",
] as const;

export type Hostel = (typeof HOSTELS)[number];

export const HOSTEL_LABELS: Record<string, string> = {
  H1: "H1",
  H2: "H2",
  "Old Boys Hostel": "Old Boys Hostel",
  "Girls Hostel": "Girls Hostel",
  "Guest House": "Guest House",
};

export function generateOTP(length: number = 4): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "PENDING":
      return "var(--color-warning)";
    case "CONFIRMED":
      return "var(--color-primary)";
    case "PURCHASED":
      return "var(--color-accent)";
    case "DELIVERED_SETTLED":
      return "var(--color-success)";
    case "OPEN":
      return "var(--color-primary)";
    case "MATCHED":
      return "var(--color-accent)";
    case "ACTIVE":
      return "var(--color-success)";
    case "CANCELLED":
      return "var(--color-danger)";
    default:
      return "var(--color-text-muted)";
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "PENDING":
      return "Pending Confirmation";
    case "CONFIRMED":
      return "Confirmed";
    case "PURCHASED":
      return "Purchased";
    case "DELIVERED_SETTLED":
      return "Delivered & Settled";
    case "OPEN":
      return "Open";
    case "MATCHED":
      return "Matched";
    case "ACTIVE":
      return "Active";
    case "CANCELLED":
      return "Cancelled";
    default:
      return status;
  }
}

export function getTrustScoreColor(score: number): string {
  if (score >= 5) return "#16a34a";
  if (score >= 1) return "#ca8a04";
  return "#dc2626";
}

export function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function formatPrice(price: number): string {
  return `₹${price.toFixed(0)}`;
}
