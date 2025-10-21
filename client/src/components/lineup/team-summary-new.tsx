import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, Info, Award, BarChart2, ArrowRight, ArrowRightLeft, Brain, Crown, Star, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { formatCurrency, formatScore, getPositionColor } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Map team codes to guernsey image filenames
const TEAM_GUERNSEY_MAP: Record<string, string> = {
  'ADE': 'adelaide',
  'BRI': 'brisbane',
  'CAR': 'carlton',
  'COL': 'collingwood',
  'ESS': 'essendon',
  'FRE': 'fremantle',
  'GEE': 'geelong',
  'GCS': 'gold_coast',
  'GWS': 'gws',
  'HAW': 'hawthorn',
  'MEL': 'melbourne',
  'NTH': 'north_melbourne',
  'PTA': 'port_adelaide',
  'RIC': 'richmond',
  'STK': 'st_kilda',
  'SYD': 'sydney',
  'WCE': 'west_coast',
  'WBD': 'western_bulldogs'
};

// Format player name as first initial + last name
const formatPlayerName = (fullName: string): string => {
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return fullName;
  const firstInitial = parts[0][0].toUpperCase();
  const lastName = parts.slice(1).join(' ');
  return `${firstInitial} ${lastName}`;
};

// Get guernsey image path for team code
const getGuernseyPath = (teamCode?: string): string | null => {
  if (!teamCode) return null;
  const fileName = TEAM_GUERNSEY_MAP[teamCode.toUpperCase()];
  return fileName ? `/guernseys/${fileName}.png` : null;
};

type TeamPlayer = {
  id: number;
  name: string;
  position: string;
  team?: string;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  price?: number;
  breakEven?: number;
  lastScore?: number;
  averagePoints?: number;
  liveScore?: number;
  secondaryPositions?: string[];
  isOnBench?: boolean;
  projScore?: number;
  nextOpponent?: string;
  l3Average?: number;
  roundsPlayed?: number;
};

// Create placeholder players when not enough actual players are available
const getPlaceholders = (position: string, count: number, startId: number) => {
  return Array(count).fill(null).map((_, i) => ({
    id: startId + i,
    name: `Player ${String.fromCharCode(65 + i)}`,
    position,
    team: "TBD",
    price: 500000,
    breakEven: 80,
    lastScore: 70,
    averagePoints: 75,
    liveScore: 0,
    isOnBench: false,
    nextOpponent: "BYE",
    l3Average: 72,
    roundsPlayed: 6
  }));
};

type PositionSectionProps = {
  title: string;
  shortCode: string;
  fieldPlayers: TeamPlayer[];
  benchPlayers: TeamPlayer[];
  requiredFieldCount: number;
  requiredBenchCount: number;
  color: string;
  hasBorder?: boolean;
  onPlayerClick?: (player: TeamPlayer) => void;
  onPlayerNameClick?: (player: TeamPlayer, e: React.MouseEvent) => void;
};

