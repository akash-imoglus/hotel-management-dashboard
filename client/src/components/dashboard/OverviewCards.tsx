import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { OverviewMetrics } from "@/types";

const formatter = new Intl.NumberFormat();

const overviewConfig: Array<{
  key: keyof OverviewMetrics;
  label: string;
  suffix?: string;
  formatter?: (value: number) => string;
}> = [
  { key: "totalUsers", label: "Total Users" },
  { key: "sessions", label: "Sessions" },
  { key: "pageviews", label: "Pageviews" },
  { key: "bounceRate", label: "Bounce Rate", suffix: "%" },
  { key: "engagementRate", label: "Engagement Rate", suffix: "%" },
  { key: "averageSessionDuration", label: "Avg Session Duration", suffix: "m", formatter: (v) => v.toFixed(1) },
  { key: "engagedSessions", label: "Engaged Sessions" },
  { key: "newUsers", label: "New Users" },
  { key: "conversions", label: "Conversions" },
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
                <p className="text-xs text-slate-400">vs previous period</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default OverviewCards;

