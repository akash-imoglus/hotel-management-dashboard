import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface GoogleAdsOverviewMetrics {
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number;
  averageCpc: number;
  costPerConversion: number;
  averageCpm?: number;
  conversionRate?: number;
  interactions?: number;
  interactionRate?: number;
}

interface GoogleAdsOverviewCardsProps {
  data?: GoogleAdsOverviewMetrics | null;
  loading?: boolean;
}

const GoogleAdsOverviewCards = ({ data, loading }: GoogleAdsOverviewCardsProps) => {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <CardDescription>
                <div className="h-4 w-24 bg-slate-200 animate-pulse rounded" />
              </CardDescription>
              <CardTitle>
                <div className="h-8 w-32 bg-slate-200 animate-pulse rounded mt-2" />
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const cards = [
    {
      title: "Impressions",
      value: data.impressions.toLocaleString(),
      description: "Total ad impressions",
    },
    {
      title: "Clicks",
      value: data.clicks.toLocaleString(),
      description: "Total clicks on ads",
    },
    {
      title: "Cost",
      value: `$${data.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: "Total ad spend",
    },
    {
      title: "Conversions",
      value: data.conversions.toLocaleString(),
      description: "Total conversions",
    },
    {
      title: "CTR",
      value: `${data.ctr.toFixed(2)}%`,
      description: "Click-through rate",
    },
    {
      title: "Avg CPC",
      value: `$${data.averageCpc.toFixed(2)}`,
      description: "Average cost per click",
    },
    {
      title: "Cost/Conv",
      value: `$${data.costPerConversion.toFixed(2)}`,
      description: "Cost per conversion",
    },
    {
      title: "Conv Rate",
      value: `${(data.conversionRate || 0).toFixed(2)}%`,
      description: "Conversion rate",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader>
            <CardDescription>{card.description}</CardDescription>
            <CardTitle className="text-2xl">{card.value}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-slate-600">{card.title}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default GoogleAdsOverviewCards;


