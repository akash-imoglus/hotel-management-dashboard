import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Eye } from "lucide-react";
import type { LandingPageMetric } from "@/types";

interface LandingPagesTableProps {
  data: LandingPageMetric[];
  loading?: boolean;
}

const LandingPagesTable = ({ data }: LandingPagesTableProps) => (
  <Card className="h-full bg-white">
    <CardHeader className="pb-2">
      <div className="flex items-center gap-2">
        <Eye className="h-5 w-5 text-cyan-600" />
        <div>
          <CardTitle className="text-slate-900">Top Landing Pages</CardTitle>
          <p className="text-sm text-slate-500">Most visited entry points to your site</p>
        </div>
      </div>
    </CardHeader>
    <CardContent className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="py-3 px-3 font-semibold text-slate-700">Page</th>
            <th className="py-3 px-3 font-semibold text-slate-700 text-right">Sessions</th>
            <th className="py-3 px-3 font-semibold text-slate-700 text-right">Conversion</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((page, index) => {
            // Handle different field names from API
            const pagePath = page.pagePath || (page as any).landingPage || (page as any).page || '';
            const sessions = page.sessions || (page as any).value || 0;
            const conversionRate = page.conversionRate;

            return (
              <tr key={`${pagePath}-${index}`} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-3 max-w-xs" title={pagePath}>
                  <span className="text-slate-900 font-medium block truncate">
                    {pagePath || '(not set)'}
                  </span>
                </td>
                <td className="py-3 px-3 text-slate-700 text-right font-medium">
                  {sessions.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right">
                  {conversionRate != null && conversionRate > 0 ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                      {(conversionRate * 100).toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-slate-400">0%</span>
                  )}
                </td>
              </tr>
            );
          })}
          {data.length === 0 && (
            <tr>
              <td className="py-8 text-center text-slate-500" colSpan={3}>
                No landing page data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </CardContent>
  </Card>
);

export default LandingPagesTable;
