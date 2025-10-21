import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import TeamSummaryNew from "@/components/lineup/team-summary-new";
import TeamSummaryGrid from "@/components/lineup/team-summary-grid";
import TeamLineup from "@/components/lineup/team-lineup";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Player as BasePlayer } from "@/components/player-stats/player-table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PlayerDetailModal from "@/components/player-stats/player-detail-modal";
import { Player as DetailPlayer } from "@/components/player-stats/player-types";
import { TradeCalculatorModal } from "@/components/tools/trade/trade-calculator-modal";
// Define LineupPlayer type locally
interface LineupPlayer {
  id: number;
  name: string;
  team: string;
  position: string;
  price: number;
  averagePoints?: number;
  projScore?: number;
  lastScore?: number;
  liveScore?: number;
  isCaptain?: boolean;
  isOnBench?: boolean;
}
import { fetchUserTeam, convertTeamDataToLineupFormat, uploadTeam } from "@/legacy/services/teamService";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, UploadCloud, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Extend Player type for lineup view
type Player = BasePlayer & {
  isCaptain?: boolean;
  isOnBench?: boolean;
  secondaryPositions?: string[];
  nextOpponent?: string;
  l3Average?: number;
  roundsPlayed?: number;
};

export default function Lineup() {
  const { toast } = useToast();
  
  // UI states
  const [view, setView] = useState<"cards" | "list">("cards");
  const [selectedPlayer, setSelectedPlayer] = useState<DetailPlayer | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isTradeCalculatorOpen, setIsTradeCalculatorOpen] = useState<boolean>(false);
  
  // Team data states
  const [enhancedPlayers, setEnhancedPlayers] = useState<Player[]>([]);
  const [userTeam, setUserTeam] = useState<any>(null);
  const [userTeamPlayers, setUserTeamPlayers] = useState<{
    midfielders: LineupPlayer[],
    defenders: LineupPlayer[],
    forwards: LineupPlayer[],
    rucks: LineupPlayer[],
    bench?: {
      defenders: LineupPlayer[],
      midfielders: LineupPlayer[],
      forwards: LineupPlayer[],
      rucks: LineupPlayer[],
      utility: LineupPlayer[]
    }
  } | null>(null);
  const [isLoadingUserTeam, setIsLoadingUserTeam] = useState<boolean>(false);
  const [hasUserTeamError, setHasUserTeamError] = useState<boolean>(false);
  
  // Sample team text for the textarea
  const [teamText, setTeamText] = useState<string>(`Defenders
Harry sheezel
Jayden short
Matt roberts
Riley bice
Jaxon prior
Zach Reid
Defenders bench 
Finn O'Sullivan 
Connor stone 

Midfielders 
Jordan Dawson 
Andrew Brayshaw 
Nick daicos 
Connor rozee
Zach Merrett
Clayton Oliver
Levi Ashcroft 
Xavier Lindsay
Midfielders bench 
Hugh boxshall
Isaac Kako

Rucks 
Tristan xerri
Tom de konning 
Bench ruck
Harry Boyd

Forwards 
Isaac Rankine 
Christian petracca
Bailey Smith 
Jack MacRae
Caleb Daniel
San Davidson 
Forward bench
Caiden Cleary
Campbell gray

Bench utility 
James leake`);

  // API data for the demo team
  type Team = {
    id: number;
    userId: number;
    name: string;
    value: number;
    score: number;
    overallRank: number;
    trades: number;
    captainId: number;
  };

  type TeamPlayer = {
    teamId: number;
    playerId: number;
    position: string;
    player: BasePlayer;
  };

  // Fetch user's AFL Fantasy team with master stats enrichment
  const { data: lineupData, isLoading: isLoadingLineup, error: lineupError } = useQuery({
    queryKey: ["/api/team/lineup"],
    retry: 2
  });
  
  // Process lineup data when available
  useEffect(() => {
    if (lineupData && (lineupData as any)?.status === 'success' && (lineupData as any)?.data) {
      // Convert the API data to the correct format for lineup components
      const apiData = (lineupData as any).data;
      
      // Convert team data to lineup format with proper typing
      const formatPlayerData = (players: any[]) => {
        return players.map(p => ({
          ...p,
          name: p.name || 'Unknown Player',
          id: p.id || 0,
          position: p.position || 'UNKNOWN',
          team: p.team || '',
          price: p.price || 0,
          // Preserve captain/vice-captain flags
          isCaptain: p.isCaptain || false,
          isViceCaptain: p.isViceCaptain || false
        }));
      };
      
      setUserTeamPlayers({
        midfielders: formatPlayerData(apiData.midfielders || []),
        forwards: formatPlayerData(apiData.forwards || []),
        defenders: formatPlayerData(apiData.defenders || []),
        rucks: formatPlayerData(apiData.rucks || []),
        bench: apiData.bench ? {
          defenders: formatPlayerData(apiData.bench.defenders || []),
          midfielders: formatPlayerData(apiData.bench.midfielders || []),
          forwards: formatPlayerData(apiData.bench.forwards || []),
          rucks: formatPlayerData(apiData.bench.rucks || []),
          utility: formatPlayerData(apiData.bench.utility || [])
        } : undefined
      });
    }
  }, [lineupData]);

  const handleMakeTrade = () => {
    setIsTradeCalculatorOpen(true);
  };
  
  // Handler for opening player detail modal
  const openPlayerDetailModal = (player: any) => {
    // Convert player data to the format expected by PlayerDetailModal
    const detailPlayer = {
      id: player.id,
      name: player.name,
      team: player.team || "",
      position: player.position,
      price: player.price || 0,
      breakEven: player.breakEven || 0,
      category: player.position || "",
      averagePoints: player.averagePoints || 0,
      lastScore: player.lastScore || null,
      projectedScore: player.projScore || null,
      roundsPlayed: player.roundsPlayed || 0,
      l3Average: player.l3Average || null,
      nextOpponent: player.nextOpponent || null,
      // Add other fields from player-types.ts with null values
      l5Average: null,
      priceChange: 0,
      pricePerPoint: null,
      totalPoints: player.averagePoints ? player.averagePoints * (player.roundsPlayed || 7) : 0,
      selectionPercentage: null,
      // Basic stats
      kicks: null,
      handballs: null,
      disposals: null,
      marks: null,
      tackles: null,
      freeKicksFor: null,
      freeKicksAgainst: null,
      clearances: null,
      hitouts: null,
      cba: null,
      kickIns: null,
      uncontestedMarks: null,
      contestedMarks: null,
      uncontestedDisposals: null,
      contestedDisposals: null,
      // Status
      isSelected: true,
      isInjured: false,
      isSuspended: false,
    };
    
    setSelectedPlayer(detailPlayer);
    setIsDetailModalOpen(true);
  };
  
  // Mutation for scraping team data
  const scrapeMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/scrape-team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        throw new Error('Failed to scrape team');
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch lineup data
      queryClient.invalidateQueries({ queryKey: ["/api/team/lineup"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team/scraped"] });
      
      toast({
        title: "Team Updated",
        description: "Your AFL Fantasy team has been successfully scraped and updated",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Scraping Failed",
        description: error.message || "Failed to scrape team data. Please check your credentials.",
        variant: "destructive"
      });
    }
  });

  // Mutation for updating player roles (captain/vice-captain)
  const roleUpdateMutation = useMutation({
    mutationFn: async ({ playerName, role }: { playerName: string, role: 'captain' | 'viceCaptain' | 'none' }) => {
      const response = await apiRequest('POST', '/api/team/fantasy-data/roles', {
        playerId: playerName,
        role: role
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch team data to show updated roles
      queryClient.invalidateQueries({ queryKey: ["/api/team/fantasy-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team/lineup"] });
      
      const roleLabel = variables.role === 'captain' ? 'Captain' : variables.role === 'viceCaptain' ? 'Vice-Captain' : 'No role';
      toast({
        title: "Role Updated",
        description: `${variables.playerName} set as ${roleLabel}`,
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Role Update Failed",
        description: error.message || "Failed to update player role. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Handler for role updates from TeamLineup/TeamSummaryNew
  const handleRoleUpdate = (playerName: string, role: 'captain' | 'viceCaptain' | 'none') => {
    roleUpdateMutation.mutate({ playerName, role });
  };
  
  // Load user team (now handled by lineup API)
  const refreshLineupData = () => {
    scrapeMutation.mutate();
  };
  
  // Upload team
  const handleUploadTeam = async () => {
    if (!teamText) {
      toast({
        title: "Error",
        description: "Please enter your team data",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoadingUserTeam(true);
    setHasUserTeamError(false);
    
    try {
      const uploadedTeam = await uploadTeam(teamText);
      setUserTeam(uploadedTeam);
      
      if (uploadedTeam) {
        const formatted = convertTeamDataToLineupFormat(uploadedTeam);
        setUserTeamPlayers({
          midfielders: (formatted.midfielders || []).map(p => ({ ...p, name: p.name || 'Unknown' })),
          forwards: (formatted.forwards || []).map(p => ({ ...p, name: p.name || 'Unknown' })),
          defenders: (formatted.defenders || []).map(p => ({ ...p, name: p.name || 'Unknown' })),
          rucks: (formatted.rucks || []).map(p => ({ ...p, name: p.name || 'Unknown' }))
        });
        
        toast({
          title: "Success",
          description: "Your team has been uploaded with accurate data",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error uploading team:', error);
      setHasUserTeamError(true);
      
      toast({
        title: "Error",
        description: "Failed to upload team. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingUserTeam(false);
    }
  };
  
  // The lineup data is loaded automatically via React Query

  const isLoading = isLoadingLineup;

  // Show loading state only while actually loading
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Handle error or missing data - show the upload interface
  const hasNoTeamData = lineupError || !lineupData || !(lineupData as any)?.data || !(lineupData as any)?.data?.midfielders;
  
  if (hasNoTeamData) {
    return (
      <div className="container mx-auto px-3 py-6">
        <div className="mb-4">
          <Card className="bg-gray-900 border-gray-700 shadow-lg">
            <div className="p-4">
              <h1 className="text-xl font-bold mb-4 text-white">My Lineup</h1>
              
              {/* No team data message */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                      No Team Data Available
                    </h3>
                    <p className="text-yellow-700 dark:text-yellow-300 mb-3">
                      Your fantasy team lineup is not available yet. Click the button below to scrape your team data from AFL Fantasy.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Team loading button */}
              <div className="mb-4 flex justify-center">
                <Button 
                  variant="default" 
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                  onClick={refreshLineupData} 
                  disabled={scrapeMutation.isPending}
                >
                  {scrapeMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                      Scraping Team Data...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="mr-2 h-5 w-5" />
                      Load My Team from AFL Fantasy
                    </>
                  )}
                </Button>
              </div>
              
              {scrapeMutation.isError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load team data. Please make sure you're logged into AFL Fantasy and try again.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">How it works:</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Click the button above to scrape your team from AFL Fantasy</li>
                  <li>• Your lineup will be automatically loaded and displayed</li>
                  <li>• You can refresh anytime to get the latest data</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Define a helper function to add isOnBench flag (alternating players for demonstration)
  const assignBenchStatus = (players: any[], mainCount: number, benchCount: number) => {
    return players.map((p, index) => ({
      ...p,
      isOnBench: index >= mainCount
    })).slice(0, mainCount + benchCount);
  };

  // Add secondary positions to some players (for demonstration)
  const addSecondaryPositions = (player: any) => {
    const secondaryMap: {[key: string]: string[]} = {
      "MID": ["F"],  // Midfielders can play as Forwards
      "FWD": ["M"],  // Forwards can play as Midfielders
      "DEF": ["M"],  // Defenders can play as Midfielders
      "RUCK": ["F"]  // Rucks can play as Forwards
    };
    
    // Randomly assign secondary positions to some players
    if (player.id % 3 === 0) {
      return {
        ...player,
        secondaryPositions: secondaryMap[player.position] || []
      };
    }
    
    return player;
  };
  
  // Function to add team information and next opponent
  const addTeamInfo = (player: any) => {
    const teamAbbrevs = ["COL", "HAW", "GWS", "CAR", "NTH", "WCE", "ESS", "RIC", "SYD", "STK", "ADE", "MEL", "GEE", "PTA", "BRL", "WBD", "GCS"];
    const opponentAbbrevs = ["WBD", "ESS", "CAR", "HAW", "GCS", "GEE", "COL", "PTA", "NTH", "BRL", "GWS", "ADE", "WCE", "RIC", "STK", "SYD", "MEL"];
    
    const teamIndex = player.id % teamAbbrevs.length;
    const team = teamAbbrevs[teamIndex];
    const nextOpponent = opponentAbbrevs[teamIndex];
    
    return {
      ...player,
      team,
      nextOpponent,
      l3Average: (player.averagePoints || 80) + (Math.random() * 10 - 5),
      roundsPlayed: 7 + (player.id % 3)
    };
  };

  // Use the lineup data from the new API
  const midfielders = userTeamPlayers?.midfielders || [];

  const forwards = userTeamPlayers?.forwards || [];

  const defenders = userTeamPlayers?.defenders || [];

  const rucks = userTeamPlayers?.rucks || [];

  // Extract stats from API response
  const stats = (lineupData as any)?.data?.stats || {
    projectedScore: 0,
    liveScore: 0,
    teamValue: 0,
    remainingSalary: 0,
    tradesLeft: 0,
    overallRank: 0
  };
  
  // Determine which team data to use (user team or demo team)
  const activeTeamData = userTeamPlayers ? {
    midfielders: userTeamPlayers.midfielders,
    forwards: userTeamPlayers.forwards,
    defenders: userTeamPlayers.defenders,
    rucks: userTeamPlayers.rucks,
    bench: userTeamPlayers.bench
  } : {
    midfielders,
    forwards,
    defenders,
    rucks
  };
  
  return (
    <div className="container mx-auto px-3 py-6">
      <div className="mb-4">
        <Card className="bg-gray-900 border-gray-700 shadow-lg">
          <div className="p-4">
            <h1 className="text-xl font-bold mb-4 text-white">My Lineup</h1>
            
            {/* Team loading button */}
            <div className="mb-4 flex justify-end">
              <Button 
                variant="outline" 
                className="border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
                onClick={refreshLineupData} 
                disabled={scrapeMutation.isPending}
              >
                {scrapeMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Scraping Team...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Team Data
                  </>
                )}
              </Button>
              
              {hasUserTeamError && (
                <Alert variant="destructive" className="mt-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Failed to load team data. Please try again.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            {/* 3x2 Stats Grid */}
            <TeamSummaryGrid
              liveScore={stats.liveScore}
              projectedScore={stats.projectedScore}
              teamValue={stats.teamValue}
              remainingSalary={stats.remainingSalary}
              tradesLeft={stats.tradesLeft}
              overallRank={stats.overallRank}
            />
            
            {/* Lineup Display */}
            <div className="mt-6">
              <TeamSummaryNew 
                midfielders={[
                  ...activeTeamData.midfielders,
                  ...(activeTeamData.bench?.midfielders || [])
                ]}
                forwards={[
                  ...activeTeamData.forwards,
                  ...(activeTeamData.bench?.forwards || [])
                ]}
                defenders={[
                  ...activeTeamData.defenders,
                  ...(activeTeamData.bench?.defenders || [])
                ]}
                rucks={[
                  ...activeTeamData.rucks,
                  ...(activeTeamData.bench?.rucks || [])
                ]}
                utility={activeTeamData.bench?.utility || []}
                tradesAvailable={0}
                onMakeTrade={handleMakeTrade}
                onPlayerClick={openPlayerDetailModal}
                onRoleUpdate={handleRoleUpdate}
              />
            </div>
          </div>
        </Card>
      </div>
      
      {/* Player Detail Modal */}
      <PlayerDetailModal 
        player={selectedPlayer}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
      />
      
      {/* Trade Calculator Modal */}
      <TradeCalculatorModal
        open={isTradeCalculatorOpen}
        onOpenChange={setIsTradeCalculatorOpen}
        onPlayerDetailClick={openPlayerDetailModal}
        initialTeamValue={stats.teamValue}
        initialLeagueAvgValue={8500000}
        initialRound={8}
      />
    </div>
  );
}