import type { ReactNode } from "react";
import { AlertTriangle, ExternalLink } from "lucide-react";
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

// Helper to parse URLs in error messages and make them clickable
const parseDescription = (description: string): ReactNode => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = description.split(urlRegex);
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 underline font-medium"
        >
          {part.length > 40 ? part.substring(0, 40) + '...' : part}
          <ExternalLink className="h-3 w-3" />
        </a>
      );
    }
    return part;
  });
};

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
    <div className="max-w-lg">
      <p className="text-base font-semibold">{title}</p>
      <p className="text-sm text-red-600 mt-1">{parseDescription(description)}</p>
    </div>
    {onRetry && (
      <Button variant="outline" onClick={onRetry} className="border-red-300 text-red-700 hover:bg-red-100">
        {actionLabel}
      </Button>
    )}
  </div>
);

export default ErrorState;

