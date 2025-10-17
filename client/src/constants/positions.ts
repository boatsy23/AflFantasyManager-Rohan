// AFL Fantasy Position Constants

export const POSITIONS = {
  DEFENDER: 'DEF',
  MIDFIELDER: 'MID', 
  FORWARD: 'FWD',
  RUCK: 'RUC'
} as const;

export const POSITION_LABELS = {
  [POSITIONS.DEFENDER]: 'Defender',
  [POSITIONS.MIDFIELDER]: 'Midfielder',
  [POSITIONS.FORWARD]: 'Forward',
  [POSITIONS.RUCK]: 'Ruck'
} as const;

export const POSITION_COLORS = {
  [POSITIONS.DEFENDER]: '#3B82F6', // Blue
  [POSITIONS.MIDFIELDER]: '#10B981', // Green
  [POSITIONS.FORWARD]: '#F59E0B', // Yellow
  [POSITIONS.RUCK]: '#EF4444'     // Red
} as const;

export const LINEUP_STRUCTURE = {
  DEFENDERS: 6,
  MIDFIELDERS: 8,
  FORWARDS: 6,
  RUCKS: 2,
  BENCH: 4,
  TOTAL: 22
} as const;

// Utility function for getting primary position
export const getPrimaryPosition = (position: string): string => {
  const positionMap: { [key: string]: string } = {
    'DEF': POSITIONS.DEFENDER,
    'MID': POSITIONS.MIDFIELDER,
    'FWD': POSITIONS.FORWARD,
    'RUC': POSITIONS.RUCK,
    'DEFENDER': POSITIONS.DEFENDER,
    'MIDFIELDER': POSITIONS.MIDFIELDER,
    'FORWARD': POSITIONS.FORWARD,
    'RUCK': POSITIONS.RUCK
  };
  return positionMap[position.toUpperCase()] || POSITIONS.MIDFIELDER;
};