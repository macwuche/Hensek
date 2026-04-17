import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit",
  });
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function getInitials(name: string): string {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).replace(/_/g, " ");
}

export function getDashboardPath(role: string, deptSlug: string | null): string {
  if (role === "md") return "/md";
  if (role === "hr") return "/hr";
  if (role === "safety") return "/safety";
  if (role === "security") return "/security";
  return deptSlug ? `/${deptSlug}` : "/staff";
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    active: "hensek-badge-green",
    pending: "hensek-badge-yellow",
    suspended: "hensek-badge-red",
    approved: "hensek-badge-green",
    rejected: "hensek-badge-red",
    escalated_to_md: "hensek-badge-blue",
    md_approved: "hensek-badge-green",
    md_rejected: "hensek-badge-red",
    hr_review: "hensek-badge-yellow",
    assigned: "hensek-badge-blue",
    in_progress: "hensek-badge-yellow",
    completed: "hensek-badge-green",
    missed: "hensek-badge-red",
    open: "hensek-badge-green",
    closed: "hensek-badge-gray",
  };
  return map[status] || "hensek-badge-gray";
}

export const APPLICATION_TYPES = [
  { value: "leave", label: "Leave Application" },
  { value: "overtime", label: "Overtime Request" },
  { value: "equipment", label: "Equipment / PPE Request" },
  { value: "training", label: "Training / Certification" },
  { value: "incident", label: "Incident / Accident Report" },
  { value: "grievance", label: "Grievance / Complaint" },
  { value: "schedule_change", label: "Schedule Change" },
  { value: "medical", label: "Medical / Sick Note" },
];
