import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, TrendingDown } from "lucide-react";

type TradeScorePlayer = {
  name: string;
  team: string;
  position: string;
  price: number;
  average_points: number;
  break_even: number;
  projected_score: number;
  value_score: number;
  trade_priority: "High" | "Medium" | "Low";
  reason: string;
};

// Calculate trade score based on multiple factors
function calculateTradeScore(player: any): TradeScorePlayer {
  const valueScore = (player.average_points / (player.price / 100000)) * 10; // Points per $100k
  const formFactor = player.last_3_average > player.average_points ? 1.2 : 0.8;
  const breakEvenFactor = player.break_even < player.average_points ? 1.1 : 0.9;
  
  const finalScore = valueScore * formFactor * breakEvenFactor;
  
  let priority: "High" | "Medium" | "Low" = "Low";
  let reason = "";
  
  if (finalScore > 12 && player.price_change > 0) {
    priority = "High";
    reason = "Excellent value with rising price";
  } else if (finalScore > 10) {
    priority = "Medium"; 
    reason = "Good value option";
  } else if (player.break_even > player.average_points + 15) {
    priority = "High";
    reason = "Potential value trap - avoid";
  } else {
    reason = "Below average trade target";
  }

  return {
    name: player.name,
    team: player.team,
    position: player.position,
    price: player.price,
    average_points: player.average_points,
    break_even: player.break_even,
    projected_score: player.projected_score,
    value_score: finalScore,
    trade_priority: priority,
    reason: reason
  };
}

export default function TradeScore() {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: tradeTargets, isLoading, error } = useQuery({
    queryKey: ["/api/master-stats/players", refreshKey],
    select: (players: any[]) => {
      return players
        .filter(player => 
          player.games_played > 3 && 
          player.price > 200000 && 
          player.average_points > 30
        )
        .map(calculateTradeScore)
        .sort((a, b) => b.value_score - a.value_score)
        .slice(0, 20); // Top 20 trade targets
    }
  });

  const refreshAnalysis = () => {
    setRefreshKey(prev => prev + 1);
  };

  const formatPrice = (price: number) => {
    return `$${(price / 1000).toFixed(0)}K`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-green-600";
      case "Medium": return "bg-amber-500";
      default: return "bg-gray-500";
    }
  };

  if (isLoading) {
    return <div>Loading trade score analysis...</div>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-red-500">Failed to load trade score data</div>
        <Button onClick={refreshAnalysis}>Try Again</Button>
      </div>
    );
  }

  if (!tradeTargets || tradeTargets.length === 0) {
    return (
      <div className="space-y-4">
        <div>No trade targets available.</div>
        <Button onClick={refreshAnalysis}>Refresh Analysis</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Trade Score Calculator
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Calculates optimal trade targets based on value, form, and breakeven analysis. 
          Higher scores indicate better trade opportunities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tradeTargets.slice(0, 9).map((player, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{player.name}</CardTitle>
                  <div className="text-sm text-gray-500">
                    {player.team} · {player.position}
                  </div>
                </div>
                <Badge className={getPriorityColor(player.trade_priority)}>
                  {player.trade_priority}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-xs text-gray-500">Trade Score</div>
                  <div className="text-xl font-bold text-blue-600 flex items-center gap-1">
                    {player.value_score.toFixed(1)}
                    {index < 3 && <TrendingUp className="h-4 w-4" />}
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
                  <div className="text-xs text-gray-500">Breakeven</div>
                  <div className="text-base font-medium">
                    {player.break_even}
                  </div>
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