import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CircleDollarSign, ArrowUpDown, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type TradeSuggestion = {
  downgrade_out: {
    name: string;
    team: string;
    position: string;
    price: number;
    breakeven: number;
    average: number;
  };
  upgrade_in: {
    name: string;
    team: string;
    position: string;
    price: number;
    breakeven: number;
    average: number;
  };
};

// Generate AI trade suggestion based on real player data
function generateTradeSuggestion(players: any[]): TradeSuggestion | null {
  // Filter for potential downgrades (expensive underperformers)
  const downgradeTargets = players.filter(player => 
    player.price > 600000 && // Expensive players
    player.average_points < (player.price / 10000) && // Underperforming relative to price
    player.games_played > 3
  ).sort((a, b) => (a.average_points / a.price) - (b.average_points / b.price)); // Worst value first

  // Filter for potential upgrades (good value performers)
  const upgradeTargets = players.filter(player => 
    player.price < 800000 && // Not too expensive
    player.average_points > 70 && // Good scoring
    player.price_change > 0 && // Rising in price
    player.games_played > 3
  ).sort((a, b) => (b.average_points / b.price) - (a.average_points / a.price)); // Best value first

  if (downgradeTargets.length === 0 || upgradeTargets.length === 0) {
    return null;
  }

  const downgradePlayer = downgradeTargets[0];
  const upgradePlayer = upgradeTargets[0];

  return {
    downgrade_out: {
      name: downgradePlayer.name,
      team: downgradePlayer.team,
      position: downgradePlayer.position,
      price: downgradePlayer.price,
      breakeven: downgradePlayer.break_even,
      average: downgradePlayer.average_points
    },
    upgrade_in: {
      name: upgradePlayer.name,
      team: upgradePlayer.team,
      position: upgradePlayer.position,
      price: upgradePlayer.price,
      breakeven: upgradePlayer.break_even,
      average: upgradePlayer.average_points
    }
  };
}

export default function AITradeSuggester() {
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: suggestion, isLoading, error } = useQuery({
    queryKey: ["/api/master-stats/players", refreshKey],
    select: (players: any[]) => generateTradeSuggestion(players)
  });

  const refreshSuggestion = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Format price for display
  const formatPrice = (price: number) => {
    return `$${(price / 1000).toFixed(0)}K`;
  };

  if (isLoading) {
    return <div>Loading AI trade suggestion...</div>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="text-red-500">Failed to load trade suggestion</div>
        <Button onClick={refreshSuggestion}>Try Again</Button>
      </div>
    );
  }

  if (!suggestion) {
    return (
      <div className="space-y-4">
        <div>No suitable trade combinations found at this time.</div>
        <Button onClick={refreshSuggestion}>Generate Suggestion</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">AI Recommended Trade</h3>
        <p className="text-sm text-gray-500 mb-4">
          Based on current player data, our AI recommends the following trade to optimize your team value and scoring potential.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Downgrade player card */}
        <Card className="border-red-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="destructive" className="mb-2">Downgrade</Badge>
              <ArrowUpDown className="h-5 w-5 text-gray-400" />
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold">{suggestion.downgrade_out.name}</h3>
                <div className="text-sm text-gray-500">
                  {suggestion.downgrade_out.team} · {suggestion.downgrade_out.position}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-50 p-2 rounded-md">
                  <div className="text-xs text-gray-500">Price</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatPrice(suggestion.downgrade_out.price)}
                  </div>
                </div>
                <div className="bg-gray-50 p-2 rounded-md">
                  <div className="text-xs text-gray-500">BE</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {suggestion.downgrade_out.breakeven}
                  </div>
                </div>
                <div className="bg-gray-50 p-2 rounded-md">
                  <div className="text-xs text-gray-500">Avg</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {suggestion.downgrade_out.average?.toFixed(1) || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Upgrade player card */}
        <Card className="border-green-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="success" className="bg-green-600 mb-2">Upgrade</Badge>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold">{suggestion.upgrade_in.name}</h3>
                <div className="text-sm text-gray-500">
                  {suggestion.upgrade_in.team} · {suggestion.upgrade_in.position}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-50 p-2 rounded-md">
                  <div className="text-xs text-gray-500">Price</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatPrice(suggestion.upgrade_in.price)}
                  </div>
                </div>
                <div className="bg-gray-50 p-2 rounded-md">
                  <div className="text-xs text-gray-500">BE</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {suggestion.upgrade_in.breakeven}
                  </div>
                </div>
                <div className="bg-gray-50 p-2 rounded-md">
                  <div className="text-xs text-gray-500">Avg</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {suggestion.upgrade_in.average?.toFixed(1) || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="text-center pt-4">
        <Button 
          onClick={refreshSuggestion}
          className="mx-auto"
        >
          Generate New Suggestion
        </Button>
      </div>
    </div>
  );
}