export type DateRangePreset = "7d" | "30d" | "last28days" | "last7days" | "last30days" | "custom";

export const DATE_RANGE_OPTIONS: Array<{
  label: string;
  value: DateRangePreset;
}> = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 28 days", value: "last28days" },
  { label: "Last 30 days", value: "30d" },
  { label: "Custom range", value: "custom" },
];

