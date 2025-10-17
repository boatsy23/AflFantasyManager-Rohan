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

// Sample data for DVP analysis
const dvpData = [
  { round: "R8", team: "GWS", dvp: 75, league: 55 },
  { round: "R9", team: "ESS", dvp: 45, league: 52 },
  { round: "R10", team: "GCS", dvp: 60, league: 58 },
  { round: "R11", team: "COL", dvp: 30, league: 50 },
  { round: "R12", team: "BRL", dvp: 70, league: 56 },
];

export default function DVPAnalysis() {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 border border-gray-700 text-white p-2 rounded-md text-xs">
          <p className="text-blue-400 font-bold">{label || payload[0]?.payload?.name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
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
      <CardContent className="px-3 pt-2 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm font-semibold text-gray-300 mb-2">DEFENDERS</div>
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dvpData}
                  margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                >
                  <CartesianGrid stroke="#333" opacity={0.2} vertical={false} />
                  <XAxis 
                    dataKey="round" 
                    tick={{ fill: '#888', fontSize: 9 }}
                    axisLine={{ stroke: '#333' }}
                  />
                  <YAxis 
                    tick={{ fill: '#888', fontSize: 9 }}
                    axisLine={{ stroke: '#333' }}
                    tickLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ stroke: '#555', strokeDasharray: '3 3' }}
                  />
                  <Line
                    name="Team DVP"
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
          </div>
          
          <div>
            <div className="text-sm font-semibold text-gray-300 mb-2">MIDFIELDERS</div>
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { round: "R8", team: "GWS", dvp: 35, league: 55 },
                    { round: "R9", team: "ESS", dvp: 70, league: 52 },
                    { round: "R10", team: "GCS", dvp: 45, league: 58 },
                    { round: "R11", team: "COL", dvp: 65, league: 50 },
                    { round: "R12", team: "BRL", dvp: 30, league: 56 },
                  ]}
                  margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                >
                  <CartesianGrid stroke="#333" opacity={0.2} vertical={false} />
                  <XAxis 
                    dataKey="round" 
                    tick={{ fill: '#888', fontSize: 9 }}
                    axisLine={{ stroke: '#333' }}
                  />
                  <YAxis 
                    tick={{ fill: '#888', fontSize: 9 }}
                    axisLine={{ stroke: '#333' }}
                    tickLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ stroke: '#555', strokeDasharray: '3 3' }}
                  />
                  <Line
                    name="Team DVP"
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
          </div>
          
          <div>
            <div className="text-sm font-semibold text-gray-300 mb-2">FORWARDS</div>
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { round: "R8", team: "GWS", dvp: 60, league: 55 },
                    { round: "R9", team: "ESS", dvp: 35, league: 52 },
                    { round: "R10", team: "GCS", dvp: 75, league: 58 },
                    { round: "R11", team: "COL", dvp: 40, league: 50 },
                    { round: "R12", team: "BRL", dvp: 65, league: 56 },
                  ]}
                  margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                >
                  <CartesianGrid stroke="#333" opacity={0.2} vertical={false} />
                  <XAxis 
                    dataKey="round" 
                    tick={{ fill: '#888', fontSize: 9 }}
                    axisLine={{ stroke: '#333' }}
                  />
                  <YAxis 
                    tick={{ fill: '#888', fontSize: 9 }}
                    axisLine={{ stroke: '#333' }}
                    tickLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ stroke: '#555', strokeDasharray: '3 3' }}
                  />
                  <Line
                    name="Team DVP"
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
          </div>
          
          <div>
            <div className="text-sm font-semibold text-gray-300 mb-2">RUCKS</div>
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { round: "R8", team: "GWS", dvp: 25, league: 55 },
                    { round: "R9", team: "ESS", dvp: 40, league: 52 },
                    { round: "R10", team: "GCS", dvp: 55, league: 58 },
                    { round: "R11", team: "COL", dvp: 80, league: 50 },
                    { round: "R12", team: "BRL", dvp: 45, league: 56 },
                  ]}
                  margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                >
                  <CartesianGrid stroke="#333" opacity={0.2} vertical={false} />
                  <XAxis 
                    dataKey="round" 
                    tick={{ fill: '#888', fontSize: 9 }}
                    axisLine={{ stroke: '#333' }}
                  />
                  <YAxis 
                    tick={{ fill: '#888', fontSize: 9 }}
                    axisLine={{ stroke: '#333' }}
                    tickLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ stroke: '#555', strokeDasharray: '3 3' }}
                  />
                  <Line
                    name="Team DVP"
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
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-x-2 gap-y-2 mt-4">
          <div className="text-center text-xs text-gray-400 font-bold">NEXT MATCH</div>
          <div className="text-center text-xs text-gray-400 font-bold">DIFFICULTY</div>
          <div className="text-center text-xs text-gray-400 font-bold">DVP</div>
          <div className="text-center text-xs text-gray-400 font-bold">TREND</div>
          
          <div className="text-center text-white text-sm font-bold">GWS</div>
          <div className="text-center text-red-500 text-sm font-bold">Hard</div>
          <div className="text-center text-white text-sm font-bold">75</div>
          <div className="text-center text-red-500 text-sm font-bold">↑</div>
        </div>
      </CardContent>
    </Card>
  );
}
