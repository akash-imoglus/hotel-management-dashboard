import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onRetry?: () => void;
  icon?: ReactNode;
  className?: string;
}

const ErrorState = ({
  title = "Something went wrong",
  description = "Please try again in a moment.",
  actionLabel = "Retry",
  onRetry,
  icon,
  className,
}: ErrorStateProps) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center gap-3 rounded-xl border border-red-100 bg-red-50/60 p-6 text-center text-red-700",
      className
    )}
  >
    <div className="text-red-500">{icon ?? <AlertTriangle className="h-6 w-6" />}</div>
    <div>
      <p className="text-base font-semibold">{title}</p>
      <p className="text-sm text-red-600">{description}</p>
    </div>
    {onRetry && (
      <Button variant="outline" onClick={onRetry} className="border-red-300 text-red-700 hover:bg-red-100">
        {actionLabel}
      </Button>
    )}
  </div>
);

export default ErrorState;

