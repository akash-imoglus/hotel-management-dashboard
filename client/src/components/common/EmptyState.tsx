import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionIcon?: ReactNode;
  onAction?: () => void;
  className?: string;
}

const EmptyState = ({
  title,
  description,
  actionLabel,
  actionIcon,
  onAction,
  className,
}: EmptyStateProps) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-white/90 p-10 text-center shadow-soft",
      className
    )}
  >
    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
    <p className="max-w-md text-sm text-slate-500">{description}</p>
    {actionLabel && onAction && (
      <Button onClick={onAction} className="gap-2">
        {actionIcon}
        {actionLabel}
      </Button>
    )}
  </div>
);

export default EmptyState;