const PositionSection = ({ 
  title, 
  shortCode, 
  fieldPlayers, 
  benchPlayers, 
  requiredFieldCount,
  requiredBenchCount,
  color,
  hasBorder = true,
  onPlayerClick,
  onPlayerNameClick
}: PositionSectionProps) => {
  const [expanded, setExpanded] = useState(true);
  
  // Fill with placeholders if needed
  const paddedFieldPlayers = [...fieldPlayers];
  const paddedBenchPlayers = [...benchPlayers];
  
  if (paddedFieldPlayers.length < requiredFieldCount) {
    paddedFieldPlayers.push(...getPlaceholders(shortCode, requiredFieldCount - paddedFieldPlayers.length, 10000 + paddedFieldPlayers.length));
  }
  
  if (paddedBenchPlayers.length < requiredBenchCount) {
    paddedBenchPlayers.push(...getPlaceholders(shortCode, requiredBenchCount - paddedBenchPlayers.length, 20000 + paddedBenchPlayers.length));
  }
  
  // Take only required number of players
  const displayFieldPlayers = paddedFieldPlayers.slice(0, requiredFieldCount);
  const displayBenchPlayers = paddedBenchPlayers.slice(0, requiredBenchCount);
  
  return (
    <div className={`${hasBorder ? 'border-b border-gray-200 pb-3 mb-3' : 'mb-3'}`}>
      <button 
        className="w-full flex items-center justify-between font-medium p-2 cursor-pointer rounded-t-md text-white"
        style={{ backgroundColor: color }}
        onClick={() => setExpanded(!expanded)}
        data-testid={`button-toggle-${shortCode.toLowerCase()}`}
      >
        <h3 className="font-medium text-sm" data-testid={`text-position-${shortCode.toLowerCase()}`}>{title}</h3>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      
      {expanded && (
        <>
          <div className={`bg-gray-900 border-2 ${color} rounded-lg`}>
            <div className="grid grid-cols-11 gap-1 items-center border-b border-gray-700 py-2 px-2 bg-gray-800 text-xs font-medium text-white">
              <div className="col-span-3 pl-1">Player</div>
              <div className="col-span-1 text-center border-l border-gray-600 pl-1">Next</div>
              <div className="col-span-1 text-center border-l border-gray-600 pl-1">Live</div>
              <div className="col-span-1 text-center border-l border-gray-600 pl-1">Avg</div>  
              <div className="col-span-1 text-center border-l border-gray-600 pl-1">L3</div>
              <div className="col-span-1 text-center border-l border-gray-600 pl-1">BE</div>
              <div className="col-span-1 text-center border-l border-gray-600 pl-1">Last</div>
              <div className="col-span-1 text-right border-l border-gray-600 pr-1">Price</div>
            </div>
            
            {displayFieldPlayers.map((player, index) => {
              const formattedName = formatPlayerName(player.name);
              const guernseyPath = getGuernseyPath(player.team);
              const rowBgClass = player.isCaptain 
                ? 'bg-yellow-500/20 hover:bg-yellow-500/30' 
                : player.isViceCaptain 
                ? 'bg-blue-500/20 hover:bg-blue-500/30' 
                : 'hover:bg-gray-800';
              
              return (
                <div key={player.id} className={`grid grid-cols-11 gap-1 items-center border-b border-gray-700 py-2 px-2 ${rowBgClass} text-white transition-colors`} data-testid={`row-player-${player.id}`} data-is-captain={player.isCaptain ? 'true' : 'false'} data-is-vice-captain={player.isViceCaptain ? 'true' : 'false'}>
                  <div className="col-span-3 flex items-center gap-2 pl-1">
                    {guernseyPath && (
                      <img 
                        src={guernseyPath} 
                        alt={player.team || ''} 
                        className="w-6 h-6 object-contain flex-shrink-0"
                        data-testid={`img-guernsey-${player.team}`}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div 
                        className="font-medium cursor-pointer hover:text-blue-400 text-sm leading-tight transition-colors truncate"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayerNameClick && onPlayerNameClick(player, e);
                        }}
                        data-testid={`button-player-name-${player.id}`}
                      >
                        {formattedName}
                      </div>
                      <div className="text-xs text-gray-300 leading-tight" data-testid={`text-position-${player.id}`}>
                        {player.secondaryPositions?.length ? (
                          <span className="text-blue-400 font-medium">
                            {shortCode}/{player.secondaryPositions.join('/')}
                          </span>
                        ) : (
                          <span>{shortCode}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-1 text-center text-xs font-medium border-l border-gray-600 pl-1" data-testid={`text-next-opponent-${player.id}`}>
                    {player.nextOpponent || '-'}
                  </div>
                  <div className="col-span-1 text-center text-xs font-medium border-l border-gray-600 pl-1" data-testid={`text-live-score-${player.id}`}>
                    {player.liveScore || '-'}
                  </div>
                  <div className="col-span-1 text-center text-xs font-medium border-l border-gray-600 pl-1" data-testid={`text-avg-points-${player.id}`}>
                    {player.averagePoints?.toFixed(1) || '-'}
                  </div>
                  <div className="col-span-1 text-center text-xs font-medium border-l border-gray-600 pl-1" data-testid={`text-l3-avg-${player.id}`}>
                    {player.l3Average?.toFixed(1) || '-'}
                  </div>
                  <div className="col-span-1 text-center text-xs font-medium border-l border-gray-600 pl-1" data-testid={`text-breakeven-${player.id}`}>
                    {player.breakEven}
                  </div>
                  <div className="col-span-1 text-center text-xs font-medium border-l border-gray-600 pl-1" data-testid={`text-last-score-${player.id}`}>
                    {formatScore(player.lastScore)}
                  </div>
                  <div className="col-span-1 text-right text-xs font-medium border-l border-gray-600 pr-1" data-testid={`text-price-${player.id}`}>
                    {formatCurrency(player.price || 0)}
                  </div>
                </div>
              );
            })}
          </div>
          
          {displayBenchPlayers.length > 0 && (
            <div className={`bg-gray-900 border-2 ${color} rounded-lg mt-2`}>
              <div className="bg-gray-800 py-1 px-2 text-sm font-medium text-white">
                Bench
              </div>
              {displayBenchPlayers.map((player) => {
                const formattedName = formatPlayerName(player.name);
                const guernseyPath = getGuernseyPath(player.team);
                const rowBgClass = player.isCaptain 
                  ? 'bg-yellow-500/20 hover:bg-yellow-500/30' 
                  : player.isViceCaptain 
                  ? 'bg-blue-500/20 hover:bg-blue-500/30' 
                  : 'hover:bg-gray-800';
                
                return (
                  <div key={player.id} className={`grid grid-cols-11 gap-1 items-center border-b border-gray-700 py-2 px-2 ${rowBgClass} text-white transition-colors`} data-testid={`row-bench-player-${player.id}`} data-is-captain={player.isCaptain ? 'true' : 'false'} data-is-vice-captain={player.isViceCaptain ? 'true' : 'false'}>
                    <div className="col-span-3 flex items-center gap-2 pl-1">
                      {guernseyPath && (
                        <img 
                          src={guernseyPath} 
                          alt={player.team || ''} 
                          className="w-6 h-6 object-contain flex-shrink-0"
                          data-testid={`img-bench-guernsey-${player.team}`}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div 
                          className="font-medium cursor-pointer hover:text-blue-400 text-sm leading-tight transition-colors truncate"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPlayerNameClick && onPlayerNameClick(player, e);
                          }}
                          data-testid={`button-bench-player-${player.id}`}
                        >
                          {formattedName}
                        </div>
                        <div className="text-xs text-gray-300 leading-tight" data-testid={`text-bench-position-${player.id}`}>
                          {player.secondaryPositions?.length ? (
                            <span className="text-blue-400 font-medium">
                              {shortCode}/{player.secondaryPositions.join('/')}
                            </span>
                          ) : (
                            <span>{shortCode}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-1 text-center text-xs font-medium border-l border-gray-600 pl-1" data-testid={`text-bench-next-opponent-${player.id}`}>
                      {player.nextOpponent || '-'}
                    </div>
                    <div className="col-span-1 text-center text-xs font-medium border-l border-gray-600 pl-1" data-testid={`text-bench-live-score-${player.id}`}>
                      {player.liveScore || '-'}
                    </div>
                    <div className="col-span-1 text-center text-xs font-medium border-l border-gray-600 pl-1" data-testid={`text-bench-avg-points-${player.id}`}>
                      {player.averagePoints?.toFixed(1) || '-'}
                    </div>
                    <div className="col-span-1 text-center text-xs font-medium border-l border-gray-600 pl-1" data-testid={`text-bench-l3-avg-${player.id}`}>
                      {player.l3Average?.toFixed(1) || '-'}
                    </div>
                    <div className="col-span-1 text-center text-xs font-medium border-l border-gray-600 pl-1" data-testid={`text-bench-breakeven-${player.id}`}>
                      {player.breakEven}
                    </div>
                    <div className="col-span-1 text-center text-xs font-medium border-l border-gray-600 pl-1" data-testid={`text-bench-last-score-${player.id}`}>
                      {formatScore(player.lastScore)}
                    </div>
                    <div className="col-span-1 text-right text-xs font-medium border-l border-gray-600 pr-1" data-testid={`text-bench-price-${player.id}`}>
                      {formatCurrency(player.price || 0)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

type TeamSummaryProps = {
  midfielders: TeamPlayer[];
  forwards: TeamPlayer[];
  defenders: TeamPlayer[];
  rucks: TeamPlayer[];
  utility?: TeamPlayer[];
  tradesAvailable: number;
  onMakeTrade: () => void;
  onPlayerClick?: (player: TeamPlayer) => void;
  onRoleUpdate?: (playerName: string, role: 'captain' | 'viceCaptain' | 'none') => void;
};

export default function TeamSummary({
  midfielders,
  forwards,
  defenders,
  rucks,
  utility = [],
  tradesAvailable,
  onMakeTrade,
  onPlayerClick,
  onRoleUpdate
}: TeamSummaryProps) {
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedPlayerForRole, setSelectedPlayerForRole] = useState<TeamPlayer | null>(null);

  const handlePlayerNameClick = (player: TeamPlayer, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPlayerForRole(player);
    setRoleDialogOpen(true);
  };

  const handleRoleSelect = (role: 'captain' | 'viceCaptain' | 'none') => {
    if (selectedPlayerForRole && onRoleUpdate) {
      onRoleUpdate(selectedPlayerForRole.name, role);
    }
    setRoleDialogOpen(false);
    setSelectedPlayerForRole(null);
  };
  // Generate Trade Out Priority data from actual team data
  const isPremium = (player: TeamPlayer) => (player.price || 0) > 900000;
  const isMidPricer = (player: TeamPlayer) => (player.price || 0) >= 500001 && (player.price || 0) <= 900000;
  const isRookie = (player: TeamPlayer) => (player.price || 0) < 500000;
  
  // Combine all players from the team
  const allPlayers = [...midfielders, ...defenders, ...rucks, ...forwards];
  
  // Analyze for underperforming premium players (L3 or L5 average below projected score)
  const underperformingPremiums = allPlayers
    .filter(player => isPremium(player))
    .filter(player => {
      // Player is underperforming if L3 average is below projected score or average
      const l3Avg = player.l3Average || 0;
      const projected = player.projScore || player.averagePoints || 0;
      return l3Avg < projected * 0.9; // 10% below projection is underperforming
    })
    .map(player => ({
      id: player.id,
      name: player.name,
      position: player.position,
      team: player.team || '',
      price: player.price || 0,
      breakEven: player.breakEven || 0,
      average: player.averagePoints || 0,
      lastScore: player.lastScore || 0,
      projScore: player.projScore || 0,
      reason: "Underperforming relative to price"
    }));
  
  // Find rookies or mid-pricers who have reached their ceiling (BE >= average)
  const peakedRookies = allPlayers
    .filter(player => isRookie(player) || isMidPricer(player))
    .filter(player => {
      const breakEven = player.breakEven || 0;
      const average = player.averagePoints || 0;
      return breakEven >= average; // BE caught up to average means peaked
    })
    .map(player => ({
      id: player.id,
      name: player.name,
      position: player.position,
      team: player.team || '',
      price: player.price || 0,
      breakEven: player.breakEven || 0,
      average: player.averagePoints || 0,
      lastScore: player.lastScore || 0,
      projScore: player.projScore || 0,
      reason: "BE has caught up to average"
    }));
  
  const tradePriorityData = {
    underperforming: underperformingPremiums,
    rookiesCashedOut: peakedRookies
  };
  const [activeToolCategory, setActiveToolCategory] = useState<string>("trade");
  const [isToolsExpanded, setIsToolsExpanded] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("field");
  
  // TODO: Load actual coach's choice data from API endpoints
  const coachChoiceData = {
    mostTradedIn: [],
    mostTradedOut: [],
    formPlayers: {
      hot: [],
      cold: []
    },
    injuries: []
  };
  
  // Separate bench and field players
  const fieldMidfielders = midfielders.filter(p => !p.isOnBench);
  const benchMidfielders = midfielders.filter(p => p.isOnBench || midfielders.indexOf(p) >= 8);
  
  const fieldDefenders = defenders.filter(p => !p.isOnBench);
  const benchDefenders = defenders.filter(p => p.isOnBench || defenders.indexOf(p) >= 6);
  
  const fieldForwards = forwards.filter(p => !p.isOnBench);
  const benchForwards = forwards.filter(p => p.isOnBench || forwards.indexOf(p) >= 6);
  
  const fieldRucks = rucks.filter(p => !p.isOnBench);
  const benchRucks = rucks.filter(p => p.isOnBench || rucks.indexOf(p) >= 2);
  
  // Calculate team stats (include utility in total)
  const allTeamPlayers = [...midfielders, ...forwards, ...defenders, ...rucks, ...utility];
  const totalValue = allTeamPlayers.reduce((sum, player) => sum + (player.price || 0), 0);
  const avgScore = allTeamPlayers.reduce((sum, player) => sum + (player.lastScore || 0), 0) / allTeamPlayers.length;
  
  // Fetch trade history from API
  const { data: tradeHistory = [], isLoading: isLoadingTrades } = useQuery<any[]>({
    queryKey: ['/api/team/trade-history'],
  });
  
  // Define the tools data
  const toolsData = {
    trade: [
      { name: "Trade Optimizer", description: "Find best trades based on projections and form" },
      { name: "Trade Calculator", description: "Calculate points impact from potential trades" },
      { name: "One Up One Down Suggester", description: "Find optimal player pair swaps" },
      { name: "Price Difference Delta", description: "Analyze potential value changes" },
      { name: "Value Gain Tracker", description: "Track price changes and value growth" },
      { name: "Trade Burn Risk Analyzer", description: "Analyze risk of using multiple trades" },
      { name: "Trade Return Analyzer", description: "Evaluate long-term trade returns" }
    ],
    captain: [
      { name: "Captain Optimizer", description: "Find optimal captain choices for upcoming round" },
      { name: "Auto Captain Loop", description: "Auto-generate captain loop strategy" },
      { name: "Loop Validity Checker", description: "Check if your loop strategy is valid" },
      { name: "VC Success Rate Calculator", description: "Calculate optimal VC selection" },
      { name: "Captain Ceiling Estimator", description: "Identify high-ceiling captain choices" },
      { name: "Loop Strategy Risk Score", description: "Evaluate risk in your loop strategy" }
    ],
    ai: [
      { name: "AI Trade Suggester", description: "AI-powered trade recommendations" },
      { name: "AI Captain Advisor", description: "AI captain selection assistance" },
      { name: "Team Value Analyzer", description: "Team value and balance analysis" },
      { name: "Ownership Risk Monitor", description: "Track ownership % changes across your team" },
      { name: "Form vs Price Scanner", description: "Identify value opportunities" }
    ]
  };
  
  // Determine active tool interface based on category
  const renderActiveToolInterface = () => {
    const tools = toolsData[activeToolCategory as keyof typeof toolsData] || [];
    
    const toolColor = activeToolCategory === "trade" 
      ? "bg-blue-600" 
      : activeToolCategory === "captain" 
        ? "bg-green-600" 
        : "bg-purple-600";
    
    // Handle tool selection
    const handleToolSelect = (tool: { name: string; description: string }) => {
      // When Trade Calculator is selected, trigger the trade modal
      if (tool.name === "Trade Calculator" && onMakeTrade) {
        onMakeTrade();
      } else {
        // For other tools, just show a notification (placeholder)
        console.log(`Selected tool: ${tool.name}`);
      }
    };
        
    return (
      <div className="py-1">
        {tools.map((tool, index) => (
          <div key={index} className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100">
            <div className="flex-grow">
              <div className="font-medium text-sm text-center">{tool.name}</div>
              <div className="text-xs text-gray-500 text-center">{tool.description}</div>
            </div>
            <Button 
              size="sm" 
              className={`${toolColor} h-7 text-xs`}
              onClick={() => handleToolSelect(tool)}
            >
              Use
            </Button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
            

      
      <Card className="overflow-hidden mb-4 bg-gray-900 border-gray-700">
        <div className="grid grid-cols-3 border-b border-gray-700">
          <button 
            className={`py-2 font-medium text-sm ${activeTab === 'field' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-white'}`}
            onClick={() => setActiveTab('field')}
          >
            FIELD
          </button>
          <button 
            className={`py-2 font-medium text-sm ${activeTab === 'coaches' ? 'bg-green-500 text-white' : 'bg-gray-800 text-white'}`}
            onClick={() => setActiveTab('coaches')}
          >
            COACH
          </button>
          <button 
            className={`py-2 font-medium text-sm ${activeTab === 'history' ? 'bg-green-500 text-white' : 'bg-gray-800 text-white'}`}
            onClick={() => setActiveTab('history')}
          >
            HISTORY
          </button>
        </div>
        
        {activeTab === 'field' && (
          <div className="bg-gray-900 p-3 rounded-lg">
            <PositionSection
              title="Defenders"
              shortCode="DEF"
              fieldPlayers={fieldDefenders}
              benchPlayers={benchDefenders}
              requiredFieldCount={6}
              requiredBenchCount={2}
              color="border-blue-500"
              onPlayerClick={onPlayerClick}
              onPlayerNameClick={handlePlayerNameClick}
            />
            
            <div className="mt-3">
              <PositionSection
                title="Midfielders"
                shortCode="MID"
                fieldPlayers={fieldMidfielders}
                benchPlayers={benchMidfielders}
                requiredFieldCount={8}
                requiredBenchCount={2}
                color="border-green-500"
                onPlayerClick={onPlayerClick}
                onPlayerNameClick={handlePlayerNameClick}
              />
            </div>
            
            <div className="mt-3">
              <PositionSection
                title="Rucks"
                shortCode="R"
                fieldPlayers={fieldRucks}
                benchPlayers={benchRucks}
                requiredFieldCount={2}
                requiredBenchCount={1}
                color="border-orange-500"
                onPlayerClick={onPlayerClick}
                onPlayerNameClick={handlePlayerNameClick}
              />
            </div>
            
            <div className="mt-3">
              <PositionSection
                title="Forwards"
                shortCode="F"
                fieldPlayers={fieldForwards}
                benchPlayers={benchForwards}
                requiredFieldCount={6}
                requiredBenchCount={2}
                color="border-red-500"
                hasBorder={utility.length > 0}
                onPlayerClick={onPlayerClick}
                onPlayerNameClick={handlePlayerNameClick}
              />
            </div>
            
            {utility.length > 0 && (
              <div className="bg-gray-900 border-2 border-teal-500 rounded-lg mt-3">
                <div className="bg-gray-800 py-1 px-2 text-sm font-medium text-white">
                  Utility
                </div>
                <div className="grid grid-cols-11 gap-1 items-center border-b border-gray-700 py-2 px-2 bg-gray-800 text-xs font-medium text-white">
                  <div className="col-span-3 pl-1">Player</div>
                  <div className="col-span-1 text-center border-l border-gray-600 pl-1">Next</div>
                  <div className="col-span-1 text-center border-l border-gray-600 pl-1">Live</div>
                  <div className="col-span-1 text-center border-l border-gray-600 pl-1">Avg</div>  
                  <div className="col-span-1 text-center border-l border-gray-600 pl-1">L3</div>
                  <div className="col-span-1 text-center border-l border-gray-600 pl-1">BE</div>
                  <div className="col-span-1 text-center border-l border-gray-600 pl-1">Last</div>
                  <div className="col-span-1 text-right border-l border-gray-600 pr-1">Price</div>
                </div>
                {utility.map((utilityPlayer) => {
                  const formattedName = formatPlayerName(utilityPlayer.name);
                  const guernseyPath = getGuernseyPath(utilityPlayer.team);
                  const rowBgClass = utilityPlayer.isCaptain 
                    ? 'bg-yellow-500/20 hover:bg-yellow-500/30' 
                    : utilityPlayer.isViceCaptain 
                    ? 'bg-blue-500/20 hover:bg-blue-500/30' 
                    : 'hover:bg-gray-800';
                  
                  return (
                    <div key={utilityPlayer.id} className={`grid grid-cols-11 gap-1 items-center border-b border-gray-700 py-2 px-2 ${rowBgClass} text-white transition-colors`} data-testid={`row-utility-player-${utilityPlayer.id}`} data-is-captain={utilityPlayer.isCaptain ? 'true' : 'false'} data-is-vice-captain={utilityPlayer.isViceCaptain ? 'true' : 'false'}>
                      <div className="col-span-3 flex items-center gap-2 pl-1">
                        {guernseyPath && (
                          <img 
                            src={guernseyPath} 
                            alt={utilityPlayer.team || ''} 
                            className="w-6 h-6 object-contain flex-shrink-0"
                            data-testid={`img-utility-guernsey-${utilityPlayer.team}`}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div 
                            className="font-medium cursor-pointer hover:text-blue-400 text-sm leading-tight transition-colors truncate"
                            onClick={() => onPlayerClick && onPlayerClick(utilityPlayer)}
                            data-testid={`button-utility-player-${utilityPlayer.id}`}
                          >
                            {formattedName}
                          </div>
                          <div className="text-xs text-gray-300 leading-tight" data-testid={`text-utility-position-${utilityPlayer.id}`}>
                            {utilityPlayer.secondaryPositions?.length ? (
                              <span className="text-blue-400 font-medium">
                                {utilityPlayer.position}/{utilityPlayer.secondaryPositions.join('/')}
                              </span>
                            ) : (
                              <span>{utilityPlayer.position}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="col-span-1 text-center text-xs font-medium border-l border-gray-600 pl-1" data-testid={`text-utility-next-opponent-${utilityPlayer.id}`}>
                        {utilityPlayer.nextOpponent || '-'}
                      </div>
                      <div className="col-span-1 text-center text-xs font-medium border-l border-gray-600 pl-1" data-testid={`text-utility-live-score-${utilityPlayer.id}`}>
                        {utilityPlayer.liveScore || '-'}
                      </div>
                      <div className="col-span-1 text-center text-xs font-medium border-l border-gray-600 pl-1" data-testid={`text-utility-avg-points-${utilityPlayer.id}`}>
                        {utilityPlayer.averagePoints?.toFixed(1) || '-'}
                      </div>
                      <div className="col-span-1 text-center text-xs font-medium border-l border-gray-600 pl-1" data-testid={`text-utility-l3-avg-${utilityPlayer.id}`}>
                        {utilityPlayer.l3Average?.toFixed(1) || '-'}
                      </div>
                      <div className="col-span-1 text-center text-xs font-medium border-l border-gray-600 pl-1" data-testid={`text-utility-breakeven-${utilityPlayer.id}`}>
                        {utilityPlayer.breakEven}
                      </div>
                      <div className="col-span-1 text-center text-xs font-medium border-l border-gray-600 pl-1" data-testid={`text-utility-last-score-${utilityPlayer.id}`}>
                        {formatScore(utilityPlayer.lastScore)}
                      </div>
                      <div className="col-span-1 text-right text-xs font-medium border-l border-gray-600 pr-1" data-testid={`text-utility-price-${utilityPlayer.id}`}>
                        {formatCurrency(utilityPlayer.price || 0)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Trade Out Priority Section */}
            <div className="mt-4 bg-gray-900 border-2 border-red-500 rounded-lg overflow-hidden">
              <div className="bg-red-600 text-white p-2 font-medium">
                Trade Out Priority
              </div>
              
              <div>
                <div className="px-3 py-2 bg-gray-800 font-medium text-white">
                  Underperforming Players
                </div>
                <div className="divide-y divide-gray-700">
                  {tradePriorityData.underperforming.map(player => (
                    <div key={player.id} className="p-3 hover:bg-gray-800 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium flex items-center">
                            {player.name} 
                            <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded">
                              {player.position}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400">{player.team}</div>
                        </div>
                        <div className="text-sm">
                          <div className="font-medium text-white">{formatCurrency(player.price)}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 mt-2 text-xs">
                        <div>
                          <span className="text-gray-400">BE:</span> <span className="font-medium text-red-400">{player.breakEven}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Avg:</span> <span className="font-medium text-white">{player.average}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Last:</span> <span className="font-medium text-white">{player.lastScore}</span>
                        </div>
                      </div>
                      <div className="mt-1.5 text-xs text-gray-400">
                        {player.reason}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="px-3 py-2 bg-gray-800 font-medium text-white">
                  Rookies to Cash Out
                </div>
                <div className="divide-y divide-gray-700">
                  {tradePriorityData.rookiesCashedOut.map(player => (
                    <div key={player.id} className="p-3 hover:bg-gray-800 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium flex items-center">
                            {player.name} 
                            <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded">
                              {player.position}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400">{player.team}</div>
                        </div>
                        <div className="text-sm">
                          <div className="font-medium text-white">{formatCurrency(player.price)}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 mt-2 text-xs">
                        <div>
                          <span className="text-gray-400">BE:</span> <span className="font-medium text-amber-400">{player.breakEven}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Avg:</span> <span className="font-medium text-white">{player.average}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Last:</span> <span className="font-medium text-white">{player.lastScore}</span>
                        </div>
                      </div>
                      <div className="mt-1.5 text-xs text-gray-400">
                        {player.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'coaches' && (
          <div className="p-4">
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-4 text-white">Most Traded This Week</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-green-600 text-white p-2 font-medium">
                    Most Traded In
                  </div>
                  <div className="divide-y">
                    {coachChoiceData.mostTradedIn.map(player => (
                      <div key={player.id} className="p-3 hover:bg-gray-800 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-white">{player.name}</div>
                            <div className="text-xs text-gray-400">{player.team} | {player.position}</div>
                          </div>
                          <div className="text-sm">
                            <div className="font-medium text-white">{formatCurrency(player.price)}</div>
                            <div className="text-green-400 text-xs font-medium">{player.change} ↑</div>
                          </div>
                        </div>
                        <div className="flex justify-between mt-1.5 text-xs">
                          <div className="text-gray-400">
                            Last: <span className="font-medium text-white">{player.lastScore}</span>
                          </div>
                          <div className="text-gray-400">
                            Avg: <span className="font-medium text-white">{player.avgScore}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border border-gray-600 rounded-lg overflow-hidden bg-gray-900">
                  <div className="bg-red-600 text-white p-2 font-medium">
                    Most Traded Out
                  </div>
                  <div className="divide-y divide-gray-700">
                    {coachChoiceData.mostTradedOut.map(player => (
                      <div key={player.id} className="p-3 hover:bg-gray-800 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-white">{player.name}</div>
                            <div className="text-xs text-gray-400">{player.team} | {player.position}</div>
                          </div>
                          <div className="text-sm">
                            <div className="font-medium text-white">{formatCurrency(player.price)}</div>
                            <div className="text-red-400 text-xs font-medium">{player.change} ↓</div>
                          </div>
                        </div>
                        <div className="flex justify-between mt-1.5 text-xs">
                          <div className="text-gray-400">
                            Last: <span className="font-medium text-white">{player.lastScore}</span>
                          </div>
                          <div className="text-gray-400">
                            Avg: <span className="font-medium text-white">{player.avgScore}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-4 text-white">Form Guide</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="border border-gray-600 rounded-lg overflow-hidden bg-gray-900">
                  <div className="bg-amber-500 text-white p-2 font-medium">
                    Running Hot 🔥
                  </div>
                  <div className="divide-y divide-gray-700">
                    {coachChoiceData.formPlayers.hot.map(player => (
                      <div key={player.id} className="p-3 hover:bg-gray-800 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-white">{player.name}</div>
                            <div className="text-xs text-gray-400">{player.team} | {player.position}</div>
                          </div>
                          <div className="text-sm">
                            <div className="font-medium text-white">{formatCurrency(player.price)}</div>
                            <div className="text-amber-400 text-xs font-medium">Avg: {player.avgScore} ⭐</div>
                          </div>
                        </div>
                        <div className="mt-1.5 text-xs text-gray-400">
                          <span className="font-medium text-white">{player.trend}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border border-gray-600 rounded-lg overflow-hidden bg-gray-900">
                  <div className="bg-blue-500 text-white p-2 font-medium">
                    Gone Cold ❄️
                  </div>
                  <div className="divide-y divide-gray-700">
                    {coachChoiceData.formPlayers.cold.map(player => (
                      <div key={player.id} className="p-3 hover:bg-gray-800 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-white">{player.name}</div>
                            <div className="text-xs text-gray-400">{player.team} | {player.position}</div>
                          </div>
                          <div className="text-sm">
                            <div className="font-medium text-white">{formatCurrency(player.price)}</div>
                            <div className="text-blue-400 text-xs font-medium">Avg: {player.avgScore} ⬇</div>
                          </div>
                        </div>
                        <div className="mt-1.5 text-xs text-gray-400">
                          <span className="font-medium text-white">{player.trend}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="font-semibold text-lg mb-4 text-white">Injury Update</h3>
              
              <div className="border border-gray-600 rounded-lg overflow-hidden bg-gray-900">
                <div className="bg-gray-700 text-white p-2 font-medium">
                  Latest Injury News
                </div>
                <div className="divide-y divide-gray-700">
                  {coachChoiceData.injuries.map(player => (
                    <div key={player.id} className="p-3 hover:bg-gray-800 flex items-center justify-between text-white">
                      <div>
                        <div className="font-medium text-white">{player.name}</div>
                        <div className="text-xs text-gray-400">{player.team} | {player.position}</div>
                      </div>
                      <div className="text-sm">
                        <div className={`font-medium ${player.status === 'Out' ? 'text-red-400' : 'text-amber-400'}`}>
                          {player.status}
                        </div>
                        <div className="text-xs text-gray-400">
                          {player.details}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'history' && (
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-4 text-white">Trade History</h3>
            
            {isLoadingTrades ? (
              <div className="text-center p-6 bg-gray-900 border border-gray-600 rounded-lg">
                <div className="text-gray-400">Loading trade history...</div>
              </div>
            ) : tradeHistory.length > 0 ? (
              tradeHistory.map((roundData, roundIndex) => {
                const tradedOut = roundData.tradedOut || [];
                const tradedIn = roundData.tradedIn || [];
                const maxTrades = Math.max(tradedOut.length, tradedIn.length);
                
                return (
                  <div key={roundIndex} className="mb-6">
                    <div className="flex items-center mb-2">
                      <div className="bg-green-500 text-white font-medium px-2 py-1 rounded text-sm">
                        Round {roundData.round}
                      </div>
                    </div>
                    
                    {maxTrades > 0 && (
                      <div className="border border-gray-600 rounded-lg overflow-hidden mb-3 shadow-sm bg-gray-900">
                        <div className="grid grid-cols-2 bg-gray-800">
                          <div className="p-3 border-r border-gray-600 border-b border-gray-600">
                            <div className="flex items-center">
                              <div className="bg-red-900 rounded-full p-1.5">
                                <ArrowRightLeft className="h-4 w-4 text-red-400" />
                              </div>
                              <span className="ml-2 font-medium text-red-400">TRADED OUT</span>
                            </div>
                          </div>
                          <div className="p-3 border-b border-gray-600">
                            <div className="flex items-center">
                              <div className="bg-green-900 rounded-full p-1.5">
                                <ArrowRightLeft className="h-4 w-4 text-green-400" />
                              </div>
                              <span className="ml-2 font-medium text-green-400">TRADED IN</span>
                            </div>
                          </div>
                        </div>
                        
                        {Array.from({ length: maxTrades }).map((_, tradeIndex) => {
                          const playerOut = tradedOut[tradeIndex];
                          const playerIn = tradedIn[tradeIndex];
                          
                          return (
                            <div key={tradeIndex} className="grid grid-cols-2 border-b border-gray-700 last:border-b-0">
                              {/* Player Out */}
                              <div className="p-3 border-r border-gray-600">
                                {playerOut ? (
                                  <div className="font-semibold text-base text-white">{playerOut}</div>
                                ) : (
                                  <div className="text-sm text-gray-500">-</div>
                                )}
                              </div>
                              
                              {/* Player In */}
                              <div className="p-3">
                                {playerIn ? (
                                  <div className="font-semibold text-base text-white">{playerIn}</div>
                                ) : (
                                  <div className="text-sm text-gray-500">-</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center p-6 bg-gray-900 border border-gray-600 rounded-lg">
                <div className="text-gray-400 mb-2">
                  <ArrowRightLeft className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-white mb-1">No trade history</h3>
                <p className="text-gray-400">You haven't made any trades yet this season.</p>
              </div>
            )}
          </div>
        )}
      </Card>

      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-600 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Select Role</DialogTitle>
            <DialogDescription className="text-gray-400">
              Choose a role for {selectedPlayerForRole?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <Button
              onClick={() => handleRoleSelect('captain')}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white flex items-center justify-center gap-2"
              data-testid="button-set-captain"
            >
              <Crown className="h-5 w-5" />
              Set as Captain (C)
            </Button>
            <Button
              onClick={() => handleRoleSelect('viceCaptain')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
              data-testid="button-set-vice-captain"
            >
              <Star className="h-5 w-5" />
              Set as Vice-Captain (VC)
            </Button>
            <Button
              onClick={() => handleRoleSelect('none')}
              className="w-full bg-red-900 hover:bg-red-800 text-white flex items-center justify-center gap-2"
              data-testid="button-remove-role"
            >
              <XCircle className="h-5 w-5" />
              Remove Role
            </Button>
            <Button
              onClick={() => {
                setRoleDialogOpen(false);
                if (selectedPlayerForRole && onPlayerClick) {
                  onPlayerClick(selectedPlayerForRole);
                }
              }}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white flex items-center justify-center gap-2"
              data-testid="button-player-profile"
            >
              <Info className="h-5 w-5" />
              Player Profile
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}