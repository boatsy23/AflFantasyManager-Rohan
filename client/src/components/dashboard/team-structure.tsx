import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, ArrowUp, ArrowDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type PositionCategoryProps = {
  label: string;
  count: number;
  total: number;
  percentage: number;
  color: string;
  value?: string;
};

const PositionCategory = ({ label, count, total, percentage, color, value }: PositionCategoryProps) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.4 }}
    className="mb-3"
  >
    <div className="flex justify-between text-sm mb-1.5">
      <span className={cn(color, "font-medium drop-shadow-[0_0_6px_currentColor]")}>{label}</span>
      <div className="flex items-center gap-2">
        {value && <span className="text-gray-400 text-xs sm:text-sm">{value}</span>}
        <span className="text-white font-medium">{count}/{total}</span>
      </div>
    </div>
    <div className="progress-container h-2.5 bg-gray-700/50 rounded-full overflow-hidden relative shadow-inner">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        className="progress-bar bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 h-full rounded-full relative shadow-[0_0_10px_rgba(59,130,246,0.5)]"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
      </motion.div>
    </div>
  </motion.div>
);

type PositionGroupProps = {
  title: string;
  playerCount: number;
  categories: {
    premium: { count: number, label: string, value?: string };
    midPricer: { count: number, label: string, value?: string };
    rookie: { count: number, label: string, value?: string };
  };
  positionValue?: string;
};

const PositionGroup = ({ title, playerCount, categories, positionValue }: PositionGroupProps) => {
  const premiumPercentage = (categories.premium.count / playerCount) * 100;
  const midPricerPercentage = (categories.midPricer.count / playerCount) * 100;
  const rookiePercentage = (categories.rookie.count / playerCount) * 100;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6 last:mb-0"
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-1">
        <h3 className="font-semibold text-white text-base sm:text-lg drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
          {title}
        </h3>
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          {positionValue && (
            <span className="text-gray-400 drop-shadow-[0_0_6px_rgba(156,163,175,0.3)]">
              {positionValue}
            </span>
          )}
          <span className="text-gray-400">{playerCount} players</span>
        </div>
      </div>
      
      <PositionCategory 
        label={categories.premium.label}
        count={categories.premium.count}
        total={playerCount}
        percentage={premiumPercentage}
        color="text-red-500 font-semibold"
        value={categories.premium.value}
      />
      
      <PositionCategory 
        label={categories.midPricer.label}
        count={categories.midPricer.count}
        total={playerCount}
        percentage={midPricerPercentage}
        color="text-yellow-400 font-semibold"
        value={categories.midPricer.value}
      />
      
      <PositionCategory 
        label={categories.rookie.label}
        count={categories.rookie.count}
        total={playerCount}
        percentage={rookiePercentage}
        color="text-blue-400 font-semibold"
        value={categories.rookie.value}
      />
    </motion.div>
  );
};

// New Performance Component for recent team performance
type TeamPerformanceProps = {
  rounds: {
    round: number;
    score: number;
    rankChange: number;
    rank?: number; // Overall rank (optional)
  }[];
};

