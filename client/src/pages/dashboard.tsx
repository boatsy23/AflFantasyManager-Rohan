import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ScoreCard from "@/components/dashboard/score-card";
import PerformanceChart, { RoundData } from "@/components/dashboard/performance-chart";
import TeamStructure from "@/components/dashboard/team-structure";

import { 
  calculatePlayerTypesByPosition,
  categorizePlayersByPrice
} from "@/utils";

interface Player {
  playerName: string;
  position: string;
  priceRaw: number;
  score: number;
  actualScore?: number;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  fieldStatus?: string;
}

interface FantasyRoundData {
  round: number;
  timestamp?: string;
  roundScore: number;
  overallRank: number;
  teamValue: number;
  captainScore?: number;
  projectedScore?: number;
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
}

interface FantasyTeamData {
  teamName: string;
  totalPlayers: number;
  currentRound?: FantasyRoundData;
  historicalRounds?: FantasyRoundData[];
}


export default function Dashboard() {
  // Fetch fantasy team data from new API endpoint
  const { data: fantasyData, isLoading: isLoadingFantasy } = useQuery<FantasyTeamData>({
    queryKey: ["/api/team/fantasy-data"],
  });

  const [teamValue, setTeamValue] = useState<number>(0);
  const [playerTypeCounts, setPlayerTypeCounts] = useState<any>({
    defense: { premium: 0, midPricer: 0, rookie: 0 },
    midfield: { premium: 0, midPricer: 0, rookie: 0 },
    ruck: { premium: 0, midPricer: 0, rookie: 0 },
    forward: { premium: 0, midPricer: 0, rookie: 0 }
  });
  
  // Calculate team value and player counts from fantasy data
  useEffect(() => {
    if (fantasyData?.currentRound) {
      // Calculate team value by summing all player priceRaw values
      const allPlayers = [
        ...(fantasyData.currentRound.defenders || []),
        ...(fantasyData.currentRound.midfielders || []),
        ...(fantasyData.currentRound.rucks || []),
        ...(fantasyData.currentRound.forwards || []),
        ...(fantasyData.currentRound.bench?.defenders || []),
        ...(fantasyData.currentRound.bench?.midfielders || []),
        ...(fantasyData.currentRound.bench?.rucks || []),
        ...(fantasyData.currentRound.bench?.forwards || []),
        ...(fantasyData.currentRound.bench?.utility || [])
      ];
      
      const totalValue = allPlayers.reduce((sum, player) => sum + (player.priceRaw || 0), 0);
      setTeamValue(totalValue);
      
      // Calculate player counts by type and position
      const teamData = {
        defenders: fantasyData.currentRound.defenders,
        midfielders: fantasyData.currentRound.midfielders,
        rucks: fantasyData.currentRound.rucks,
        forwards: fantasyData.currentRound.forwards
      };
      const types = calculatePlayerTypesByPosition(teamData);
      setPlayerTypeCounts(types);
    }
  }, [fantasyData]);

  const isLoading = isLoadingFantasy;

  if (isLoading || !fantasyData || !fantasyData.currentRound) {
    return <div>Loading dashboard...</div>;
  }

  // Get captain's score from fantasy data
  const getCaptainScore = (): number => {
    const allPlayers = [
      ...(fantasyData.currentRound?.defenders || []),
      ...(fantasyData.currentRound?.midfielders || []),
      ...(fantasyData.currentRound?.rucks || []),
      ...(fantasyData.currentRound?.forwards || [])
    ];
    
    // Captain is identified by having the highest score (already doubled in data)
    const sortedByScore = [...allPlayers].sort((a, b) => (b.score || 0) - (a.score || 0));
    return sortedByScore[0]?.score || 0;
  };

  // Get current round data from fantasy data
  const currentRound = fantasyData.currentRound?.round || 0;
  
  // Find current and previous round from historical data (not round 1, but most recent previous)
  const currentHistorical = fantasyData.historicalRounds?.find((r: any) => r.round === currentRound);
  const previousHistorical = fantasyData.historicalRounds?.find((r: any) => r.round === currentRound - 1);
  
  // Get score and rank from fantasy data
  const currentScore = fantasyData.currentRound?.roundScore || 0;
  const prevScore = previousHistorical?.roundScore || 0;
  const scoreChange = prevScore > 0 ? currentScore - prevScore : 0;
  
  const currentRank = fantasyData.currentRound?.overallRank || 0;
  const prevRank = previousHistorical?.overallRank || 0;
  const rankChange = prevRank > 0 ? prevRank - currentRank : 0;
  
  // Calculate team value change from actual data
  const currentValue = teamValue;
  const previousValue = previousHistorical?.teamValue || teamValue;
  const valueChange = previousValue > 0 ? currentValue - previousValue : 0;
  
  // Calculate captain score change
  const currentCaptainScore = getCaptainScore();
  const prevCaptainScore = previousHistorical?.captainScore || 0;
  const captainChange = prevCaptainScore > 0 ? currentCaptainScore - prevCaptainScore : 0;
  
  // Generate data for all 24 rounds using historicalRounds data
  const performanceData: RoundData[] = Array.from({ length: 24 }, (_, index) => {
    const round = index + 1;
    
    // Check if we have data from historicalRounds for this round
    const historicalRound = fantasyData.historicalRounds?.find(r => r.round === round);
    
    if (historicalRound) {
      // Use data from historicalRounds
      return {
        round,
        actualScore: historicalRound.roundScore,
        projectedScore: historicalRound.projectedScore || historicalRound.roundScore,
        rank: historicalRound.overallRank,
        teamValue: historicalRound.teamValue
      };
    }
    
    // For rounds without data (future rounds), use 0
    return {
      round,
      actualScore: 0,
      projectedScore: 0,
      rank: 0,
      teamValue: 0
    };
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Team Value - calculated from actual player prices */}
        <ScoreCard 
          title="Team Value"
          value={`$${(teamValue / 1000000).toFixed(1)}M`}
          change={valueChange > 0 ? 
            `$${(valueChange/1000000).toFixed(1)}M from last round` : 
            valueChange < 0 ?
            `-$${Math.abs(valueChange/1000000).toFixed(1)}M from last round` :
            'No change from last round'}
          icon="trend-up"
          isPositive={valueChange >= 0}
          borderColor="border-purple-500"
        />
        
        {/* Team Score - from roundScore field */}
        <ScoreCard 
          title="Team Score"
          value={currentScore.toString()}
          change={scoreChange !== 0 ? `${scoreChange > 0 ? '+' : ''}${scoreChange} from last round` : 'No change'}
          icon="chart"
          isPositive={scoreChange >= 0}
          borderColor="border-blue-500"
        />
      
        {/* Overall Rank - from overallRank field */}
        <ScoreCard 
          title="Overall Rank"
          value={(currentRank || 0).toLocaleString()}
          change={rankChange !== 0 ? `${rankChange > 0 ? '↑' : '↓'} ${Math.abs(rankChange).toLocaleString()} places` : 'No change'}
          icon="arrow-up"
          isPositive={rankChange >= 0}
          borderColor="border-green-500"
        />
        
        {/* Captain Score - from captain with isCaptain flag */}
        <ScoreCard 
          title="Captain Score"
          value={currentCaptainScore.toString()}
          change={captainChange !== 0 ? `${captainChange > 0 ? '+' : ''}${captainChange} from last round` : 'No change'}
          icon="award"
          isPositive={captainChange >= 0}
          borderColor="border-orange-500"
        />
      </div>

      {/* Performance Chart with all 24 rounds */}
      <div className="mb-4">
        <PerformanceChart data={performanceData} />
      </div>

      {/* Team Structure based on actual player counts by price bracket */}
      <TeamStructure 
        defense={{
          premium: { count: playerTypeCounts.defense.premium, label: "Premiums" },
          midPricer: { count: playerTypeCounts.defense.midPricer, label: "Mid-pricers" },
          rookie: { count: playerTypeCounts.defense.rookie, label: "Rookies" }
        }}
        midfield={{
          premium: { count: playerTypeCounts.midfield.premium, label: "Premiums" },
          midPricer: { count: playerTypeCounts.midfield.midPricer, label: "Mid-pricers" },
          rookie: { count: playerTypeCounts.midfield.rookie, label: "Rookies" }
        }}
        ruck={{
          premium: { count: playerTypeCounts.ruck.premium, label: "Premiums" },
          midPricer: { count: playerTypeCounts.ruck.midPricer, label: "Mid-pricers" },
          rookie: { count: playerTypeCounts.ruck.rookie, label: "Rookies" }
        }}
        forward={{
          premium: { count: playerTypeCounts.forward.premium, label: "Premiums" },
          midPricer: { count: playerTypeCounts.forward.midPricer, label: "Mid-pricers" },
          rookie: { count: playerTypeCounts.forward.rookie, label: "Rookies" }
        }}
        teamValue={`$${(teamValue / 1000000).toFixed(1)}M`}
        fantasyData={fantasyData}
      />
    </div>
  );
}
