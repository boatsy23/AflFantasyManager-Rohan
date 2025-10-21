import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip,
  CartesianGrid
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const TEAM_NAMES: Record<string, string> = {
  "ADE": "Adelaide Crows",
  "BRI": "Brisbane Lions",
  "CAR": "Carlton Blues",
  "COL": "Collingwood Magpies",
  "ESS": "Essendon Bombers",
  "FRE": "Fremantle Dockers",
  "GEE": "Geelong Cats",
  "GCS": "Gold Coast Suns",
  "GWS": "GWS Giants",
  "HAW": "Hawthorn Hawks",
  "MEL": "Melbourne Demons",
  "NOR": "North Melbourne Kangaroos",
  "NTH": "North Melbourne Kangaroos",
  "POR": "Port Adelaide Power",
  "RIC": "Richmond Tigers",
  "STK": "St Kilda Saints",
  "SYD": "Sydney Swans",
  "WCE": "West Coast Eagles",
  "WES": "Western Bulldogs",
};

const ALL_TEAMS = [
  { code: "ADE", name: "Adelaide Crows" },
  { code: "BRI", name: "Brisbane Lions" },
  { code: "CAR", name: "Carlton Blues" },
  { code: "COL", name: "Collingwood Magpies" },
  { code: "ESS", name: "Essendon Bombers" },
  { code: "FRE", name: "Fremantle Dockers" },
  { code: "GEE", name: "Geelong Cats" },
  { code: "GCS", name: "Gold Coast Suns" },
  { code: "GWS", name: "GWS Giants" },
  { code: "HAW", name: "Hawthorn Hawks" },
  { code: "MEL", name: "Melbourne Demons" },
  { code: "NTH", name: "North Melbourne Kangaroos" },
  { code: "POR", name: "Port Adelaide Power" },
  { code: "RIC", name: "Richmond Tigers" },
  { code: "STK", name: "St Kilda Saints" },
  { code: "SYD", name: "Sydney Swans" },
  { code: "WCE", name: "West Coast Eagles" },
  { code: "WES", name: "Western Bulldogs" },
];

interface TeamMatchupDVP {
  round: number;
  opponent: string;
  date: string;
  time: string;
  forwardRating: number;
  midfielderRating: number;
  defenderRating: number;
  ruckRating: number;
  overallDifficulty: number;
}

interface TeamDVPAnalysis {
  team: string;
  currentRound: number;
  upcomingMatchups: TeamMatchupDVP[];
}

