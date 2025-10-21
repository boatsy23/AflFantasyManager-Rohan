import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";
import { Loader2 } from "lucide-react";

const AFL_TEAMS = ["ADL", "BRL", "CAR", "COL", "ESS", "FRE", "GCS", "GEE", "GWS", "HAW", "MEL", "NTH", "PTA", "RIC", "STK", "SYD", "WBD", "WCE"];
const POSITIONS = ["Forward", "Midfielder", "Defender", "Ruck"];

// Position mapping: UI label to data code
const POSITION_MAP: Record<string, string> = {
  "Forward": "FWD",
  "Midfielder": "MID",
  "Defender": "DEF",
  "Ruck": "RUC"
};

// Reverse mapping: data code to full name
const CODE_TO_FULL_NAME: Record<string, string> = {
  "FWD": "Forward",
  "MID": "Midfielder",
  "DEF": "Defender",
  "RUC": "Ruck"
};

// Position to team rating field mapping
const POSITION_TO_TEAM_RATING: Record<string, string> = {
  "FWD": "forward",
  "Forward": "forward",
  "MID": "midfielder",
  "Midfielder": "midfielder",
  "DEF": "defender",
  "Defender": "defender",
  "RUC": "ruck",
  "Ruck": "ruck"
};

interface PlayerValueStats {
  playerId: string;
  name: string;
  position: string;
  team: string;
  price: number;
  averagePoints: number;
  totalPoints: number;
  roundsPlayed: number;
  ppd: number;
}

interface PlayerDvpRating {
  player: string;
  opponent: string;
  dvpRating: number;
  avgPoints: number;
  gamesPlayed: number;
  consistency: number;
  position: string;
}

interface TeamDvpRating {
  team: string;
  forwardRating: number;
  forwardAvgPointsAllowed: number;
  forwardRank: number;
  midfielderRating: number;
  midfielderAvgPointsAllowed: number;
  midfielderRank: number;
  defenderRating: number;
  defenderAvgPointsAllowed: number;
  defenderRank: number;
  ruckRating: number;
  ruckAvgPointsAllowed: number;
  ruckRank: number;
}

