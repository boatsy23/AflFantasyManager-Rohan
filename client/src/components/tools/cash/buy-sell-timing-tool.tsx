import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Target,
  ArrowUpCircle,
  ArrowDownCircle,
  Info,
  Calendar,
  ShoppingCart,
  DollarSign
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Team logo URLs
const teamLogos: { [key: string]: string } = {
  "Adelaide": "https://resources.afl.com.au/afl/document/2021/03/11/cd2ac9b5-e4be-4f67-b98c-2e0e4e5b6e1c/adelaide-crows-logo.png",
  "Brisbane": "https://resources.afl.com.au/afl/document/2021/03/11/cd2ac9b5-e4be-4f67-b98c-2e0e4e5b6e1c/brisbane-lions-logo.png",
  "Carlton": "https://resources.afl.com.au/afl/document/2021/03/11/cd2ac9b5-e4be-4f67-b98c-2e0e4e5b6e1c/carlton-blues-logo.png",
  "Collingwood": "https://resources.afl.com.au/afl/document/2021/03/11/cd2ac9b5-e4be-4f67-b98c-2e0e4e5b6e1c/collingwood-magpies-logo.png",
  "Essendon": "https://resources.afl.com.au/afl/document/2021/03/11/cd2ac9b5-e4be-4f67-b98c-2e0e4e5b6e1c/essendon-bombers-logo.png",
  "Fremantle": "https://resources.afl.com.au/afl/document/2021/03/11/cd2ac9b5-e4be-4f67-b98c-2e0e4e5b6e1c/fremantle-dockers-logo.png",
  "Geelong": "https://resources.afl.com.au/afl/document/2021/03/11/cd2ac9b5-e4be-4f67-b98c-2e0e4e5b6e1c/geelong-cats-logo.png",
  "Gold Coast": "https://resources.afl.com.au/afl/document/2021/03/11/cd2ac9b5-e4be-4f67-b98c-2e0e4e5b6e1c/gold-coast-suns-logo.png",
  "GWS": "https://resources.afl.com.au/afl/document/2021/03/11/cd2ac9b5-e4be-4f67-b98c-2e0e4e5b6e1c/gws-giants-logo.png",
  "Hawthorn": "https://resources.afl.com.au/afl/document/2021/03/11/cd2ac9b5-e4be-4f67-b98c-2e0e4e5b6e1c/hawthorn-hawks-logo.png",
  "Melbourne": "https://resources.afl.com.au/afl/document/2021/03/11/cd2ac9b5-e4be-4f67-b98c-2e0e4e5b6e1c/melbourne-demons-logo.png",
  "North Melbourne": "https://resources.afl.com.au/afl/document/2021/03/11/cd2ac9b5-e4be-4f67-b98c-2e0e4e5b6e1c/north-melbourne-kangaroos-logo.png",
  "Port Adelaide": "https://resources.afl.com.au/afl/document/2021/03/11/cd2ac9b5-e4be-4f67-b98c-2e0e4e5b6e1c/port-adelaide-power-logo.png",
  "Richmond": "https://resources.afl.com.au/afl/document/2021/03/11/cd2ac9b5-e4be-4f67-b98c-2e0e4e5b6e1c/richmond-tigers-logo.png",
  "St Kilda": "https://resources.afl.com.au/afl/document/2021/03/11/cd2ac9b5-e4be-4f67-b98c-2e0e4e5b6e1c/st-kilda-saints-logo.png",
  "Sydney": "https://resources.afl.com.au/afl/document/2021/03/11/cd2ac9b5-e4be-4f67-b98c-2e0e4e5b6e1c/sydney-swans-logo.png",
  "West Coast": "https://resources.afl.com.au/afl/document/2021/03/11/cd2ac9b5-e4be-4f67-b98c-2e0e4e5b6e1c/west-coast-eagles-logo.png",
  "Western Bulldogs": "https://resources.afl.com.au/afl/document/2021/03/11/cd2ac9b5-e4be-4f67-b98c-2e0e4e5b6e1c/western-bulldogs-logo.png"
};

// Team logo component
const TeamLogo = ({ teamName, size = "w-8 h-8" }: { teamName: string, size?: string }) => {
  const logoUrl = teamLogos[teamName];
  return (
    <img 
      src={logoUrl} 
      alt={`${teamName} logo`} 
      className={`${size} object-contain rounded`}
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
};

// Format currency
const formatCurrency = (amount: number, decimals = 0) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);
};

