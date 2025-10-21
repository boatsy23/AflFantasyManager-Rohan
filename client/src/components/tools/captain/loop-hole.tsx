import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Target, Repeat } from 'lucide-react';

type Player = {
  name: string;
  team: string;
  position: string;
  projected_score: number;
  price: number;
  break_even: number;
  average_points: number;
  selection_status?: string; // selected, emergency, red_dot
  fixture_day?: string;
  news?: string;
};

export function LoopHole() {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Get player data with projections, fixtures, and news
  const { data: allPlayers, isLoading, error } = useQuery({
    queryKey: ['/api/master-stats/players'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const players: Player[] = allPlayers ? 
    allPlayers.map((p: any) => ({
      name: p.name,
      team: p.team,
      position: p.position,
      projected_score: p.projected_score || 0,
      price: p.price || 0,
      break_even: p.break_even || 0,
      average_points: p.average_points || 0,
      selection_status: p.selection_status || 'available', // Get from team data
      fixture_day: p.fixture_day || 'TBD', // Get from fixture data
      news: p.news || 'No recent news'
    })).filter((p: Player) => p.projected_score > 0) : [];

  // Get potential captain/VC candidates (high projected scores)
  const captainCandidates = players
    .sort((a, b) => b.projected_score - a.projected_score)
    .slice(0, 10);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'selected': return 'bg-green-100 text-green-800';
      case 'emergency': return 'bg-yellow-100 text-yellow-800';
      case 'red_dot': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading loop hole data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Error loading loop hole data</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Loop Hole Strategy</h2>
        <p className="text-gray-600 mt-2">Find optimal captain looping opportunities</p>
      </div>

      <Tabs defaultValue="red-dot" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="red-dot" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Red Dot Loop
          </TabsTrigger>
          <TabsTrigger value="vc-loop" className="flex items-center gap-2">
            <Repeat className="h-4 w-4" />
            VC Loop
          </TabsTrigger>
        </TabsList>

        <TabsContent value="red-dot" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Red Dot Loop Strategy</CardTitle>
              <p className="text-sm text-gray-600">
                Use players with red dot status (late withdrawals) to loop captain points
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {captainCandidates.slice(0, 5).map((player) => (
                  <div key={player.name} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{player.name}</span>
                        <Badge className={getStatusColor(player.selection_status || 'selected')}>
                          {player.selection_status || 'Selected'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 grid grid-cols-2 gap-4">
                        <span>{player.team} ({player.position})</span>
                        <span>Plays: {player.fixture_day}</span>
                        <span>Proj: {player.projected_score}</span>
                        <span>BE: {player.break_even}</span>
                      </div>
                      {player.news && (
                        <div className="text-xs text-blue-600 mt-1 truncate">
                          News: {player.news}
                        </div>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedPlayer(player)}
                    >
                      Select
                    </Button>
                  </div>
                ))}
              </div>
              
              {selectedPlayer && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-semibold text-blue-800">Selected for Red Dot Loop:</h4>
                  <p className="text-blue-700 mt-1">
                    {selectedPlayer.name} - Monitor for red dot status changes before lockout
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vc-loop" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vice Captain Loop Strategy</CardTitle>
              <p className="text-sm text-gray-600">
                Optimize captain/vice-captain combinations for maximum points
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {/* Generate VC Loop combinations */}
                {captainCandidates.slice(0, 3).map((captain) => (
                  <div key={captain.name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-semibold text-lg">
                        Captain: {captain.name} ({captain.projected_score})
                      </div>
                      <Badge variant="outline">{captain.fixture_day}</Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-gray-700">Best VC Options:</h5>
                      {captainCandidates
                        .filter(vc => vc.name !== captain.name && vc.fixture_day !== captain.fixture_day)
                        .slice(0, 2)
                        .map((vc) => (
                          <div key={vc.name} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                            <span>
                              VC: {vc.name} ({vc.projected_score}) - {vc.fixture_day}
                            </span>
                            <span className="font-semibold text-green-600">
                              Expected: {Math.round((captain.projected_score * 2 + vc.projected_score) / 2)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}