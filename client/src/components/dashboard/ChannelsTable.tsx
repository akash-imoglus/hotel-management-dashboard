import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";

interface ChannelData {
  channel: string;
  totalUsers: number;
  sessions: number;
  bounceRate: number;
  averageSessionDuration: number;
  totalRevenue: number;
  conversions?: number;
  eventCount?: number;
  engagementRate?: number;
  engagedSessions?: number;
  newUsers?: number;
}

interface ChannelsTableProps {
  data: ChannelData[];
  loading?: boolean;
}

const formatDuration = (minutes: number): string => {
  if (minutes < 1) {
    return `${Math.round(minutes * 60)}s`;
  }
  const mins = Math.floor(minutes);
  const secs = Math.round((minutes - mins) * 60);
  return `${mins}m ${secs}s`;
};

const formatCurrency = (value: number): string => {
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const PercentageChange = ({ value }: { value: number }) => {
  if (value === 0) return <span className="text-slate-500">0%</span>;
  const isPositive = value > 0;
  const Icon = isPositive ? ArrowUp : ArrowDown;
  return (
    <span className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      <Icon className="h-3 w-3" />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
};

const ChannelsTable = ({ data, loading }: ChannelsTableProps) => {
  if (loading) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-slate-900">Session Default Channel Group</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  // Handle case where data might be in old format or undefined
  if (!data || !Array.isArray(data)) {
    return (
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-slate-900">Session Default Channel Group</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">No data available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-slate-900">Session Default Channel Group</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gradient-to-r from-slate-100 to-slate-50">
                <th className="px-3 py-3 text-left font-semibold text-slate-700">No.</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">Session Default Channel Group</th>
                <th className="px-3 py-3 text-right font-semibold text-slate-700">Total Users</th>
                <th className="px-3 py-3 text-right font-semibold text-slate-700">% Δ</th>
                <th className="px-3 py-3 text-right font-semibold text-slate-700">Sessions</th>
                <th className="px-3 py-3 text-right font-semibold text-slate-700">% Δ</th>
                <th className="px-3 py-3 text-right font-semibold text-slate-700">Bounce Rate</th>
                <th className="px-3 py-3 text-right font-semibold text-slate-700">% Δ</th>
                <th className="px-3 py-3 text-right font-semibold text-slate-700">Avg. Session..</th>
                <th className="px-3 py-3 text-right font-semibold text-slate-700">% Δ</th>
                <th className="px-3 py-3 text-right font-semibold text-slate-700">Total Revenue</th>
                <th className="px-3 py-3 text-right font-semibold text-slate-700">% Δ</th>
              </tr>
            </thead>
            <tbody>
              {!data || data.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-3 py-8 text-center text-slate-500">
                    No data available
                  </td>
                </tr>
              ) : (
                data.map((channel, index) => {
                  // Safely extract values with defaults
                  // Handle both old format { channel, value } and new comprehensive format
                  const channelObj = channel || {};
                  const totalUsers = Number(channelObj.totalUsers) || 0;
                  const sessions = Number(channelObj.sessions) || Number((channelObj as any)?.value) || 0;
                  const bounceRate = Number(channelObj.bounceRate) || 0;
                  const averageSessionDuration = Number(channelObj.averageSessionDuration) || 0;
                  const totalRevenue = Number(channelObj.totalRevenue) || 0;
                  const channelName = String(channelObj.channel || 'Unknown');

                  return (
                    <tr key={channelName} className="border-b hover:bg-slate-50">
                      <td className="px-3 py-3 text-slate-700">{index + 1}</td>
                      <td className="px-3 py-3 font-medium text-slate-900">{channelName}</td>
                      <td className="px-3 py-3 text-right text-slate-900">{totalUsers.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right text-slate-600">
                        <PercentageChange value={0} />
                      </td>
                      <td className="px-3 py-3 text-right text-slate-900">{sessions.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right text-slate-600">
                        <PercentageChange value={0} />
                      </td>
                      <td className="px-3 py-3 text-right text-slate-900">{bounceRate.toFixed(1)}%</td>
                      <td className="px-3 py-3 text-right text-slate-600">
                        <PercentageChange value={0} />
                      </td>
                      <td className="px-3 py-3 text-right text-slate-900">{formatDuration(averageSessionDuration)}</td>
                      <td className="px-3 py-3 text-right text-slate-600">
                        <PercentageChange value={0} />
                      </td>
                      <td className="px-3 py-3 text-right text-slate-900">{formatCurrency(totalRevenue)}</td>
                      <td className="px-3 py-3 text-right text-slate-600">
                        <PercentageChange value={0} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChannelsTable;

