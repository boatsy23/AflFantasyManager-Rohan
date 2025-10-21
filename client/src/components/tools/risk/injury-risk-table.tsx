import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type InjuryRiskPlayer = {
  player: string;
  team: string;
  position: string;
  risk_level: string;
  games_played: number;
  consistency_rating: number;
  price: number;
};

// Calculate injury risk based on games played and consistency
function calculateInjuryRisk(player: any): string {
  const gamesPlayed = player.games_played || 0;
  const consistency = player.consistency_rating || 0;
  const totalRounds = 24; // Assume 24 rounds in season
  
  const gamesMissed = Math.max(0, totalRounds - gamesPlayed);
  const availabilityRate = (gamesPlayed / totalRounds) * 100;
  
  // High injury risk: missed many games or very inconsistent
  if (availabilityRate < 70 || gamesMissed > 7) return "High";
  if (availabilityRate < 85 || gamesMissed > 3) return "Medium";
  return "Low";
}

export default function InjuryRiskTable() {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: players, isLoading, error } = useQuery({
    queryKey: ["/api/master-stats/players"],
    select: (data: any[]) => {
      const riskPlayers = data
        .filter(player => player.price > 300000) // Focus on premium players
        .map(player => ({
          player: player.name,
          team: player.team,
          position: player.position,
          games_played: player.games_played,
          consistency_rating: player.consistency_rating,
          price: player.price,
          risk_level: calculateInjuryRisk(player)
        }))
        .sort((a, b) => {
          const riskOrder = { "High": 3, "Medium": 2, "Low": 1 };
          return (riskOrder[b.risk_level as keyof typeof riskOrder] || 0) - (riskOrder[a.risk_level as keyof typeof riskOrder] || 0);
        });
        
      return riskPlayers;
    }
  });

  // If loading or error, show appropriate message
  if (isLoading) {
    return <div>Loading injury risk data...</div>;
  }
  
  if (error) {
    return <div className="text-red-500">Failed to load injury risk data</div>;
  }
  
  // If no players, show empty message
  if (!players || players.length === 0) {
    return <div>No injury risk data available.</div>;
  }

  // Sort players by risk level
  const getRiskValue = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  };

  const sortedPlayers = [...players].sort((a, b) => {
    const aValue = getRiskValue(a.risk_level);
    const bValue = getRiskValue(b.risk_level);
    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });

  // Function to toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // Function to get badge variant based on risk level
  const getRiskBadgeVariant = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high': return "destructive";
      case 'medium': return "warning";
      case 'low': return "outline";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        <h3 className="text-lg font-medium">Injury Risk Model</h3>
      </div>
      
      <p className="text-sm text-gray-600">
        This tool models injury risk based on games played and consistency patterns,
        helping you minimize risk in your fantasy team selection. Risk is calculated from availability rates.
      </p>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Pos</TableHead>
            <TableHead className="text-right">Games</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">
              <Button 
                variant="ghost" 
                className="p-0 h-auto font-semibold flex items-center gap-1"
                onClick={toggleSortOrder}
              >
                Risk Level
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPlayers.map((player, i) => (
            <TableRow key={i}>
              <TableCell className="font-medium">{player.player}</TableCell>
              <TableCell>{player.team}</TableCell>
              <TableCell>{player.position}</TableCell>
              <TableCell className="text-right">{player.games_played}</TableCell>
              <TableCell className="text-right">${(player.price / 1000).toFixed(0)}k</TableCell>
              <TableCell className="text-right">
                <Badge 
                  variant={getRiskBadgeVariant(player.risk_level)} 
                  className="ml-auto"
                >
                  {player.risk_level}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}