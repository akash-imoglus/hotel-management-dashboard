import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { DeviceMetric } from "@/types";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import { Monitor } from "lucide-react";

interface DevicesChartProps {
  data: DeviceMetric[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const DEVICE_COLORS: Record<string, string> = {
  "mobile": "#10B981",
  "desktop": "#3B82F6",
  "tablet": "#8B5CF6",
  "smart tv": "#F59E0B",
  "game_console": "#EF4444",
};

const formatNumber = (num: number) => {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const DevicesChart = ({ data, loading, error, onRetry }: DevicesChartProps) => {
  // Transform data to ensure proper field names
  const chartData = data.map((d) => ({
    name: d.device || (d as any).deviceCategory || 'Unknown',
    value: d.value || (d as any).sessions || (d as any).activeUsers || 0,
  }));

  return (
    <Card className="h-full bg-white">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Monitor className="h-5 w-5 text-purple-600" />
          <div>
            <CardTitle className="text-slate-900">Device Breakdown</CardTitle>
            <p className="text-sm text-slate-500">Sessions by device type</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-72">
        {loading && <LoadingState className="h-full" message="Loading devices..." />}
        {!loading && error && (
          <ErrorState description={error} onRetry={onRetry} className="h-full" />
        )}
        {!loading && !error && data.length === 0 && (
          <p className="text-sm text-slate-500">No device data available.</p>
        )}
        {!loading && !error && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 30 }}>
              <XAxis 
                type="number"
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={formatNumber}
              />
              <YAxis 
                type="category"
                dataKey="name"
                width={80}
                tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <Tooltip 
                formatter={(value: number) => [formatNumber(value), 'Sessions']}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                labelStyle={{ color: '#1e293b', fontWeight: 600 }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={DEVICE_COLORS[entry.name.toLowerCase()] || '#6B7280'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default DevicesChart;
