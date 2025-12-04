import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DeviceData {
  device: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number;
  averageCpc: number;
}

interface GoogleAdsDeviceChartProps {
  data: DeviceData[];
  loading?: boolean;
}

const GoogleAdsDeviceChart = ({ data, loading }: GoogleAdsDeviceChartProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Device Performance</CardTitle>
          <CardDescription>Loading device data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  const chartData = data.map((item) => ({
    device: item.device,
    clicks: item.clicks,
    impressions: item.impressions,
    cost: item.cost,
    conversions: item.conversions,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device Performance</CardTitle>
        <CardDescription>Performance metrics by device type</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="device" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="clicks" fill="#0ea5e9" name="Clicks" />
            <Bar dataKey="conversions" fill="#10b981" name="Conversions" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Device</th>
                <th className="text-right p-2">Impressions</th>
                <th className="text-right p-2">Clicks</th>
                <th className="text-right p-2">Cost</th>
                <th className="text-right p-2">Conversions</th>
                <th className="text-right p-2">CTR</th>
                <th className="text-right p-2">Avg CPC</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr key={idx} className="border-b hover:bg-slate-50">
                  <td className="p-2 font-medium">{item.device}</td>
                  <td className="text-right p-2">{item.impressions.toLocaleString()}</td>
                  <td className="text-right p-2">{item.clicks.toLocaleString()}</td>
                  <td className="text-right p-2">
                    ${item.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="text-right p-2">{item.conversions.toLocaleString()}</td>
                  <td className="text-right p-2">{item.ctr.toFixed(2)}%</td>
                  <td className="text-right p-2">${item.averageCpc.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleAdsDeviceChart;

