// AFL Team Constants and Mappings

export const AFL_TEAMS = {
  ADELAIDE: 'Adelaide',
  BRISBANE: 'Brisbane',
  CARLTON: 'Carlton',
  COLLINGWOOD: 'Collingwood',
  ESSENDON: 'Essendon',
  FREMANTLE: 'Fremantle',
  GEELONG: 'Geelong',
  GOLD_COAST: 'Gold Coast',
  GWS: 'GWS',
  HAWTHORN: 'Hawthorn',
  MELBOURNE: 'Melbourne',
  NORTH_MELBOURNE: 'North Melbourne',
  PORT_ADELAIDE: 'Port Adelaide',
  RICHMOND: 'Richmond',
  ST_KILDA: 'St Kilda',
  SYDNEY: 'Sydney',
  WEST_COAST: 'West Coast',
  WESTERN_BULLDOGS: 'Western Bulldogs'
} as const;

export const TEAM_ABBREVIATIONS = {
  ADE: 'Adelaide',
  BRI: 'Brisbane', 
  BRL: 'Brisbane',
  CAR: 'Carlton',
  COL: 'Collingwood',
  ESS: 'Essendon',
  FRE: 'Fremantle',
  GEE: 'Geelong',
  GCS: 'Gold Coast',
  GWS: 'GWS',
  HAW: 'Hawthorn',
  MEL: 'Melbourne',
  NTH: 'North Melbourne',
  NM: 'North Melbourne',
  PA: 'Port Adelaide',
  RIC: 'Richmond',
  STK: 'St Kilda',
  SYD: 'Sydney',
  WCE: 'West Coast',
  WBD: 'Western Bulldogs'
} as const;

export const TEAM_COLORS = {
  Adelaide: '#002B5C',
  Brisbane: '#6F263D',
  Carlton: '#003F7F',
  Collingwood: '#000000',
  Essendon: '#C21807',
  Fremantle: '#663399',
  Geelong: '#003F7F',
  'Gold Coast': '#FFD100',
  GWS: '#FF6600',
  Hawthorn: '#5C4B07',
  Melbourne: '#CC2031',
  'North Melbourne': '#003F7F',
  'Port Adelaide': '#00B4CC',
  Richmond: '#FFD100',
  'St Kilda': '#ED1C24',
  Sydney: '#ED1C24',
  'West Coast': '#003F7F',
  'Western Bulldogs': '#015AAA'
} as const;

// Utility functions for team names
export const normalizeTeam = (teamName: string): string => {
  const normalized = TEAM_ABBREVIATIONS[teamName as keyof typeof TEAM_ABBREVIATIONS];
  return normalized || teamName;
};

export const displayTeamName = (teamName: string): string => {
  return normalizeTeam(teamName);
};