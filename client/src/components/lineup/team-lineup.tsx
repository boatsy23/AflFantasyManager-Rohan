import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatScore, getPositionColor } from "@/lib/utils";
import { Player as BasePlayer } from "../player-stats/player-table";
import { getTeamGuernsey } from "@/utils/team-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Star, XCircle } from "lucide-react";

// Extend the Player type to include isCaptain, isViceCaptain and secondary positions
type Player = BasePlayer & {
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  secondaryPositions?: string[];
  isOnBench?: boolean;
  nextOpponent?: string;
}

interface TeamLineupProps {
  midfielders: Player[];
  forwards: Player[];
  defenders: Player[];
  rucks: Player[];
  onPlayerClick?: (player: Player) => void;
  onRoleUpdate?: (playerName: string, role: 'captain' | 'viceCaptain' | 'none') => void;
}

export default function TeamLineup({ 
  midfielders, 
  forwards, 
  defenders, 
  rucks, 
  onPlayerClick,
  onRoleUpdate
}: TeamLineupProps) {
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedPlayerForRole, setSelectedPlayerForRole] = useState<Player | null>(null);

  // Function to create team logo badge
  const renderTeamLogo = (team: string) => {
    const guernseyUrl = getTeamGuernsey(team);
    return (
      <div className="h-6 w-6 rounded-full overflow-hidden border border-gray-600 bg-gray-700">
        {guernseyUrl ? (
          <img
            src={guernseyUrl}
            alt={`${team} guernsey`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
            {team.substring(0, 2).toUpperCase()}
          </div>
        )}
      </div>
    );
  };

  const handlePlayerNameClick = (player: Player, e: React.MouseEvent) => {
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

  // Function to render a player card with better mobile support
  const renderPlayerCard = (player: Player) => (
    <Card 
      className={`h-full overflow-hidden bg-gray-800 border-gray-600 ${player.isOnBench ? 'bg-gray-700' : ''}`} 
      key={player.id}
      onClick={() => onPlayerClick && onPlayerClick(player)}
    >
      <div className={`h-1 w-full ${getPositionColor(player.position)}`}></div>
      <CardContent className="p-3 pt-2 sm:p-4 sm:pt-3">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          {renderTeamLogo(player.team || '')}
          <div className="truncate flex-1">
            <div 
              className="text-xs sm:text-sm font-semibold truncate text-white cursor-pointer hover:text-blue-400 transition-colors"
              onClick={(e) => handlePlayerNameClick(player, e)}
              data-testid={`player-name-${player.id}`}
            >
              {player.name}
              {player.isOnBench && <span className="ml-1 text-xs text-gray-400">(Bench)</span>}
            </div>
            <div className="text-xs text-gray-300 flex items-center flex-wrap gap-1">
              <span className={`inline-block px-1 rounded text-white ${getPositionColor(player.position)}`}>
                {player.position.charAt(0)}
              </span>
              {player.secondaryPositions?.map((pos, idx) => (
                <span key={idx} className="px-1 rounded bg-gray-600 text-gray-200">{pos}</span>
              ))}
              {player.isCaptain && (
                <span className="px-1 py-0.5 text-xs bg-yellow-500 text-white rounded-sm font-bold" data-testid={`captain-badge-${player.id}`}>C</span>
              )}
              {player.isViceCaptain && (
                <span className="px-1 py-0.5 text-xs bg-blue-500 text-white rounded-sm font-bold" data-testid={`vice-captain-badge-${player.id}`}>VC</span>
              )}
              {player.secondaryPositions && player.secondaryPositions.length > 0 && (
                <span className="px-1 text-xs bg-gray-600 text-gray-200 rounded">DPP</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-x-2 sm:gap-x-4 gap-y-1 sm:gap-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Price:</span> 
            <span className="font-medium text-white">{formatCurrency(player.price)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Avg:</span> 
            <span className="font-medium text-white">{player.averagePoints?.toFixed(1) || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">BE:</span> 
            <span className={`font-medium ${player.breakEven < 0 ? 'text-red-400' : 'text-white'}`}>{player.breakEven}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Last:</span> 
            <span className="font-medium text-white">{formatScore(player.lastScore)}</span>
          </div>
          {player.nextOpponent && (
            <div className="flex justify-between">
              <span className="text-gray-400">Next:</span> 
              <span className="font-medium text-white">{player.nextOpponent}</span>
            </div>
          )}
          {player.l3Average && (
            <div className="flex justify-between">
              <span className="text-gray-400">L3 Avg:</span> 
              <span className="font-medium text-white">{player.l3Average.toFixed(1)}</span>
            </div>
          )}
          {player.selectionPercentage && (
            <div className="flex justify-between">
              <span className="text-gray-400">Sel %:</span> 
              <span className="font-medium text-white">{player.selectionPercentage.toFixed(1)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Combine all players for showing the captain and checking if lineup is empty
  const allPlayers = [...midfielders, ...forwards, ...defenders, ...rucks];
  
  // Find the captain
  const captain = allPlayers.find(p => p.isCaptain);
  
  // Render empty state
  if (allPlayers.length === 0) {
    return (
      <Card className="text-center p-8 bg-gray-800 border-gray-600">
        <CardContent>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2 text-white">No Players in Lineup</h3>
            <p className="text-gray-400">Your team is empty. Start adding players to your lineup.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gray-800 border-gray-600">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-white">Your Lineup</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Tabs defaultValue="mid">
            <TabsList className="grid grid-cols-4 w-full bg-gray-700 border-gray-600">
              <TabsTrigger value="mid" className="text-gray-300 data-[state=active]:bg-gray-600 data-[state=active]:text-white">MID ({midfielders.length})</TabsTrigger>
              <TabsTrigger value="fwd" className="text-gray-300 data-[state=active]:bg-gray-600 data-[state=active]:text-white">FWD ({forwards.length})</TabsTrigger>
              <TabsTrigger value="def" className="text-gray-300 data-[state=active]:bg-gray-600 data-[state=active]:text-white">DEF ({defenders.length})</TabsTrigger>
              <TabsTrigger value="ruck" className="text-gray-300 data-[state=active]:bg-gray-600 data-[state=active]:text-white">RUCK ({rucks.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="mid" className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {midfielders.map(player => renderPlayerCard(player))}
              </div>
            </TabsContent>
            
            <TabsContent value="fwd" className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {forwards.map(player => renderPlayerCard(player))}
              </div>
            </TabsContent>
            
            <TabsContent value="def" className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {defenders.map(player => renderPlayerCard(player))}
              </div>
            </TabsContent>
            
            <TabsContent value="ruck" className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rucks.map(player => renderPlayerCard(player))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
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
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 flex items-center justify-center gap-2"
              data-testid="button-remove-role"
            >
              <XCircle className="h-5 w-5" />
              Remove Role
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
