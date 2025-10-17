import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { SortableTable } from "../sortable-table";

type TagWatchPlayer = {
  player_name: string;
  team: string;
  tag_risk: string;
  position: string;
  price: number;
  average_points: number;
  ownership_percentage: number;
  consistency_rating: number;
  standard_deviation: number;
};

// Calculate tag risk based on player stats
function calculateTagRisk(player: any): string {
  // High ownership + high scoring + low standard deviation = High tag risk
  const ownershipFactor = player.ownership_percentage || 0;
  const scoringFactor = player.average_points || 0;
  const consistencyFactor = 10 - (player.standard_deviation || 5); // Lower std dev = more consistent
  
  const riskScore = (ownershipFactor * 0.4) + (scoringFactor * 0.4) + (consistencyFactor * 0.2);
  
  if (riskScore > 70) return "High";
  if (riskScore > 45) return "Medium";
  return "Low";
}

export function TagWatchTable() {
  const { data: players, isLoading, error } = useQuery({
    queryKey: ["/api/master-stats/players"],
    select: (data: any[]) => {
      // Filter for premium midfielders and forwards who are likely to be tagged
      const tagTargets = data
        .filter(player => 
          player.average_points > 80 && // High scoring players
          ['MID', 'FWD'].includes(player.position) && // Midfielders and forwards
          player.games_played > 3 // Established players
        )
        .map(player => ({
          player_name: player.name,
          team: player.team,
          position: player.position,
          price: player.price,
          average_points: player.average_points,
          ownership_percentage: player.ownership_percentage || 0,
          consistency_rating: player.consistency_rating,
          standard_deviation: player.standard_deviation,
          tag_risk: calculateTagRisk(player)
        }))
        .sort((a, b) => {
          // Sort by tag risk priority (High first)
          const riskOrder = { "High": 3, "Medium": 2, "Low": 1 };
          return (riskOrder[b.tag_risk as keyof typeof riskOrder] || 0) - (riskOrder[a.tag_risk as keyof typeof riskOrder] || 0);
        })
        .slice(0, 50); // Top 50 players at risk
        
      return tagTargets;
    }
  });

  // Define columns for the sortable table
  const columns = [
    {
      key: "player_name",
      label: "Player",
      sortable: true,
    },
    {
      key: "team",
      label: "Team",
      sortable: true,
    },
    {
      key: "position",
      label: "Pos",
      sortable: true,
    },
    {
      key: "average_points",
      label: "Avg",
      sortable: true,
      render: (value: number) => value.toFixed(1)
    },
    {
      key: "ownership_percentage",
      label: "Own%",
      sortable: true,
      render: (value: number) => `${value.toFixed(1)}%`
    },
    {
      key: "tag_risk",
      label: "Tag Risk",
      sortable: true,
      render: (value: string) => (
        <Badge 
          variant={value === "High" ? "destructive" : value === "Medium" ? "outline" : "secondary"}
          className="flex items-center gap-1"
        >
          {value === "High" && <AlertCircle className="h-3 w-3" />}
          {value}
        </Badge>
      ),
    },
  ];

  // If loading or error, show appropriate message
  if (isLoading) {
    return <div>Loading tag watch data...</div>;
  }
  
  if (error) {
    return <div className="text-red-500">Failed to load tag watch data</div>;
  }
  
  // If no players, show empty message
  if (!players || players.length === 0) {
    return <div>No tag watch data available.</div>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">
        This tool identifies high-scoring players who are likely to be tagged by opponents, 
        based on their scoring average, ownership, and consistency. High-risk players may face increased defensive attention.
      </p>
      
      <SortableTable 
        data={players} 
        columns={columns} 
        emptyMessage="No tag watch data available." 
      />
    </div>
  );
}