import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ZAxis,
  Legend
} from "recharts";

interface PlayerData {
  name: string;
  price: number;
  averagePoints: number;
  position: string;
  team: string;
  breakEven: number;
  lastScore: number;
  projectedScore: number;
  l3Average: number;
  valueRating: string;
  ppd: number;
}

interface ValuePlayer {
  name: string;
  price: number;
  ppd: number;
  position: string;
  team: string;
  breakEven: number;
  lastScore: number;
  projectedScore: number;
  l3Average: number;
  valueRating: string;
}

export default function PlayerValueAnalysis() {
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [selectedPosition, setSelectedPosition] = useState<string>("all");

  const { data: playersData = [] } = useQuery<PlayerData[]>({
    queryKey: ['/api/master-stats/value-stats'],
    staleTime: 0,
  });

  const uniqueTeams = Array.from(new Set(playersData.map((p) => p.team)))
    .filter((team) => team)
    .sort();

  const valueData: ValuePlayer[] = playersData
    .filter((player) => player.price > 0 && player.averagePoints > 0)
    .map((player) => ({
      name: player.name,
      price: player.price,
      ppd: player.ppd || 0,
      position: player.position,
      team: player.team,
      breakEven: player.breakEven || 0,
      lastScore: player.lastScore || 0,
      projectedScore: player.projectedScore || 0,
      l3Average: player.l3Average || 0,
      valueRating: player.valueRating || '-'
    }))
    .filter((player) => player.ppd > 0);

  const filteredData = valueData.filter((player) => {
    const teamMatch = selectedTeam === "all" || player.team === selectedTeam;
    const positionMatch = selectedPosition === "all" || player.position === selectedPosition;
    return teamMatch && positionMatch;
  });

  // Get top 20 best value players for scatter graph
  const top20ValuePlayers = [...filteredData]
    .sort((a, b) => b.ppd - a.ppd)
    .slice(0, 20);

  const premiumPlayer = filteredData
    .filter((player) => player.price >= 550000)
    .sort((a, b) => b.ppd - a.ppd)[0];

  const midpricerPlayer = filteredData
    .filter((player) => player.price >= 300000 && player.price < 550000)
    .sort((a, b) => b.ppd - a.ppd)[0];

  const rookiePlayer = filteredData
    .filter((player) => player.price < 300000)
    .sort((a, b) => b.ppd - a.ppd)[0];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 border border-gray-700 text-white p-3 rounded-md text-xs shadow-lg">
          <p className="text-blue-400 font-bold mb-1">{data.name}</p>
          <div className="space-y-0.5">
            <p><span className="text-gray-400">Team:</span> {data.team}</p>
            <p><span className="text-gray-400">Position:</span> {data.position}</p>
            <p><span className="text-gray-400">Price:</span> ${(data.price / 1000).toFixed(0)}k</p>
            <p><span className="text-gray-400">Pts/$:</span> {data.ppd.toFixed(2)}</p>
            <p><span className="text-gray-400">L3 Avg:</span> {data.l3Average ? data.l3Average.toFixed(1) : '-'}</p>
            <p><span className="text-gray-400">BE:</span> {data.breakEven}</p>
            <p><span className="text-gray-400">Proj:</span> {data.projectedScore}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-gray-900 border-gray-700 text-white overflow-hidden">
      <div className="p-3 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-blue-400">PLAYER VALUE ANALYSIS</h3>
          <div className="flex gap-3">
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-[120px] bg-gray-800 border-gray-600 text-white" data-testid="select-team">
                <SelectValue placeholder="Team" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all" className="text-white hover:bg-gray-700">All</SelectItem>
                {uniqueTeams.map((team) => (
                  <SelectItem key={team} value={team} className="text-white hover:bg-gray-700">
                    {team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedPosition} onValueChange={setSelectedPosition}>
              <SelectTrigger className="w-[120px] bg-gray-800 border-gray-600 text-white" data-testid="select-position">
                <SelectValue placeholder="Position" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all" className="text-white hover:bg-gray-700">All</SelectItem>
                <SelectItem value="DEF" className="text-white hover:bg-gray-700">DEF</SelectItem>
                <SelectItem value="MID" className="text-white hover:bg-gray-700">MID</SelectItem>
                <SelectItem value="RUC" className="text-white hover:bg-gray-700">RUC</SelectItem>
                <SelectItem value="FWD" className="text-white hover:bg-gray-700">FWD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 20, left: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                type="number" 
                dataKey="price" 
                name="Price"
                tick={{ fill: '#888' }}
                axisLine={{ stroke: '#333' }}
                domain={[250000, 1500000]}
                reversed={true}
                tickFormatter={(value) => value >= 1000000 ? `$${(value/1000000).toFixed(1)}m` : `$${value/1000}k`}
                label={{ value: 'Price', position: 'bottom', fill: '#888' }}
              />
              <YAxis 
                type="number" 
                dataKey="ppd" 
                name="Points per $100k"
                tick={{ fill: '#888' }}
                axisLine={{ stroke: '#333' }}
                domain={[0, 15]}
                label={{ value: 'Points per $100k', angle: -90, position: 'left', fill: '#888' }}
              />
              <ZAxis 
                type="number" 
                range={[100, 500]} 
                name="value"
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Scatter 
                name="DEF" 
                data={top20ValuePlayers.filter((player) => player.position === "DEF")} 
                fill="#22c55e"
                stroke="#111827"
                strokeWidth={1}
                style={{ filter: 'drop-shadow(0 0 4px rgba(34, 197, 94, 0.6))' }}
              />
              <Scatter 
                name="MID" 
                data={top20ValuePlayers.filter((player) => player.position === "MID")} 
                fill="#ef4444"
                stroke="#111827"
                strokeWidth={1}
                style={{ filter: 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.6))' }}
              />
              <Scatter 
                name="FWD" 
                data={top20ValuePlayers.filter((player) => player.position === "FWD")} 
                fill="#f59e0b"
                stroke="#111827"
                strokeWidth={1}
                style={{ filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.6))' }}
              />
              <Scatter 
                name="RUC" 
                data={top20ValuePlayers.filter((player) => player.position === "RUC")} 
                fill="#8b5cf6"
                stroke="#111827"
                strokeWidth={1}
                style={{ filter: 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.6))' }}
              />
              <Legend />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-4">
          {premiumPlayer ? (
            <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700" data-testid="card-premium-value">
              <div className="text-sm font-semibold text-gray-300 mb-2">PREMIUM</div>
              <div className="space-y-1">
                <div className="font-semibold text-white text-lg" data-testid="text-premium-player">{premiumPlayer.name}</div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                  <div className="text-gray-400">Price:</div>
                  <div className="text-white font-mono">${(premiumPlayer.price / 1000).toFixed(0)}k</div>
                  <div className="text-gray-400">Break Even:</div>
                  <div className="text-white">{premiumPlayer.breakEven}</div>
                  <div className="text-gray-400">Last Score:</div>
                  <div className="text-white">{premiumPlayer.lastScore}</div>
                  <div className="text-gray-400">Projected:</div>
                  <div className="text-green-400 font-semibold">{premiumPlayer.projectedScore}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
              <div className="text-sm font-semibold text-gray-300 mb-1">PREMIUM</div>
              <div className="text-xs text-gray-400">No players found</div>
            </div>
          )}
          
          {midpricerPlayer ? (
            <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700" data-testid="card-midpricer-value">
              <div className="text-sm font-semibold text-gray-300 mb-2">MIDPRICER</div>
              <div className="space-y-1">
                <div className="font-semibold text-white text-lg" data-testid="text-midpricer-player">{midpricerPlayer.name}</div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                  <div className="text-gray-400">Price:</div>
                  <div className="text-white font-mono">${(midpricerPlayer.price / 1000).toFixed(0)}k</div>
                  <div className="text-gray-400">Break Even:</div>
                  <div className="text-white">{midpricerPlayer.breakEven}</div>
                  <div className="text-gray-400">Last Score:</div>
                  <div className="text-white">{midpricerPlayer.lastScore}</div>
                  <div className="text-gray-400">Projected:</div>
                  <div className="text-green-400 font-semibold">{midpricerPlayer.projectedScore}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
              <div className="text-sm font-semibold text-gray-300 mb-1">MIDPRICER</div>
              <div className="text-xs text-gray-400">No players found</div>
            </div>
          )}
          
          {rookiePlayer ? (
            <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700" data-testid="card-rookie-value">
              <div className="text-sm font-semibold text-gray-300 mb-2">ROOKIE</div>
              <div className="space-y-1">
                <div className="font-semibold text-white text-lg" data-testid="text-rookie-player">{rookiePlayer.name}</div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                  <div className="text-gray-400">Price:</div>
                  <div className="text-white font-mono">${(rookiePlayer.price / 1000).toFixed(0)}k</div>
                  <div className="text-gray-400">Break Even:</div>
                  <div className="text-white">{rookiePlayer.breakEven}</div>
                  <div className="text-gray-400">Last Score:</div>
                  <div className="text-white">{rookiePlayer.lastScore}</div>
                  <div className="text-gray-400">Projected:</div>
                  <div className="text-green-400 font-semibold">{rookiePlayer.projectedScore}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
              <div className="text-sm font-semibold text-gray-300 mb-1">ROOKIE</div>
              <div className="text-xs text-gray-400">No players found</div>
            </div>
          )}
        </div>

        {/* Top 20 Value Players Table */}
        <div className="mt-6">
          <h4 className="text-sm font-bold text-gray-300 mb-3">TOP 20 VALUE PLAYERS ({top20ValuePlayers.length})</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" data-testid="table-all-players">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-2 text-gray-400 font-semibold">Player</th>
                  <th className="text-left py-2 px-2 text-gray-400 font-semibold">Team</th>
                  <th className="text-left py-2 px-2 text-gray-400 font-semibold">Pos</th>
                  <th className="text-right py-2 px-2 text-gray-400 font-semibold">Price</th>
                  <th className="text-right py-2 px-2 text-gray-400 font-semibold">Pts/$</th>
                  <th className="text-center py-2 px-2 text-gray-400 font-semibold">Value</th>
                  <th className="text-right py-2 px-2 text-gray-400 font-semibold">BE</th>
                  <th className="text-right py-2 px-2 text-gray-400 font-semibold">Proj</th>
                  <th className="text-right py-2 px-2 text-gray-400 font-semibold">L3</th>
                </tr>
              </thead>
              <tbody>
                {top20ValuePlayers.length > 0 ? (
                  top20ValuePlayers.map((player, index) => (
                    <tr 
                      key={index} 
                      className="border-b border-gray-800 hover:bg-gray-800/30"
                      data-testid={`row-player-${index}`}
                    >
                      <td className="py-2 px-2 text-white font-medium">{player.name}</td>
                      <td className="py-2 px-2 text-gray-400">{player.team}</td>
                      <td className="py-2 px-2">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                          player.position === 'DEF' ? 'bg-green-500/20 text-green-400' :
                          player.position === 'MID' ? 'bg-red-500/20 text-red-400' :
                          player.position === 'FWD' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>
                          {player.position}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right text-white font-mono">${(player.price / 1000).toFixed(0)}k</td>
                      <td className="py-2 px-2 text-right text-green-400">{player.ppd.toFixed(2)}</td>
                      <td className="py-2 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          player.valueRating === 'undervalued' ? 'bg-green-500/20 text-green-400' :
                          player.valueRating === 'overpriced' ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {player.valueRating || '-'}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right text-white">{player.breakEven}</td>
                      <td className="py-2 px-2 text-right text-green-400 font-semibold">{player.projectedScore}</td>
                      <td className="py-2 px-2 text-right text-blue-400">{player.l3Average ? player.l3Average.toFixed(1) : '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-4 text-center text-gray-400">No players found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