const TeamPerformance = ({ rounds }: TeamPerformanceProps) => {
  const maxScore = Math.max(...rounds.map(r => r.score)); // Find the highest score to scale bars

  // Get color for the score bar
  const getScoreBarColor = (score: number) => {
    const percentage = score / maxScore;
    if (percentage > 0.9) return "from-emerald-500 to-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.5)]";
    if (percentage > 0.8) return "from-green-500 to-green-600 shadow-[0_0_10px_rgba(34,197,94,0.5)]";
    if (percentage > 0.7) return "from-lime-500 to-lime-600 shadow-[0_0_10px_rgba(132,204,22,0.5)]";
    if (percentage > 0.6) return "from-yellow-500 to-yellow-600 shadow-[0_0_10px_rgba(234,179,8,0.5)]";
    if (percentage > 0.5) return "from-amber-500 to-amber-600 shadow-[0_0_10px_rgba(245,158,11,0.5)]";
    return "from-orange-500 to-orange-600 shadow-[0_0_10px_rgba(249,115,22,0.5)]";
  };

  return (
    <div className="mb-4">
      <div className="space-y-3">
        {rounds.map((round, index) => (
          <motion.div 
            key={round.round}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="flex flex-col space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white/90">Round {round.round}</span>
              
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Overall Rank (if available) */}
                {round.rank && (
                  <div className="flex items-center text-indigo-400 drop-shadow-[0_0_6px_rgba(99,102,241,0.5)]">
                    <span className="text-xs sm:text-sm font-semibold">
                      Rank: {round.rank.toLocaleString()}
                    </span>
                  </div>
                )}
                
                {/* Rank Change */}
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  className="flex items-center"
                >
                  <span className="text-xs sm:text-sm mr-1 font-medium text-white/80">
                    {round.rankChange > 0 ? "+" : ""}{round.rankChange}
                  </span>
                  {round.rankChange > 0 ? (
                    <ArrowUp className="h-4 w-4 text-green-400 drop-shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
                  ) : round.rankChange < 0 ? (
                    <ArrowDown className="h-4 w-4 text-red-400 drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
                  ) : null}
                </motion.div>
              </div>
            </div>
            
            {/* Score Bar */}
            <div className="flex items-center w-full">
              <div className="w-full h-7 bg-gray-700/40 rounded-lg relative overflow-hidden shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(round.score / (maxScore * 1.1)) * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 + index * 0.1 }}
                  className={`bg-gradient-to-r ${getScoreBarColor(round.score)} h-full rounded-lg relative`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                </motion.div>
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs sm:text-sm font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  {round.score}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

type Player = {
  playerName: string;
  position: string;
  priceRaw: number;
  score: number;
  projectedScore?: number;
  actualScore?: number;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  fieldStatus?: string;
};

type FantasyRoundData = {
  round: number;
  timestamp?: string;
  roundScore: number;
  overallRank: number;
  teamValue: number;
  defenders: Player[];
  midfielders: Player[];
  rucks: Player[];
  forwards: Player[];
  bench?: {
    defenders: Player[];
    midfielders: Player[];
    rucks: Player[];
    forwards: Player[];
    utility: Player[];
  };
  captain?: string;
  viceCaptain?: string;
};

type FantasyTeamData = {
  teamName: string;
  totalPlayers: number;
  currentRound?: FantasyRoundData;
  historicalRounds?: FantasyRoundData[];
};

type TeamStructureProps = {
  midfield: {
    premium: { count: number, label: string };
    midPricer: { count: number, label: string };
    rookie: { count: number, label: string };
  };
  forward: {
    premium: { count: number, label: string };
    midPricer: { count: number, label: string };
    rookie: { count: number, label: string };
  };
  defense: {
    premium: { count: number, label: string };
    midPricer: { count: number, label: string };
    rookie: { count: number, label: string };
  };
  ruck: {
    premium: { count: number, label: string };
    midPricer: { count: number, label: string };
    rookie: { count: number, label: string };
  };
  teamValue: string;
  fantasyData?: FantasyTeamData;
};

export default function TeamStructure({
  midfield,
  forward,
  defense,
  ruck,
  teamValue,
  fantasyData
}: TeamStructureProps) {
  const [valueView, setValueView] = useState<"overall" | "breakdown" | "team-value">("overall");
  
  // Calculate projected scores for each position from fantasy data
  const calculatePositionProjectedScore = (players: Player[]): number => {
    return players.reduce((sum, player) => {
      return sum + (player.projectedScore || player.score || 0);
    }, 0);
  };
  
  // Calculate projected scores for each position (on-field players only)
  const defenseProjectedScore = fantasyData?.currentRound ? calculatePositionProjectedScore(fantasyData.currentRound.defenders) : 0;
  const midfieldProjectedScore = fantasyData?.currentRound ? calculatePositionProjectedScore(fantasyData.currentRound.midfielders) : 0;
  const ruckProjectedScore = fantasyData?.currentRound ? calculatePositionProjectedScore(fantasyData.currentRound.rucks) : 0;
  const forwardProjectedScore = fantasyData?.currentRound ? calculatePositionProjectedScore(fantasyData.currentRound.forwards) : 0;
  
  // Calculate actual position values from fantasy data
  const calculatePositionValue = (players: Player[]): string => {
    const totalValue = players.reduce((sum, player) => sum + (player.priceRaw || 0), 0);
    return `$${(totalValue / 1000000).toFixed(1)}M`;
  };
  
  const midfieldValue = fantasyData?.currentRound ? calculatePositionValue(fantasyData.currentRound.midfielders) : "$0M";
  const forwardValue = fantasyData?.currentRound ? calculatePositionValue(fantasyData.currentRound.forwards) : "$0M";
  const defenseValue = fantasyData?.currentRound ? calculatePositionValue(fantasyData.currentRound.defenders) : "$0M";
  const ruckValue = fantasyData?.currentRound ? calculatePositionValue(fantasyData.currentRound.rucks) : "$0M";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="bg-gray-800/95 backdrop-blur-sm border-2 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all duration-300 active:scale-[0.995] touch-manipulation">
        <CardContent className="p-4 sm:p-5 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-base sm:text-lg md:text-xl font-semibold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
            >
              Team Value
            </motion.h2>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="w-full sm:w-auto"
            >
              <Select 
                value={valueView} 
                onValueChange={(value) => setValueView(value as "overall" | "breakdown" | "team-value")}
              >
                <SelectTrigger 
                  className="w-full sm:w-[180px] bg-gray-700/90 backdrop-blur-sm border-gray-600 text-white 
                    hover:bg-gray-600/90 transition-all duration-200 active:scale-95 touch-manipulation
                    shadow-[0_0_10px_rgba(0,0,0,0.3)]"
                >
                  <SelectValue placeholder="Value Display" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700/95 backdrop-blur-md border-gray-600 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                  <SelectItem 
                    value="overall"
                    className="text-white hover:bg-gray-600/90 focus:bg-gray-600/90 active:bg-gray-500/90 transition-colors duration-200 cursor-pointer touch-manipulation"
                  >
                    Overall Value
                  </SelectItem>
                  <SelectItem 
                    value="breakdown"
                    className="text-white hover:bg-gray-600/90 focus:bg-gray-600/90 active:bg-gray-500/90 transition-colors duration-200 cursor-pointer touch-manipulation"
                  >
                    Value Breakdown
                  </SelectItem>
                  <SelectItem 
                    value="team-value"
                    className="text-white hover:bg-gray-600/90 focus:bg-gray-600/90 active:bg-gray-500/90 transition-colors duration-200 cursor-pointer touch-manipulation"
                  >
                    Team Value
                  </SelectItem>
                </SelectContent>
              </Select>
            </motion.div>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={valueView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <PositionGroup 
                title="Midfield"
                playerCount={10}
                categories={{
                  premium: {
                    ...midfield.premium,
                    value: valueView === "team-value" ? "$1,800,000" : undefined 
                  },
                  midPricer: {
                    ...midfield.midPricer,
                    value: valueView === "team-value" ? "$1,050,000" : undefined
                  },
                  rookie: {
                    ...midfield.rookie,
                    value: valueView === "team-value" ? "$350,000" : undefined
                  }
                }}
                positionValue={valueView === "breakdown" ? midfieldValue : `Projected: ${midfieldProjectedScore} pts`}
              />
              
              <PositionGroup 
                title="Forward"
                playerCount={6}
                categories={{
                  premium: {
                    ...forward.premium,
                    value: valueView === "team-value" ? "$1,200,000" : undefined
                  },
                  midPricer: {
                    ...forward.midPricer,
                    value: valueView === "team-value" ? "$450,000" : undefined
                  },
                  rookie: {
                    ...forward.rookie,
                    value: valueView === "team-value" ? "$200,000" : undefined
                  }
                }}
                positionValue={valueView === "breakdown" ? forwardValue : `Projected: ${forwardProjectedScore} pts`}
              />
              
              <PositionGroup 
                title="Defense"
                playerCount={6}
                categories={{
                  premium: {
                    ...defense.premium,
                    value: valueView === "team-value" ? "$1,000,000" : undefined
                  },
                  midPricer: {
                    ...defense.midPricer,
                    value: valueView === "team-value" ? "$500,000" : undefined
                  },
                  rookie: {
                    ...defense.rookie,
                    value: valueView === "team-value" ? "$200,000" : undefined
                  }
                }}
                positionValue={valueView === "breakdown" ? defenseValue : `Projected: ${defenseProjectedScore} pts`}
              />
              
              <PositionGroup 
                title="Ruck"
                playerCount={2}
                categories={{
                  premium: {
                    ...ruck.premium,
                    value: valueView === "team-value" ? "$750,000" : undefined
                  },
                  midPricer: {
                    ...ruck.midPricer,
                    value: valueView === "team-value" ? "$200,000" : undefined
                  },
                  rookie: {
                    ...ruck.rookie,
                    value: undefined
                  }
                }}
                positionValue={valueView === "breakdown" ? ruckValue : `Projected: ${ruckProjectedScore} pts`}
              />
            </motion.div>
          </AnimatePresence>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-6 pt-4 border-t-2 border-gray-600/50 flex items-center justify-between"
          >
            <span className="font-semibold text-base sm:text-lg text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
              Team Value
            </span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg sm:text-xl md:text-2xl text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                {teamValue}
              </span>
              <motion.div
                whileHover={{ rotate: 5, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
              >
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
              </motion.div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
