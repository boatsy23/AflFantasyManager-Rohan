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
import { Calculator, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

type ConsistencyPlayer = {
  player: string;
  team: string;
  position: string;
  consistency_score: number;
  floor_score: number;
  average_points: number;
  standard_deviation: number;
};

export default function ConsistencyScoreTable() {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data: players, isLoading, error } = useQuery({
    queryKey: ["/api/master-stats/players"],
    select: (data: any[]) => {
      return data
        .filter(player => player.games_played > 5 && player.average_points > 40) // Active players only
        .map(player => ({
          player: player.name,
          team: player.team,
          position: player.position,
          consistency_score: player.consistency_rating || 0,
          floor_score: Math.max(0, player.low_score || 0),
          average_points: player.average_points,
          standard_deviation: player.standard_deviation || 0
        }))
        .sort((a, b) => b.consistency_score - a.consistency_score);
    }
  });

  // If loading or error, show appropriate message
  if (isLoading) {
    return <div>Loading consistency score data...</div>;
  }
  
  if (error) {
    return <div className="text-red-500">Failed to load consistency score data</div>;
  }
  
  // If no players, show empty message
  if (!players || players.length === 0) {
    return <div>No consistency score data available.</div>;
  }

  // Sort players by consistency score
  const sortedPlayers = [...players].sort((a, b) => {
    return sortOrder === 'asc' 
      ? a.consistency_score - b.consistency_score
      : b.consistency_score - a.consistency_score;
  });

  // Function to toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // Function to get color class based on consistency score
  const getConsistencyColor = (score: number) => {
    if (score >= 8) return "text-green-500 font-medium";
    if (score >= 6) return "text-blue-500 font-medium";
    if (score >= 4) return "text-orange-500 font-medium";
    return "text-red-500 font-medium";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calculator className="h-5 w-5 text-blue-500" />
        <h3 className="text-lg font-medium">Consistency Score Generator</h3>
      </div>
      
      <p className="text-sm text-gray-600">
        This tool shows player consistency ratings based on score variance. Higher ratings indicate more 
        reliable performers with less volatile scoring patterns.
      </p>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Pos</TableHead>
            <TableHead className="text-right">Avg</TableHead>
            <TableHead className="text-right">
              <Button 
                variant="ghost" 
                className="p-0 h-auto font-semibold flex items-center gap-1"
                onClick={toggleSortOrder}
              >
                Consistency
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="text-right">Floor</TableHead>
            <TableHead className="text-right">Std Dev</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPlayers.map((player, i) => (
            <TableRow key={i}>
              <TableCell className="font-medium">{player.player}</TableCell>
              <TableCell>{player.team}</TableCell>
              <TableCell>{player.position}</TableCell>
              <TableCell className="text-right">{player.average_points.toFixed(1)}</TableCell>
              <TableCell className={`text-right ${getConsistencyColor(player.consistency_score)}`}>
                {player.consistency_score.toFixed(1)}
              </TableCell>
              <TableCell className="text-right">{player.floor_score}</TableCell>
              <TableCell className="text-right">{player.standard_deviation.toFixed(1)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}