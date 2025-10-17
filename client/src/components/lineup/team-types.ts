// Lineup-specific player type that combines database relation with player stats
export type LineupPlayer = {
  id: number;
  name: string;
  position: string;
  team?: string;
  isCaptain?: boolean;
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

// Re-export the database TeamPlayer for compatibility
export type { TeamPlayer } from "@shared/schema";