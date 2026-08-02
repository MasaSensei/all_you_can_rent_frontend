import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStatusVariant(status: string) {
  switch (status.toLowerCase()) {
    case "active":
    case "confirmed":
    case "completed":
      return "success";

    case "pending":
      return "warning";

    case "failed":
    case "cancelled":
      return "error";

    default:
      return "default";
  }
}
