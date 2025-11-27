import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, subDays, subWeeks, subMonths } from "date-fns";
import type { DateRange } from "@/types";
import type { DateRangePreset } from "@/constants/dateRanges";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function buildDateRange(
  preset: DateRangePreset | "last28days" | "last7days" | "last30days",
  customRange?: { startDate?: string; endDate?: string }
): DateRange {
  const today = new Date();
  let startDate: Date;
  let endDate: Date = today;

  if (customRange?.startDate && customRange?.endDate) {
    return {
      startDate: customRange.startDate,
      endDate: customRange.endDate,
    };
  }

  switch (preset) {
    case "7d":
    case "last7days":
      startDate = subDays(today, 7);
      break;
    case "30d":
    case "last30days":
      startDate = subDays(today, 30);
      break;
    case "last28days":
      startDate = subDays(today, 28);
      break;
    case "custom":
      // Default to last 7 days if custom but no dates provided
      startDate = subDays(today, 7);
      break;
    default:
      startDate = subDays(today, 7);
  }

  return {
    startDate: format(startDate, "yyyy-MM-dd"),
    endDate: format(endDate, "yyyy-MM-dd"),
  };
}

