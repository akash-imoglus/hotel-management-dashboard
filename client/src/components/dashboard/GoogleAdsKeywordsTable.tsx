import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface KeywordData {
  id: string;
  keyword: string;
  matchType: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number;
  averageCpc: number;
  conversionRate: number;
  costPerConversion: number;
  qualityScore?: number;
}

interface GoogleAdsKeywordsTableProps {
  data: KeywordData[];
  loading?: boolean;
}

const GoogleAdsKeywordsTable = ({ data, loading }: GoogleAdsKeywordsTableProps) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Keywords Performance</CardTitle>
          <CardDescription>Loading keywords data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  const getMatchTypeColor = (matchType: string) => {
    switch (matchType) {
      case 'EXACT':
        return 'bg-green-100 text-green-800';
      case 'PHRASE':
        return 'bg-blue-100 text-blue-800';
      case 'BROAD':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Keywords Performance</CardTitle>
        <CardDescription>Performance metrics by keyword</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Keyword</th>
                <th className="text-left p-2">Match Type</th>
                <th className="text-right p-2">Impressions</th>
                <th className="text-right p-2">Clicks</th>
                <th className="text-right p-2">Cost</th>
                <th className="text-right p-2">Conversions</th>
                <th className="text-right p-2">CTR</th>
                <th className="text-right p-2">Avg CPC</th>
                <th className="text-right p-2">Conv Rate</th>
                <th className="text-right p-2">Cost/Conv</th>
                {data[0]?.qualityScore !== undefined && (
                  <th className="text-right p-2">Quality Score</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((keyword) => (
                <tr key={keyword.id} className="border-b hover:bg-slate-50">
                  <td className="p-2 font-medium">{keyword.keyword}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${getMatchTypeColor(keyword.matchType)}`}>
                      {keyword.matchType}
                    </span>
                  </td>
                  <td className="text-right p-2">{keyword.impressions.toLocaleString()}</td>
                  <td className="text-right p-2">{keyword.clicks.toLocaleString()}</td>
                  <td className="text-right p-2">
                    ${keyword.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="text-right p-2">{keyword.conversions.toLocaleString()}</td>
                  <td className="text-right p-2">{keyword.ctr.toFixed(2)}%</td>
                  <td className="text-right p-2">${keyword.averageCpc.toFixed(2)}</td>
                  <td className="text-right p-2">{keyword.conversionRate.toFixed(2)}%</td>
                  <td className="text-right p-2">${keyword.costPerConversion.toFixed(2)}</td>
                  {keyword.qualityScore !== undefined && (
                    <td className="text-right p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        keyword.qualityScore >= 7 ? 'bg-green-100 text-green-800' :
                        keyword.qualityScore >= 5 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {keyword.qualityScore}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleAdsKeywordsTable;


