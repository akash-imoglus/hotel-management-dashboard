import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import type { OverviewMetrics } from "@/types";

const formatter = new Intl.NumberFormat();

const overviewConfig: Array<{
  key: keyof OverviewMetrics;
  label: string;
  suffix?: string;
  formatter?: (value: number) => string;
  changeKey?: keyof OverviewMetrics;
}> = [
  { key: "totalUsers", label: "Total Users", changeKey: "totalUsersChange" },
  { key: "sessions", label: "Sessions", changeKey: "sessionsChange" },
  { key: "pageviews", label: "Pageviews", changeKey: "pageviewsChange" },
  { key: "bounceRate", label: "Bounce Rate", suffix: "%", changeKey: "bounceRateChange" },
  { key: "engagementRate", label: "Engagement Rate", suffix: "%", changeKey: "engagementRateChange" },
  { key: "averageSessionDuration", label: "Avg Session Duration", suffix: "m", formatter: (v) => v.toFixed(1), changeKey: "averageSessionDurationChange" },
  { key: "engagedSessions", label: "Engaged Sessions", changeKey: "engagedSessionsChange" },
  { key: "newUsers", label: "New Users", changeKey: "newUsersChange" },
  { key: "conversions", label: "Conversions", changeKey: "conversionsChange" },
];

interface OverviewCardsProps {
  data?: OverviewMetrics;
  loading?: boolean;
}

const OverviewCards = ({ data, loading }: OverviewCardsProps) => {
  const formatValue = (item: typeof overviewConfig[0], value: number) => {
    if (item.formatter) {
      return item.formatter(value);
    }
    return formatter.format(value);
  };

  const renderChangeIndicator = (changeValue: number | undefined) => {
    if (changeValue === undefined || changeValue === null || isNaN(changeValue)) {
      return (
        <p className="text-xs text-slate-400 flex items-center gap-1">
          <Minus className="h-3 w-3" />
          No change
        </p>
      );
    }

    const absChange = Math.abs(changeValue);
    const isPositive = changeValue > 0;
    const isNeutral = changeValue === 0;

    if (isNeutral) {
      return (
        <p className="text-xs text-slate-400 flex items-center gap-1">
          <Minus className="h-3 w-3" />
          0.0% vs previous
        </p>
      );
    }

    return (
      <p className={`text-xs font-medium flex items-center gap-1 ${
        isPositive ? 'text-green-600' : 'text-red-600'
      }`}>
        {isPositive ? (
          <ArrowUpRight className="h-3 w-3" />
        ) : (
          <ArrowDownRight className="h-3 w-3" />
        )}
        {absChange.toFixed(1)}% vs previous
      </p>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 lg:grid-cols-5">
      {overviewConfig.map((item, index) => {
        const value = data?.[item.key];
        // Only show cards for metrics that exist in data or are always shown
        if (value === undefined && !['totalUsers', 'sessions', 'pageviews', 'bounceRate'].includes(item.key)) {
          return null;
        }
        
        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="bg-white">
              <CardHeader>
                <CardDescription className="text-slate-500">{item.label}</CardDescription>
                <CardTitle className="text-3xl text-slate-900">
                  {loading || !data || value === undefined
                    ? "—"
                    : `${formatValue(item, value)}${item.suffix ?? ""}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading || !data ? (
                  <p className="text-xs text-slate-400">vs previous period</p>
                ) : (
                  renderChangeIndicator(item.changeKey ? data[item.changeKey] as number : undefined)
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default OverviewCards;