export default function PlayerDvpGraph() {
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [selectedPosition, setSelectedPosition] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [searchName, setSearchName] = useState<string>("");
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerValueStats | null>(null);

  // Fetch all players with value stats
  const { data: allPlayers = [], isLoading: playersLoading } = useQuery<PlayerValueStats[]>({
    queryKey: ["/api/master-stats/value-stats"],
  });

  // Fetch DVP ratings for selected player
  const { data: playerDvpRatings = [], isLoading: dvpLoading } = useQuery<PlayerDvpRating[]>({
    queryKey: ["/api/dvp/player-ratings", selectedPlayer?.name],
    queryFn: async () => {
      if (!selectedPlayer?.name) return [];
      const response = await fetch(`/api/dvp/player-ratings?player=${encodeURIComponent(selectedPlayer.name)}`);
      if (!response.ok) throw new Error('Failed to fetch DVP ratings');
      return response.json();
    },
    enabled: !!selectedPlayer,
  });

  // Fetch team DVP ratings
  const { data: teamDvpRatings = [], isLoading: teamDvpLoading } = useQuery<TeamDvpRating[]>({
    queryKey: ["/api/dvp/team-ratings"],
  });

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    let filtered = allPlayers.filter(p => p.price > 0);

    if (selectedTeam !== "all") {
      filtered = filtered.filter(p => p.team === selectedTeam);
    }

    if (selectedPosition !== "all") {
      const positionCode = POSITION_MAP[selectedPosition];
      filtered = filtered.filter(p => 
        p.position === positionCode || p.position.includes(positionCode)
      );
    }

    if (minPrice) {
      filtered = filtered.filter(p => p.price >= parseInt(minPrice));
    }

    if (maxPrice) {
      filtered = filtered.filter(p => p.price <= parseInt(maxPrice));
    }

    if (searchName) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    // Sort by price descending and take top 10
    return filtered
      .sort((a, b) => b.price - a.price)
      .slice(0, 10);
  }, [allPlayers, selectedTeam, selectedPosition, minPrice, maxPrice, searchName]);

  // Determine player positions from actual DVP data (not from player table)
  const playerPositions = useMemo(() => {
    if (!selectedPlayer || playerDvpRatings.length === 0) return [];
    
    // Get unique positions from the DVP data itself
    const uniquePositions = Array.from(new Set(playerDvpRatings.map(r => r.position)));
    return uniquePositions.filter(p => p && p !== 'Unknown');
  }, [selectedPlayer, playerDvpRatings]);

  // Prepare chart data for each position
  const getChartDataForPosition = (position: string) => {
    const positionDvpData = playerDvpRatings.filter(
      rating => rating.position === position
    );

    return positionDvpData.map(rating => {
      const teamRating = teamDvpRatings.find(t => t.team === rating.opponent);
      let teamDefenseRating = 5;
      
      if (teamRating) {
        const ratingField = POSITION_TO_TEAM_RATING[position];
        if (ratingField === "forward") teamDefenseRating = teamRating.forwardRating;
        else if (ratingField === "midfielder") teamDefenseRating = teamRating.midfielderRating;
        else if (ratingField === "defender") teamDefenseRating = teamRating.defenderRating;
        else if (ratingField === "ruck") teamDefenseRating = teamRating.ruckRating;
      }

      return {
        opponent: rating.opponent,
        playerDvp: rating.dvpRating,
        teamDefense: teamDefenseRating,
        avgPoints: rating.avgPoints,
        gamesPlayed: rating.gamesPlayed,
      };
    }).sort((a, b) => a.playerDvp - b.playerDvp);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-700 text-white p-3 rounded-md text-sm">
          <p className="text-blue-400 font-bold mb-1">{data.opponent}</p>
          <p className="text-green-400">Player DVP: {data.playerDvp?.toFixed(1)}</p>
          <p className="text-orange-400">Team Defense: {data.teamDefense}</p>
          <p className="text-gray-300">Avg Points: {data.avgPoints?.toFixed(1)}</p>
          <p className="text-gray-400 text-xs">Games: {data.gamesPlayed}</p>
        </div>
      );
    }
    return null;
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}m`;
    }
    return `$${(price / 1000).toFixed(0)}k`;
  };

  return (
    <Card className="bg-gray-900 border-gray-700 text-white">
      <div className="p-3 border-b border-gray-700">
        <h3 className="text-lg font-bold text-blue-400">PLAYER DVP ANALYSIS</h3>
      </div>
      <CardContent className="p-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
          <div>
            <Label className="text-xs text-gray-400 mb-1">Team</Label>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white" data-testid="select-team">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                <SelectItem value="all">All Teams</SelectItem>
                {AFL_TEAMS.map(team => (
                  <SelectItem key={team} value={team}>{team}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-gray-400 mb-1">Position</Label>
            <Select value={selectedPosition} onValueChange={setSelectedPosition}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white" data-testid="select-position">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                <SelectItem value="all">All Positions</SelectItem>
                {POSITIONS.map(pos => (
                  <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-gray-400 mb-1">Min Price</Label>
            <Input
              type="number"
              placeholder="e.g. 500000"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
              data-testid="input-min-price"
            />
          </div>

          <div>
            <Label className="text-xs text-gray-400 mb-1">Max Price</Label>
            <Input
              type="number"
              placeholder="e.g. 1000000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
              data-testid="input-max-price"
            />
          </div>

          <div>
            <Label className="text-xs text-gray-400 mb-1">Search Player</Label>
            <Input
              type="text"
              placeholder="Player name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
              data-testid="input-search-player"
            />
          </div>
        </div>

        {/* Player List */}
        <div className="mb-4">
          <Label className="text-sm text-gray-300 mb-2 block">Top 10 Players by Price</Label>
          {playersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : filteredPlayers.length === 0 ? (
            <p className="text-gray-400 text-sm py-4">No players found matching filters</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
              {filteredPlayers.map((player) => (
                <button
                  key={player.playerId}
                  onClick={() => setSelectedPlayer(player)}
                  className={`p-3 rounded-md border transition-colors text-left ${
                    selectedPlayer?.playerId === player.playerId
                      ? "bg-blue-600 border-blue-500"
                      : "bg-gray-800 border-gray-700 hover:bg-gray-750"
                  }`}
                  data-testid={`button-select-player-${player.playerId}`}
                >
                  <div className="font-bold text-sm truncate">{player.name}</div>
                  <div className="text-xs text-gray-400">{player.team} - {player.position}</div>
                  <div className="text-blue-400 font-semibold text-sm mt-1">
                    {formatPrice(player.price)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* DVP Graphs */}
        {selectedPlayer && (
          <div className="mt-6">
            <div className="mb-3">
              <h4 className="text-md font-bold text-white">
                {selectedPlayer.name} - DVP Analysis
              </h4>
              <p className="text-xs text-gray-400">
                {selectedPlayer.team} • {formatPrice(selectedPlayer.price)} • Avg: {selectedPlayer.averagePoints?.toFixed(1)} pts
              </p>
            </div>

            {dvpLoading || teamDvpLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              </div>
            ) : playerDvpRatings.length === 0 ? (
              <p className="text-gray-400 text-sm py-4">No DVP data available for this player</p>
            ) : (
              <div className="space-y-6">
                {playerPositions.map((position, index) => {
                  const chartData = getChartDataForPosition(position);
                  
                  if (chartData.length === 0) return null;

                  return (
                    <div key={position}>
                      <div className="text-sm font-semibold text-gray-300 mb-2">
                        DEFENCE VS POSITION - {position.toUpperCase()}
                      </div>
                      <div className="h-[300px] bg-gray-850 rounded-lg p-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={chartData}
                            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                          >
                            <CartesianGrid stroke="#333" opacity={0.2} vertical={false} />
                            <XAxis 
                              dataKey="opponent" 
                              tick={{ fill: '#888', fontSize: 11 }}
                              axisLine={{ stroke: '#333' }}
                            />
                            <YAxis 
                              tick={{ fill: '#888', fontSize: 11 }}
                              axisLine={{ stroke: '#333' }}
                              tickLine={false}
                              domain={[0, 10]}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend 
                              wrapperStyle={{ fontSize: '12px' }}
                              iconType="line"
                            />
                            <Line
                              name="Player DVP Rating"
                              type="monotone"
                              dataKey="playerDvp"
                              stroke="#22c55e"
                              strokeWidth={3}
                              dot={{ fill: "#121212", stroke: "#22c55e", strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6, fill: "#22c55e" }}
                              style={{ filter: 'drop-shadow(0 0 6px rgba(34, 197, 94, 0.6))' }}
                            />
                            <Line
                              name="Team Defense Rating"
                              type="monotone"
                              dataKey="teamDefense"
                              stroke="#f59e0b"
                              strokeWidth={2}
                              dot={{ fill: "#121212", stroke: "#f59e0b", strokeWidth: 2, r: 3 }}
                              activeDot={{ r: 5, fill: "#f59e0b" }}
                              style={{ filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))' }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
