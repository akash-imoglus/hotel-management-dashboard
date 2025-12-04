import ReactCountryFlag from "react-country-flag";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { GeoMetric } from "@/types";

interface GeoTableProps {
  data: GeoMetric[];
}

const GeoTable = ({ data }: GeoTableProps) => (
  <Card className="h-full bg-white">
    <CardHeader className="pb-2">
      <CardTitle className="text-slate-900">Top Countries</CardTitle>
      <p className="text-sm text-slate-500">Users & sessions by location</p>
    </CardHeader>
    <CardContent className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="py-3 px-2 font-semibold text-slate-700">Country</th>
            <th className="py-3 px-2 font-semibold text-slate-700 text-right">Users</th>
            <th className="py-3 px-2 font-semibold text-slate-700 text-right">Sessions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((geo) => (
            <tr key={geo.country} className="hover:bg-slate-50 transition-colors">
              <td className="flex items-center gap-2 py-3 px-2 text-slate-900 font-medium">
                {geo.countryCode && (
                  <ReactCountryFlag
                    countryCode={geo.countryCode}
                    svg
                    style={{ width: "1.5em", height: "1.5em" }}
                  />
                )}
                {geo.country}
              </td>
              <td className="py-3 px-2 text-slate-700 text-right">{geo.users?.toLocaleString() || 0}</td>
              <td className="py-3 px-2 text-slate-700 text-right">{geo.sessions.toLocaleString()}</td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td className="py-8 text-center text-slate-500" colSpan={3}>
                No geographic data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </CardContent>
  </Card>
);

export default GeoTable;

