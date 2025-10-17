import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SortableTable } from '../sortable-table';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type CaptainPlayer = {
  name: string;
  team: string;
  position: string;
  projected_score: number;
  price: number;
  break_even: number;
  average_points: number;
};

export function CaptainScorePredictor() {
  // Get top 5 players with highest projected scores for captain consideration
  const { data: allPlayers, isLoading, error } = useQuery({
    queryKey: ['/api/master-stats/players'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const players = allPlayers ? 
    allPlayers
      .filter((p: any) => p.projected_score && p.projected_score > 0)
      .sort((a: any, b: any) => (b.projected_score || 0) - (a.projected_score || 0))
      .slice(0, 5)
      .map((p: any) => ({
        name: p.name,
        team: p.team,
        position: p.position,
        projected_score: p.projected_score || 0,
        price: p.price || 0,
        break_even: p.break_even || 0,
        average_points: p.average_points || 0
      })) : [];

  const columns = [
    {
      key: 'name',
      label: 'Player',
      sortable: true,
      render: (value: string) => (
        <div className="font-medium">{value}</div>
      ),
    },
    {
      key: 'team',
      label: 'Team',
      sortable: true,
    },
    {
      key: 'position',
      label: 'Position',
      sortable: true,
      render: (value: string) => (
        <div className="text-center">{value}</div>
      ),
    },
    {
      key: 'projected_score',
      label: 'Proj. Score',
      sortable: true,
      render: (value: number) => (
        <div className="text-center font-bold text-green-600">{value}</div>
      ),
    },
    {
      key: 'average_points',
      label: 'Season Avg',
      sortable: true,
      render: (value: number) => (
        <div className="text-center">{Math.round(value)}</div>
      ),
    },
    {
      key: 'break_even',
      label: 'Breakeven',
      sortable: true,
      render: (value: number) => (
        <div className="text-center">{value}</div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (value: number) => (
        <div className="text-center">${Math.round(value / 1000)}k</div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600 mb-2" />
        <p className="text-sm text-muted-foreground">Loading captain data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-sm text-red-500 mb-4">Error loading captain data</p>
        <Button onClick={() => window.location.reload()} variant="outline" size="sm">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="rounded-md border px-4 py-3 bg-amber-50">
        <h3 className="font-medium text-sm">How to use this tool:</h3>
        <p className="text-sm text-muted-foreground mt-1">
          This tool shows the top 5 players with highest projected scores for the upcoming round. 
          These projections factor in form, fixtures, and opponent difficulty to identify premium captain options.
        </p>
      </div>
      
      <div className="rounded-md border">
        <SortableTable
          data={players}
          columns={columns}
          emptyMessage="No player data available"
        />
      </div>
    </div>
  );
}