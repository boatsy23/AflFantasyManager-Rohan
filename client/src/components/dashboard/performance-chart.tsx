import { Card, CardContent } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  TooltipProps
} from "recharts";
import { 
  NameType, 
  ValueType 
} from "recharts/types/component/DefaultTooltipContent";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export type RoundData = {
  round: number;
  actualScore: number;
  projectedScore: number;
  rank: number;
  teamValue: number;
};

type PerformanceChartProps = {
  data: RoundData[];
};

type ChartView = "score" | "rank" | "teamValue";

const CustomTooltip = ({ active, payload, label, viewType }: TooltipProps<ValueType, NameType> & { viewType: ChartView }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-600 shadow-lg rounded p-2 text-sm">
        <div className="font-medium mb-1 text-white">Round {label}</div>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center" style={{ color: entry.color as string }}>
            <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: entry.color as string }}></div>
            <span>
              {entry.name}: {
                viewType === "teamValue" 
                  ? `$${((entry.value as number) / 1000000).toFixed(1)}M`
                  : entry.value
              }
            </span>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default function PerformanceChart({ data }: PerformanceChartProps) {
  const [viewType, setViewType] = useState<ChartView>("score");

  // Sort data by round in ascending order for the chart
  const chartData = [...data].sort((a, b) => a.round - b.round);

  // Calculate domain based on view type
  const getDomain = () => {
    if (viewType === "score") {
      const maxScore = Math.max(...chartData.map(d => Math.max(d.actualScore, d.projectedScore)));
      return [0, Math.ceil(maxScore * 1.1)];
    } else if (viewType === "rank") {
      const maxRank = Math.max(...chartData.map(d => d.rank));
      return [0, Math.ceil(maxRank * 1.1)];
    } else {
      const maxValue = Math.max(...chartData.map(d => d.teamValue));
      return [0, Math.ceil(maxValue * 1.1)];
    }
  };

  // Get data key based on view type
  const getDataKeys = () => {
    if (viewType === "score") {
      return { actual: "actualScore", projected: "projectedScore", actualLabel: "Actual Score", projectedLabel: "Projected Score" };
    } else if (viewType === "rank") {
      return { actual: "rank", projected: null, actualLabel: "Rank", projectedLabel: null };
    } else {
      return { actual: "teamValue", projected: null, actualLabel: "Team Value", projectedLabel: null };
    }
  };

  const dataKeys = getDataKeys();
  const domain = getDomain();

  return (
    <Card className="bg-gray-800 border-2 border-red-500 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none"></div>
      <CardContent className="p-4 relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-white">Performance Over 24 Rounds</h2>
          <Select value={viewType} onValueChange={(value) => setViewType(value as ChartView)}>
            <SelectTrigger className="w-[180px] bg-gray-700 border-gray-600 text-white" data-testid="select-chart-view">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="score" className="text-white hover:bg-gray-600">Score</SelectItem>
              <SelectItem value="rank" className="text-white hover:bg-gray-600">Rank</SelectItem>
              <SelectItem value="teamValue" className="text-white hover:bg-gray-600">Team Value</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Line Chart */}
        <div className="h-[300px] mt-4 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-red-500/10 to-transparent rounded-lg"></div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 10,
                right: 15,
                left: 40,
                bottom: 25,
              }}
            >
              <defs>
                <linearGradient id="redGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="greenGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05}/>
                </linearGradient>
                <filter id="redGlowFilter">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="greenGlowFilter">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="2 2" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="round"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                interval={1}
                tickFormatter={(value) => `R${value}`}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                domain={domain}
                tickFormatter={(value) => {
                  if (viewType === "teamValue") {
                    return `$${(value / 1000000).toFixed(1)}M`;
                  }
                  return value.toString();
                }}
              />
              <Tooltip
                content={(props) => <CustomTooltip {...props} viewType={viewType} />}
              />
              <Line
                type="monotone"
                dataKey={dataKeys.actual}
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={{ fill: '#ef4444', strokeWidth: 1, r: 3, filter: 'url(#redGlowFilter)' }}
                activeDot={{ r: 5, fill: '#ef4444', stroke: '#ffffff', strokeWidth: 1, filter: 'url(#redGlowFilter)' }}
                filter="url(#redGlowFilter)"
                name={dataKeys.actualLabel}
              />
              {dataKeys.projected && (
                <Line
                  type="monotone"
                  dataKey={dataKeys.projected}
                  stroke="#22c55e"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ fill: '#22c55e', strokeWidth: 1, r: 3 }}
                  activeDot={{ r: 5, fill: '#22c55e', stroke: '#ffffff', strokeWidth: 1 }}
                  name={dataKeys.projectedLabel}
                  connectNulls={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
