import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { ChannelMetric } from "@/types";
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";

const COLORS = ["#0F172A", "#2563EB", "#38BDF8", "#22D3EE", "#2DD4BF", "#34D399"];

interface ChannelsChartProps {
  data: ChannelMetric[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const ChannelsChart = ({ data, loading, error, onRetry }: ChannelsChartProps) => {
  const chartData = data.map((channel) => ({
    name: channel.channel,
    value: (channel as any).sessions || channel.value || 0,
  }));

  return (
  <Card className="h-full bg-white">
    <CardHeader className="pb-2">
      <CardTitle className="text-slate-900">Session Channels</CardTitle>
      <p className="text-sm text-slate-500">Top acquisition sources</p>
    </CardHeader>
    <CardContent className="h-72">
      {loading && <LoadingState className="h-full" message="Loading channels..." />}
      {!loading && error && (
        <ErrorState description={error} onRetry={onRetry} className="h-full" />
      )}
      {!loading && !error && data.length === 0 && (
        <p className="text-sm text-slate-500">No channel data available.</p>
      )}
      {!loading && !error && chartData.length > 0 && (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="channel"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              labelStyle={{ color: '#1e293b', fontWeight: 600 }}
              itemStyle={{ color: '#64748b' }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </CardContent>
  </Card>
  );
};

export default ChannelsChart;

