import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LocationData {
  country: string;
  countryCode: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number;
  averageCpc: number;
}

interface GoogleAdsLocationTableProps {
  data: LocationData[];
  loading?: boolean;
}

const GoogleAdsLocationTable = ({ data, loading }: GoogleAdsLocationTableProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Location Performance</CardTitle>
          <CardDescription>Loading location data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location Performance</CardTitle>
        <CardDescription>Performance metrics by country</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Country</th>
                <th className="text-right p-2">Impressions</th>
                <th className="text-right p-2">Clicks</th>
                <th className="text-right p-2">Cost</th>
                <th className="text-right p-2">Conversions</th>
                <th className="text-right p-2">CTR</th>
                <th className="text-right p-2">Avg CPC</th>
              </tr>
            </thead>
            <tbody>
              {data.map((location, idx) => (
                <tr key={idx} className="border-b hover:bg-slate-50">
                  <td className="p-2 font-medium">{location.country}</td>
                  <td className="text-right p-2">{location.impressions.toLocaleString()}</td>
                  <td className="text-right p-2">{location.clicks.toLocaleString()}</td>
                  <td className="text-right p-2">
                    ${location.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="text-right p-2">{location.conversions.toLocaleString()}</td>
                  <td className="text-right p-2">{location.ctr.toFixed(2)}%</td>
                  <td className="text-right p-2">${location.averageCpc.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleAdsLocationTable;


