import { useQuery } from "@tanstack/react-query";
import { SortableTable } from "../sortable-table";

type VolatilityPlayer = {
  player_name: string;
  team: string;
  position: string;
  volatility_score: number;
  average_points: number;
  standard_deviation: number;
  high_score: number;
  low_score: number;
};

export default function VolatilityIndexTable() {
  const { data: players, isLoading, error } = useQuery({
    queryKey: ["/api/master-stats/players"],
    select: (data: any[]) => {
      return data
        .filter(player => player.games_played > 5 && player.average_points > 40)
        .map(player => {
          // Calculate volatility score from standard deviation relative to average
          const volatilityScore = player.standard_deviation && player.average_points 
            ? (player.standard_deviation / player.average_points) * 100
            : 0;
            
          return {
            player_name: player.name,
            team: player.team,
            position: player.position,
            volatility_score: volatilityScore,
            average_points: player.average_points,
            standard_deviation: player.standard_deviation || 0,
            high_score: player.high_score || 0,
            low_score: player.low_score || 0
          };
        })
        .sort((a, b) => b.volatility_score - a.volatility_score); // Highest volatility first
    }
  });

  // Function to get color class based on volatility score
  const getVolatilityColor = (score: number) => {
    if (score >= 30) return "text-red-500 font-medium";
    if (score >= 20) return "text-orange-500 font-medium";
    if (score >= 10) return "text-yellow-500 font-medium";
    return "text-green-500 font-medium";
  };

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
      key: "volatility_score",
      label: "Volatility %",
      sortable: true,
      render: (value: number) => (
        <span className={getVolatilityColor(value)}>
          {value.toFixed(1)}%
        </span>
      ),
    },
    {
      key: "standard_deviation",
      label: "Std Dev",
      sortable: true,
      render: (value: number) => value.toFixed(1)
    },
    {
      key: "high_score",
      label: "High",
      sortable: true,
    },
    {
      key: "low_score",
      label: "Low",
      sortable: true,
    },
  ];

  // If loading or error, show appropriate message
  if (isLoading) {
    return <div>Loading volatility index data...</div>;
  }
  
  if (error) {
    return <div className="text-red-500">Failed to load volatility data</div>;
  }
  
  // If no players, show empty message
  if (!players || players.length === 0) {
    return <div>No volatility index data available.</div>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">
        This tool calculates volatility as standard deviation relative to average score. 
        Lower percentages indicate more consistent performers, while higher values show volatile scoring.
      </p>
      
      <SortableTable 
        data={players} 
        columns={columns} 
        emptyMessage="No volatility index data available." 
      />
    </div>
  );
}