export default function DVPAnalysis() {
  const [selectedTeam, setSelectedTeam] = useState<string>("COL");

  // Fetch team matchup analysis
  const { data: teamMatchupData, isLoading: teamMatchupLoading } = useQuery<TeamDVPAnalysis>({
    queryKey: [`/api/dvp/team-matchups/${selectedTeam}`],
    enabled: !!selectedTeam,
  });

  const getDifficultyLabel = (rating: number): string => {
    if (rating <= 3) return "Very Easy";
    if (rating <= 4) return "Easy";
    if (rating <= 6) return "Moderate";
    if (rating <= 7) return "Hard";
    return "Very Hard";
  };

  const getDifficultyColor = (rating: number): string => {
    if (rating <= 3) return "text-green-500";
    if (rating <= 4) return "text-lime-500";
    if (rating <= 6) return "text-yellow-500";
    if (rating <= 7) return "text-orange-500";
    return "text-red-500";
  };

  const getChartData = (position: 'defender' | 'midfielder' | 'forward' | 'ruck') => {
    if (!teamMatchupData?.upcomingMatchups) return [];
    
    return teamMatchupData.upcomingMatchups.map(matchup => ({
      opponent: matchup.opponent,
      dvp: position === 'defender' ? matchup.defenderRating :
           position === 'midfielder' ? matchup.midfielderRating :
           position === 'forward' ? matchup.forwardRating :
           matchup.ruckRating
    }));
  };

  const getAverageDVP = (position: 'defender' | 'midfielder' | 'forward' | 'ruck') => {
    if (!teamMatchupData?.upcomingMatchups || teamMatchupData.upcomingMatchups.length === 0) return 0;
    
    const sum = teamMatchupData.upcomingMatchups.reduce((acc, matchup) => {
      const rating = position === 'defender' ? matchup.defenderRating :
                     position === 'midfielder' ? matchup.midfielderRating :
                     position === 'forward' ? matchup.forwardRating :
                     matchup.ruckRating;
      return acc + rating;
    }, 0);
    
    return sum / teamMatchupData.upcomingMatchups.length;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 text-white p-2 rounded-md text-xs">
          <p className="text-blue-400 font-bold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              DVP: {entry.value} - {getDifficultyLabel(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-gray-900 border-gray-700 text-white overflow-hidden">
      <div className="p-3 border-b border-gray-700">
        <h3 className="text-lg font-bold text-blue-400">DEFENCE VS POSITION (DVP)</h3>
      </div>
      <CardContent className="px-3 pt-4 pb-4">
        {/* Team Selector */}
        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-2 block">Select Team</label>
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-full md:w-64 bg-gray-800 border-gray-700 text-white" data-testid="select-team-dvp">
              <SelectValue placeholder="Select a team" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {ALL_TEAMS.map((team) => (
                <SelectItem 
                  key={team.code} 
                  value={team.code}
                  className="text-white hover:bg-gray-700"
                  data-testid={`option-team-${team.code}`}
                >
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {teamMatchupLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        ) : !teamMatchupData?.upcomingMatchups || teamMatchupData.upcomingMatchups.length === 0 ? (
          <p className="text-gray-400 text-sm py-8 text-center">No matchup data available for this team</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Defenders Graph */}
            <div>
              <div className="text-sm font-semibold text-gray-300 mb-2">DEFENDERS</div>
              <div className="h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={getChartData('defender')}
                    margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid stroke="#333" opacity={0.2} vertical={false} />
                    <XAxis 
                      dataKey="opponent" 
                      tick={{ fill: '#888', fontSize: 9 }}
                      axisLine={{ stroke: '#333' }}
                    />
                    <YAxis 
                      tick={{ fill: '#888', fontSize: 9 }}
                      axisLine={{ stroke: '#333' }}
                      tickLine={false}
                      domain={[0, 10]}
                    />
                    <Tooltip 
                      content={<CustomTooltip />}
                      cursor={{ stroke: '#555', strokeDasharray: '3 3' }}
                    />
                    <Line
                      name="DVP"
                      type="monotone"
                      dataKey="dvp"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ fill: "#121212", stroke: "#22c55e", strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 4, fill: "#22c55e" }}
                      style={{ filter: 'drop-shadow(0 0 6px rgba(34, 197, 94, 0.6))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className={`text-xs font-semibold mt-2 text-center ${getDifficultyColor(getAverageDVP('defender'))}`}>
                {getDifficultyLabel(getAverageDVP('defender'))}
              </div>
            </div>
            
            {/* Midfielders Graph */}
            <div>
              <div className="text-sm font-semibold text-gray-300 mb-2">MIDFIELDERS</div>
              <div className="h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={getChartData('midfielder')}
                    margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid stroke="#333" opacity={0.2} vertical={false} />
                    <XAxis 
                      dataKey="opponent" 
                      tick={{ fill: '#888', fontSize: 9 }}
                      axisLine={{ stroke: '#333' }}
                    />
                    <YAxis 
                      tick={{ fill: '#888', fontSize: 9 }}
                      axisLine={{ stroke: '#333' }}
                      tickLine={false}
                      domain={[0, 10]}
                    />
                    <Tooltip 
                      content={<CustomTooltip />}
                      cursor={{ stroke: '#555', strokeDasharray: '3 3' }}
                    />
                    <Line
                      name="DVP"
                      type="monotone"
                      dataKey="dvp"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ fill: "#121212", stroke: "#ef4444", strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 4, fill: "#ef4444" }}
                      style={{ filter: 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.6))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className={`text-xs font-semibold mt-2 text-center ${getDifficultyColor(getAverageDVP('midfielder'))}`}>
                {getDifficultyLabel(getAverageDVP('midfielder'))}
              </div>
            </div>
            
            {/* Forwards Graph */}
            <div>
              <div className="text-sm font-semibold text-gray-300 mb-2">FORWARDS</div>
              <div className="h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={getChartData('forward')}
                    margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid stroke="#333" opacity={0.2} vertical={false} />
                    <XAxis 
                      dataKey="opponent" 
                      tick={{ fill: '#888', fontSize: 9 }}
                      axisLine={{ stroke: '#333' }}
                    />
                    <YAxis 
                      tick={{ fill: '#888', fontSize: 9 }}
                      axisLine={{ stroke: '#333' }}
                      tickLine={false}
                      domain={[0, 10]}
                    />
                    <Tooltip 
                      content={<CustomTooltip />}
                      cursor={{ stroke: '#555', strokeDasharray: '3 3' }}
                    />
                    <Line
                      name="DVP"
                      type="monotone"
                      dataKey="dvp"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ fill: "#121212", stroke: "#f59e0b", strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 4, fill: "#f59e0b" }}
                      style={{ filter: 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className={`text-xs font-semibold mt-2 text-center ${getDifficultyColor(getAverageDVP('forward'))}`}>
                {getDifficultyLabel(getAverageDVP('forward'))}
              </div>
            </div>
            
            {/* Rucks Graph */}
            <div>
              <div className="text-sm font-semibold text-gray-300 mb-2">RUCKS</div>
              <div className="h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={getChartData('ruck')}
                    margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid stroke="#333" opacity={0.2} vertical={false} />
                    <XAxis 
                      dataKey="opponent" 
                      tick={{ fill: '#888', fontSize: 9 }}
                      axisLine={{ stroke: '#333' }}
                    />
                    <YAxis 
                      tick={{ fill: '#888', fontSize: 9 }}
                      axisLine={{ stroke: '#333' }}
                      tickLine={false}
                      domain={[0, 10]}
                    />
                    <Tooltip 
                      content={<CustomTooltip />}
                      cursor={{ stroke: '#555', strokeDasharray: '3 3' }}
                    />
                    <Line
                      name="DVP"
                      type="monotone"
                      dataKey="dvp"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ fill: "#121212", stroke: "#8b5cf6", strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 4, fill: "#8b5cf6" }}
                      style={{ filter: 'drop-shadow(0 0 6px rgba(139, 92, 246, 0.6))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className={`text-xs font-semibold mt-2 text-center ${getDifficultyColor(getAverageDVP('ruck'))}`}>
                {getDifficultyLabel(getAverageDVP('ruck'))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
