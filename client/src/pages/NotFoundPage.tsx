import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFoundPage = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
    <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
      404
    </p>
    <h1 className="text-4xl font-bold text-hotel-navy">Page not found</h1>
    <p className="max-w-md text-sm text-slate-500">
      The page you are looking for might have been removed, had its name changed,
      or is temporarily unavailable.
    </p>
    <Button asChild>
      <Link to="/dashboard">Return to dashboard</Link>
    </Button>
  </div>
);

export default NotFoundPage;

