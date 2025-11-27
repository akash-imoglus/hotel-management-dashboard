import { CalendarDays } from "lucide-react";
import { DATE_RANGE_OPTIONS } from "@/constants/dateRanges";
import type { DateRangePreset } from "@/constants/dateRanges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";

interface DateRangeSelectorProps {
  preset: DateRangePreset;
  onPresetChange: (value: DateRangePreset) => void;
  customRange: { startDate?: string; endDate?: string };
  onCustomChange: (field: "startDate" | "endDate", value: string) => void;
  onApply: () => void;
  disabled?: boolean;
}

const DateRangeSelector = ({
  preset,
  onPresetChange,
  customRange,
  onCustomChange,
  onApply,
  disabled,
}: DateRangeSelectorProps) => (
  <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-100 bg-white/80 p-4">
    <div className="flex items-center gap-2 text-slate-500">
      <CalendarDays className="h-5 w-5 text-hotel-ocean" />
      <p className="text-sm font-medium">Date range</p>
    </div>
    <NativeSelect
      value={preset}
      onChange={(event) => onPresetChange(event.target.value as DateRangePreset)}
      disabled={disabled}
      className="w-48"
    >
      {DATE_RANGE_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </NativeSelect>

    {preset === "custom" && (
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="date"
          value={customRange.startDate ?? ""}
          onChange={(event) => onCustomChange("startDate", event.target.value)}
          disabled={disabled}
        />
        <span className="text-slate-400">to</span>
        <Input
          type="date"
          value={customRange.endDate ?? ""}
          onChange={(event) => onCustomChange("endDate", event.target.value)}
          disabled={disabled}
        />
      </div>
    )}

    <Button
      variant="secondary"
      onClick={onApply}
      disabled={disabled || (preset === "custom" && (!customRange.startDate || !customRange.endDate))}
    >
      Apply
    </Button>
  </div>
);

export default DateRangeSelector;