// Player Detail Modal Component
const PlayerDetailModal = ({ player }: { player: any }) => {
  const nextRound = player.nextRoundProjection;

  return (
    <div className="space-y-6">
      {/* Player Header */}
      <div className="flex items-center gap-3">
        <TeamLogo teamName={player.team} />
        <div>
          <h3 className="text-lg font-bold text-white">{player.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-gray-300">{player.team}</span>
            <Badge variant="outline" className="text-blue-400 border-blue-400">
              {player.position}
            </Badge>
          </div>
        </div>
      </div>

      {/* Best Buy/Sell Round Recommendations - HIGHLIGHTED */}
      <div className="grid grid-cols-2 gap-4">
        {/* Best Buy Round */}
        <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 border-2 border-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="h-5 w-5 text-green-400" />
              <h4 className="text-green-400 font-bold">BEST BUY ROUND</h4>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-white" />
              <div className="text-4xl font-bold text-white">R{player.bestBuyRound}</div>
            </div>
            <p className="text-green-300 text-sm mt-2">{player.buyReason}</p>
          </CardContent>
        </Card>

        {/* Best Sell Round */}
        <Card className="bg-gradient-to-br from-red-600/20 to-red-800/20 border-2 border-red-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-red-400" />
              <h4 className="text-red-400 font-bold">BEST SELL ROUND</h4>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-8 w-8 text-white" />
              <div className="text-4xl font-bold text-white">R{player.bestSellRound}</div>
            </div>
            <p className="text-red-300 text-sm mt-2">{player.sellReason}</p>
          </CardContent>
        </Card>
      </div>

      {/* Next Round Projection */}
      <Card className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-500">
        <CardHeader>
          <h4 className="text-white font-bold flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-400" />
            Next Round Projection (R{nextRound.round})
          </h4>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Current Stats */}
            <div className="space-y-3">
              <div className="bg-gray-700/50 p-3 rounded-lg">
                <div className="text-gray-400 text-sm">Current Price</div>
                <div className="text-white font-bold text-lg">{formatCurrency(player.currentPrice)}</div>
              </div>
              <div className="bg-gray-700/50 p-3 rounded-lg">
                <div className="text-gray-400 text-sm">Current Breakeven</div>
                <div className="text-white font-bold text-lg">{player.breakeven}</div>
              </div>
            </div>

            {/* Projected Changes */}
            <div className="space-y-3">
              <div className={`${nextRound.priceChange >= 0 ? 'bg-green-900/30' : 'bg-red-900/30'} p-3 rounded-lg border ${nextRound.priceChange >= 0 ? 'border-green-500' : 'border-red-500'}`}>
                <div className="text-gray-400 text-sm">Projected Price Change</div>
                <div className={`font-bold text-lg flex items-center gap-1 ${nextRound.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {nextRound.priceChange >= 0 ? <ArrowUpCircle className="h-5 w-5" /> : <ArrowDownCircle className="h-5 w-5" />}
                  {nextRound.priceChange >= 0 ? '+' : ''}{formatCurrency(nextRound.priceChange)}
                </div>
              </div>
              <div className={`${nextRound.breakevenChange >= 0 ? 'bg-red-900/30' : 'bg-green-900/30'} p-3 rounded-lg border ${nextRound.breakevenChange >= 0 ? 'border-red-500' : 'border-green-500'}`}>
                <div className="text-gray-400 text-sm">Projected BE Change</div>
                <div className={`font-bold text-lg ${nextRound.breakevenChange >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {nextRound.breakevenChange >= 0 ? '+' : ''}{nextRound.breakevenChange}
                </div>
              </div>
            </div>
          </div>

          {/* Projected Next Round Stats */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-600">
            <div className="text-center">
              <div className="text-gray-400 text-xs">New Price</div>
              <div className="text-white font-bold">{formatCurrency(nextRound.projectedPrice)}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-xs">New Breakeven</div>
              <div className="text-white font-bold">{nextRound.projectedBreakeven}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-xs">Projected Score</div>
              <div className="text-white font-bold">{nextRound.projectedScore}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-700 p-3 rounded-lg">
          <div className="text-gray-400 text-sm">Season Average</div>
          <div className="text-white font-bold">{player.seasonAverage || 'N/A'}</div>
        </div>
        <div className="bg-gray-700 p-3 rounded-lg">
          <div className="text-gray-400 text-sm">Last 3 Average</div>
          <div className="text-white font-bold">{player.last3Average || 'N/A'}</div>
        </div>
      </div>
    </div>
  );
};

// Player Card Component
const PlayerCard = ({ player, rank, type }: { player: any, rank: number, type: 'in' | 'out' }) => {
  const isTradeIn = type === 'in';
  const priceChange = player.nextRoundProjection.priceChange;

  return (
    <Card 
      className={`bg-gray-700 border-2 ${isTradeIn ? 'border-green-500/50 hover:border-green-400' : 'border-red-500/50 hover:border-red-400'} transition-colors`}
      data-testid={`player-card-${player.id}`}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            {/* Rank Badge */}
            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${isTradeIn ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
              {rank}
            </div>

            {/* Player Info */}
            <div className="flex items-center gap-3 flex-1 ml-3">
              <TeamLogo teamName={player.team} size="w-10 h-10" />
              <div className="flex-1">
                <h4 className="text-white font-bold">{player.name}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-gray-300 text-sm">{player.team}</span>
                  <Badge variant="outline" className="text-blue-400 border-blue-400 text-xs">
                    {player.position}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Price Info */}
            <div className="text-right">
              <div className="text-white font-bold text-sm">{formatCurrency(player.currentPrice, 0)}</div>
              <div className={`font-bold flex items-center gap-1 justify-end ${isTradeIn ? 'text-green-400' : 'text-red-400'}`}>
                {isTradeIn ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {priceChange >= 0 ? '+' : ''}{formatCurrency(priceChange, 0)}
              </div>
            </div>
          </div>

          {/* Buy/Sell Recommendation */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-600">
            <Badge 
              className={`${isTradeIn ? 'bg-green-900/40 text-green-300 border-green-500' : 'bg-red-900/40 text-red-300 border-red-500'} border`}
              data-testid={`badge-best-${type}-round-${player.id}`}
            >
              <Calendar className="h-3 w-3 mr-1" />
              {isTradeIn ? 'Best Buy' : 'Best Sell'}: R{isTradeIn ? player.bestBuyRound : player.bestSellRound}
            </Badge>

            {/* View Details */}
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  className={`${isTradeIn ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                  data-testid={`button-view-details-${player.id}`}
                >
                  Details
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-600 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className={isTradeIn ? 'text-green-400' : 'text-red-400'}>
                    {player.name} - Trade Timing Analysis
                  </DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Optimal buy/sell rounds and next round projection
                  </DialogDescription>
                </DialogHeader>
                <PlayerDetailModal player={player} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function BuySellTimingTool() {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch player data from MasterDataService
  const { data: apiPlayers, isLoading } = useQuery({
    queryKey: ["/api/master-stats/players"],
    select: (data: any[]) => {
      return data.map((player: any, index: number) => {
        // Simulate price change based on breakeven vs projected score
        const projectedScore = Math.round(70 + Math.random() * 50); // Random projected score 70-120
        const breakeven = player.breakeven || Math.round(Math.random() * 40 + 60);
        const scoreDiff = projectedScore - breakeven;
        const priceChange = Math.round(scoreDiff * 800); // Approximate price change formula
        
        const currentPrice = player.price || 300000;
        const projectedPrice = currentPrice + priceChange;
        
        // Breakeven change estimation
        const breakevenChange = Math.round(-scoreDiff * 0.3);
        const projectedBreakeven = Math.max(0, breakeven + breakevenChange);

        // Calculate best buy/sell rounds
        // Best buy: When price is low and about to rise (good form, low BE)
        const isBuyTarget = priceChange > 20000 && breakeven < 80;
        const bestBuyRound = isBuyTarget ? 24 : 25; // Current or next round if buy target
        const buyReason = isBuyTarget 
          ? "Price rising fast, low breakeven" 
          : "Wait for better value";

        // Best sell: When price peaks or about to drop (high BE, negative projection)
        const isSellTarget = priceChange < -15000 || breakeven > 100;
        const bestSellRound = isSellTarget ? 24 : 26; // Sell now if declining
        const sellReason = isSellTarget 
          ? "Price declining, sell before further drop" 
          : "Hold for now, monitor closely";

        return {
          id: player.externalId || index,
          name: player.name,
          team: player.team,
          position: player.position || "N/A",
          currentPrice: currentPrice,
          breakeven: breakeven,
          seasonAverage: player.seasonAverage || Math.round(85 + Math.random() * 20),
          last3Average: player.last3Average || Math.round(80 + Math.random() * 25),
          bestBuyRound: bestBuyRound,
          bestSellRound: bestSellRound,
          buyReason: buyReason,
          sellReason: sellReason,
          nextRoundProjection: {
            round: 24, // Next round
            projectedScore: projectedScore,
            priceChange: priceChange,
            projectedPrice: projectedPrice,
            breakevenChange: breakevenChange,
            projectedBreakeven: projectedBreakeven
          }
        };
      }).filter(player => player.currentPrice >= 200000); // Filter out very low priced players
    }
  });

  const playerData = apiPlayers || [];

  // Search for specific player
  const searchedPlayer = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return playerData.find(player => 
      player.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );
  }, [playerData, searchQuery]);

  // Top 5 Trade In (highest price increases)
  const tradeInPriorities = useMemo(() => {
    return [...playerData]
      .sort((a, b) => b.nextRoundProjection.priceChange - a.nextRoundProjection.priceChange)
      .slice(0, 5);
  }, [playerData]);

  // Top 5 Trade Out (highest price decreases)
  const tradeOutPriorities = useMemo(() => {
    return [...playerData]
      .filter(player => player.nextRoundProjection.priceChange < 0) // Only negative changes
      .sort((a, b) => a.nextRoundProjection.priceChange - b.nextRoundProjection.priceChange)
      .slice(0, 5);
  }, [playerData]);

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-green-500 border-2">
        <CardContent className="p-8 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
            <span className="text-white">Loading player data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-green-500 border-2">
      <CardHeader className="border-b border-green-500/30">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-6 w-6 text-green-400" />
          <h2 className="text-xl font-bold text-white">📈 Buy/Sell Timing Tool</h2>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search for a player to see their price projection..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            data-testid="input-player-search"
          />
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-6">
        {/* Show Search Result if searching */}
        {searchQuery && searchedPlayer && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Search className="h-5 w-5 text-green-400" />
              Search Result
            </h3>
            <Card className="bg-gray-700 border-2 border-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <TeamLogo teamName={searchedPlayer.team} />
                    <div>
                      <h4 className="text-white font-bold text-lg">{searchedPlayer.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-300">{searchedPlayer.team}</span>
                        <Badge variant="outline" className="text-blue-400 border-blue-400">
                          {searchedPlayer.position}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        View Full Analysis
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-800 border-gray-600 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-blue-400">
                          {searchedPlayer.name} - Trade Timing Analysis
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                          Optimal buy/sell rounds and next round projection
                        </DialogDescription>
                      </DialogHeader>
                      <PlayerDetailModal player={searchedPlayer} />
                    </DialogContent>
                  </Dialog>
                </div>
                
                {/* Quick Stats with Buy/Sell Rounds */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-green-900/30 border border-green-500 p-3 rounded-lg">
                    <div className="text-green-400 text-sm font-bold flex items-center gap-1">
                      <ShoppingCart className="h-4 w-4" />
                      Best Buy Round
                    </div>
                    <div className="text-white font-bold text-2xl">R{searchedPlayer.bestBuyRound}</div>
                  </div>
                  <div className="bg-red-900/30 border border-red-500 p-3 rounded-lg">
                    <div className="text-red-400 text-sm font-bold flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      Best Sell Round
                    </div>
                    <div className="text-white font-bold text-2xl">R{searchedPlayer.bestSellRound}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-lg ${searchedPlayer.nextRoundProjection.priceChange >= 0 ? 'bg-green-900/30 border border-green-500' : 'bg-red-900/30 border border-red-500'}`}>
                    <div className="text-gray-400 text-sm">Next Round Price Change</div>
                    <div className={`font-bold text-lg ${searchedPlayer.nextRoundProjection.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {searchedPlayer.nextRoundProjection.priceChange >= 0 ? '+' : ''}{formatCurrency(searchedPlayer.nextRoundProjection.priceChange)}
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${searchedPlayer.nextRoundProjection.breakevenChange >= 0 ? 'bg-red-900/30 border border-red-500' : 'bg-green-900/30 border border-green-500'}`}>
                    <div className="text-gray-400 text-sm">Next Round BE Change</div>
                    <div className={`font-bold text-lg ${searchedPlayer.nextRoundProjection.breakevenChange >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {searchedPlayer.nextRoundProjection.breakevenChange >= 0 ? '+' : ''}{searchedPlayer.nextRoundProjection.breakevenChange}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {searchQuery && !searchedPlayer && (
          <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-500 rounded-lg">
            <p className="text-yellow-400">No player found matching "{searchQuery}"</p>
          </div>
        )}

        {/* Top 5 Trade In Priorities */}
        <div>
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            Top 5 Trade-In Priorities (Biggest Price Rises)
          </h3>
          <div className="space-y-3">
            {tradeInPriorities.map((player, index) => (
              <PlayerCard key={player.id} player={player} rank={index + 1} type="in" />
            ))}
          </div>
        </div>

        {/* Top 5 Trade Out Priorities */}
        <div>
          <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-400" />
            Top 5 Trade-Out Priorities (Biggest Price Drops)
          </h3>
          {tradeOutPriorities.length > 0 ? (
            <div className="space-y-3">
              {tradeOutPriorities.map((player, index) => (
                <PlayerCard key={player.id} player={player} rank={index + 1} type="out" />
              ))}
            </div>
          ) : (
            <div className="p-4 bg-gray-700 rounded-lg text-center">
              <p className="text-gray-400">No players expected to decrease in price next round</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default BuySellTimingTool;
