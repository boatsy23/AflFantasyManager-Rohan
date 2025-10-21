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
import { motion } from "framer-motion";

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
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="bg-gray-800/95 backdrop-blur-md border-2 border-gray-600 shadow-[0_0_20px_rgba(0,0,0,0.5)] rounded-lg p-3 text-sm"
      >
        <div className="font-semibold mb-2 text-white text-base drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
          Round {label}
        </div>
        {payload.map((entry, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="flex items-center py-1" 
            style={{ color: entry.color as string }}
          >
            <div 
              className="w-3 h-3 rounded-full mr-2 shadow-[0_0_8px_currentColor]" 
              style={{ backgroundColor: entry.color as string }}
            ></div>
            <span className="font-medium">
              {entry.name}: {
                viewType === "teamValue" 
                  ? `$${((entry.value as number) / 1000000).toFixed(1)}M`
                  : entry.value
              }
            </span>
          </motion.div>
        ))}
      </motion.div>
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="bg-gray-800/95 backdrop-blur-sm border-2 border-red-500 relative overflow-hidden shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all duration-300 active:scale-[0.995] touch-manipulation">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,0.15),transparent_50%)] pointer-events-none"></div>
        <CardContent className="p-3 sm:p-4 md:p-6 relative">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-base sm:text-lg md:text-xl font-semibold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
            >
              Performance Over 24 Rounds
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Select value={viewType} onValueChange={(value) => setViewType(value as ChartView)}>
                <SelectTrigger 
                  className="w-full sm:w-[180px] bg-gray-700/90 backdrop-blur-sm border-gray-600 text-white 
                    hover:bg-gray-600/90 transition-all duration-200 active:scale-95 touch-manipulation
                    shadow-[0_0_10px_rgba(0,0,0,0.3)]"
                  data-testid="select-chart-view"
                >
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700/95 backdrop-blur-md border-gray-600 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                  <SelectItem 
                    value="score" 
                    className="text-white hover:bg-gray-600/90 focus:bg-gray-600/90 active:bg-gray-500/90 transition-colors duration-200 cursor-pointer touch-manipulation"
                  >
                    Score
                  </SelectItem>
                  <SelectItem 
                    value="rank" 
                    className="text-white hover:bg-gray-600/90 focus:bg-gray-600/90 active:bg-gray-500/90 transition-colors duration-200 cursor-pointer touch-manipulation"
                  >
                    Rank
                  </SelectItem>
                  <SelectItem 
                    value="teamValue" 
                    className="text-white hover:bg-gray-600/90 focus:bg-gray-600/90 active:bg-gray-500/90 transition-colors duration-200 cursor-pointer touch-manipulation"
                  >
                    Team Value
                  </SelectItem>
                </SelectContent>
              </Select>
            </motion.div>
          </div>

          {/* Line Chart */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px] mt-4 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-red-500/5 to-transparent rounded-lg"></div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 20,
                }}
              >
                <defs>
                  <linearGradient id="redGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="greenGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05}/>
                  </linearGradient>
                  <filter id="redGlowFilter">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                  <filter id="greenGlowFilter">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#374151" 
                  opacity={0.2}
                  className="transition-opacity duration-300"
                />
                <XAxis 
                  dataKey="round"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  interval="preserveStartEnd"
                  tickFormatter={(value) => `R${value}`}
                  className="text-xs sm:text-sm"
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  domain={domain}
                  width={60}
                  tickFormatter={(value) => {
                    if (viewType === "teamValue") {
                      return `$${(value / 1000000).toFixed(1)}M`;
                    }
                    return value.toString();
                  }}
                  className="text-xs sm:text-sm"
                />
                <Tooltip
                  content={(props) => <CustomTooltip {...props} viewType={viewType} />}
                  cursor={{ stroke: '#6B7280', strokeWidth: 2, strokeDasharray: '5 5' }}
                />
                <Line
                  type="monotone"
                  dataKey={dataKeys.actual}
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={{ 
                    fill: '#ef4444', 
                    strokeWidth: 2, 
                    r: 4, 
                    filter: 'url(#redGlowFilter)',
                    className: 'transition-all duration-200 hover:r-6 cursor-pointer'
                  }}
                  activeDot={{ 
                    r: 7, 
                    fill: '#ef4444', 
                    stroke: '#ffffff', 
                    strokeWidth: 2, 
                    filter: 'url(#redGlowFilter)',
                    className: 'shadow-[0_0_15px_rgba(239,68,68,0.8)]'
                  }}
                  filter="url(#redGlowFilter)"
                  name={dataKeys.actualLabel}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
                {dataKeys.projected && (
                  <Line
                    type="monotone"
                    dataKey={dataKeys.projected}
                    stroke="#22c55e"
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={{ 
                      fill: '#22c55e', 
                      strokeWidth: 2, 
                      r: 4,
                      filter: 'url(#greenGlowFilter)',
                      className: 'transition-all duration-200 hover:r-6 cursor-pointer'
                    }}
                    activeDot={{ 
                      r: 7, 
                      fill: '#22c55e', 
                      stroke: '#ffffff', 
                      strokeWidth: 2,
                      filter: 'url(#greenGlowFilter)',
                      className: 'shadow-[0_0_15px_rgba(34,197,94,0.8)]'
                    }}
                    name={dataKeys.projectedLabel}
                    connectNulls={false}
                    animationDuration={1000}
                    animationEasing="ease-out"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
