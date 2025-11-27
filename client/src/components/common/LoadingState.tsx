import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

const LoadingState = ({
  message = "Loading...",
  className,
}: LoadingStateProps) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center gap-3 text-slate-500",
      className
    )}
  >
    <span className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-hotel-sky" />
    <p className="text-sm font-medium">{message}</p>
  </div>
);

export default LoadingState;

