import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Flame, AlertTriangle, TrendingDown } from "lucide-react";

type RageTradePlayer = {
  name: string;
  team: string;
  position: string;
  price: number;
  average_points: number;
  last_score: number;
  ownership_percentage: number;
  rage_factor: number;
  rage_risk: "Extreme" | "High" | "Medium" | "Low";
  reason: string;
};

// Calculate rage trade risk based on underperformance vs expectations
function calculateRageFactor(player: any): RageTradePlayer {
  const priceTier = player.price > 700000 ? "Premium" : player.price > 400000 ? "Mid" : "Rookie";
  const ownershipFactor = (player.ownership_percentage || 0) / 100;
  const underperformanceFactor = Math.max(0, (player.average_points - player.last_score) / player.average_points);
  const consistencyFactor = (player.standard_deviation || 20) / player.average_points;
  
  // Higher rage factor = more likely to be rage traded
  const rageFactor = (underperformanceFactor * 40) + (ownershipFactor * 30) + (consistencyFactor * 20) + 
    (priceTier === "Premium" ? 10 : priceTier === "Mid" ? 5 : 0);

  let rageRisk: "Extreme" | "High" | "Medium" | "Low" = "Low";
  let reason = "";

  if (rageFactor > 70 && player.last_score < player.average_points * 0.6) {
    rageRisk = "Extreme";
    reason = "Premium underperformer with high ownership - prime rage trade target";
  } else if (rageFactor > 50) {
    rageRisk = "High";
    reason = "Significant underperformance relative to price and ownership";
  } else if (rageFactor > 30) {
    rageRisk = "Medium";
    reason = "Some rage trade risk due to recent poor form";
  } else {
    reason = "Low rage trade risk - performing as expected";
  }

  return {
    name: player.name,
    team: player.team,
    position: player.position,
    price: player.price,
    average_points: player.average_points,
    last_score: player.last_score,
    ownership_percentage: player.ownership_percentage || 0,
    rage_factor: rageFactor,
    rage_risk: rageRisk,
    reason: reason
  };
}

export default function RageTrades() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showWarning, setShowWarning] = useState(true);

  const { data: rageTargets, isLoading, error } = useQuery({
    queryKey: ["/api/master-stats/players", refreshKey],
    select: (players: any[]) => {
      return players
        .filter(player => 
          player.games_played > 3 && 
          player.price > 400000 && // Focus on mid-pricers and premiums
          player.average_points > 50
        )
        .map(calculateRageFactor)
        .sort((a, b) => b.rage_factor - a.rage_factor)
        .slice(0, 15); // Top 15 rage trade risks
    }
  });

  const refreshAnalysis = () => {
    setRefreshKey(prev => prev + 1);
  };

  const formatPrice = (price: number) => {
    return `$${(price / 1000).toFixed(0)}K`;
  };

  const getRageRiskColor = (risk: string) => {
    switch (risk) {
      case "Extreme": return "bg-red-600";
      case "High": return "bg-orange-500";
      case "Medium": return "bg-amber-500";
      default: return "bg-green-600";
    }
  };

  const getRageIcon = (risk: string) => {
    switch (risk) {
      case "Extreme": return <Flame className="h-4 w-4" />;
      case "High": return <AlertTriangle className="h-4 w-4" />;
      case "Medium": return <TrendingDown className="h-4 w-4" />;
      default: return null;
    }
  };

  if (isLoading) {
    return <div>Loading rage trade analysis...</div>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-red-500">Failed to load rage trade data</div>
        <Button onClick={refreshAnalysis}>Try Again</Button>
      </div>
    );
  }

  if (!rageTargets || rageTargets.length === 0) {
    return (
      <div className="space-y-4">
        <div>No rage trade data available.</div>
        <Button onClick={refreshAnalysis}>Refresh Analysis</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Flame className="h-5 w-5 text-red-500" />
          Rage Trade Monitor
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Identifies players at risk of being mass-traded by frustrated coaches. 
          High-risk players may see price drops due to panic selling.
        </p>
      </div>

      {showWarning && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Strategy Tip:</strong> Rage trades often create value opportunities. 
            Consider contrarian picks when premium players drop in price due to one poor score.
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-2 p-0 h-auto text-xs"
              onClick={() => setShowWarning(false)}
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rageTargets.map((player, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{player.name}</CardTitle>
                  <div className="text-sm text-gray-500">
                    {player.team} · {player.position}
                  </div>
                </div>
                <Badge className={`${getRageRiskColor(player.rage_risk)} flex items-center gap-1`}>
                  {getRageIcon(player.rage_risk)}
                  {player.rage_risk}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-xs text-gray-500">Rage Factor</div>
                  <div className="text-xl font-bold text-red-600">
                    {player.rage_factor.toFixed(0)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Price</div>
                  <div className="text-lg font-semibold">
                    {formatPrice(player.price)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-xs text-gray-500">Average</div>
                  <div className="text-base font-medium">
                    {player.average_points.toFixed(1)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Last Score</div>
                  <div className={`text-base font-medium ${
                    player.last_score < player.average_points * 0.7 ? 'text-red-600' : 
                    player.last_score < player.average_points * 0.9 ? 'text-amber-600' : 'text-green-600'
                  }`}>
                    {player.last_score}
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="text-xs text-gray-500">Ownership</div>
                <div className="text-base font-medium">
                  {player.ownership_percentage.toFixed(1)}%
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <div className="text-xs text-gray-600">
                  {player.reason}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center pt-4">
        <Button onClick={refreshAnalysis} className="mx-auto">
          Refresh Analysis
        </Button>
      </div>
    </div>
  );
}