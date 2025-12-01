import { CalendarDays } from "lucide-react";
import { DATE_RANGE_OPTIONS } from "@/constants/dateRanges";
import type { DateRangePreset } from "@/constants/dateRanges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";

// Full control pattern - with Apply button
interface FullControlProps {
  preset: DateRangePreset;
  onPresetChange: (value: DateRangePreset) => void;
  customRange: { startDate?: string; endDate?: string };
  onCustomChange: (field: "startDate" | "endDate", value: string) => void;
  onApply: () => void;
  disabled?: boolean;
  onDateRangeChange?: never;
}

// Simple pattern - instant change on select
interface SimpleProps {
  onDateRangeChange: (preset: DateRangePreset) => void;
  disabled?: boolean;
  preset?: never;
  onPresetChange?: never;
  customRange?: never;
  onCustomChange?: never;
  onApply?: never;
}

type DateRangeSelectorProps = FullControlProps | SimpleProps;

const DateRangeSelector = (props: DateRangeSelectorProps) => {
  // Simple pattern - instant change
  if ('onDateRangeChange' in props && props.onDateRangeChange) {
    const { onDateRangeChange, disabled } = props;
    return (
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-slate-500" />
        <NativeSelect
          onChange={(event) => onDateRangeChange(event.target.value as DateRangePreset)}
          disabled={disabled}
          className="w-40"
          defaultValue="7d"
        >
          {DATE_RANGE_OPTIONS.filter(opt => opt.value !== 'custom').map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
      </div>
    );
  }

  // Full control pattern - with Apply button
  const { preset, onPresetChange, customRange, onCustomChange, onApply, disabled } = props as FullControlProps;

  return (
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
};

export default DateRangeSelector;
