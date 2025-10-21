// Team Guernsey mapping utility
export const getTeamGuernsey = (teamName: string): string => {
  const guernseyMap: { [key: string]: string } = {
    // Full team names
    'Adelaide': '/guernseys/adelaide.png',
    'Brisbane': '/guernseys/brisbane.png',
    'Carlton': '/guernseys/carlton.png',
    'Collingwood': '/guernseys/collingwood.png',
    'Essendon': '/guernseys/essendon.png',
    'Fremantle': '/guernseys/fremantle.png',
    'Geelong': '/guernseys/geelong.png',
    'Gold Coast': '/guernseys/gold_coast.png',
    'GWS': '/guernseys/gws.png',
    'Hawthorn': '/guernseys/hawthorn.png',
    'Melbourne': '/guernseys/melbourne.png',
    'North Melbourne': '/guernseys/north_melbourne.png',
    'Port Adelaide': '/guernseys/port_adelaide.png',
    'Richmond': '/guernseys/richmond.png',
    'St Kilda': '/guernseys/st_kilda.png',
    'Sydney': '/guernseys/sydney.png',
    'West Coast': '/guernseys/west_coast.png',
    'Western Bulldogs': '/guernseys/western_bulldogs.png',
    // Team abbreviations
    'ADE': '/guernseys/adelaide.png',
    'BRI': '/guernseys/brisbane.png',
    'CAR': '/guernseys/carlton.png',
    'COL': '/guernseys/collingwood.png',
    'ESS': '/guernseys/essendon.png',
    'FRE': '/guernseys/fremantle.png',
    'GEE': '/guernseys/geelong.png',
    'GCS': '/guernseys/gold_coast.png',
    'HAW': '/guernseys/hawthorn.png',
    'MEL': '/guernseys/melbourne.png',
    'NTH': '/guernseys/north_melbourne.png',
    'PA': '/guernseys/port_adelaide.png',
    'RIC': '/guernseys/richmond.png',
    'STK': '/guernseys/st_kilda.png',
    'SYD': '/guernseys/sydney.png',
    'WCE': '/guernseys/west_coast.png',
    'WBD': '/guernseys/western_bulldogs.png'
  };
  
  return guernseyMap[teamName] || '';
};

// AFL Team Colors mapping
export const getTeamColors = (teamName: string) => {
  const teamColors: { [key: string]: { primary: string, secondary: string, accent: string } } = {
    'Adelaide': { primary: '#003366', secondary: '#FF6600', accent: '#FFCC00' },
    'Brisbane': { primary: '#7D2C3F', secondary: '#FFB41F', accent: '#003366' },
    'Carlton': { primary: '#003366', secondary: '#FFFFFF', accent: '#C0C0C0' },
    'Collingwood': { primary: '#000000', secondary: '#FFFFFF', accent: '#C0C0C0' },
    'Essendon': { primary: '#CC0000', secondary: '#000000', accent: '#FFFFFF' },
    'Fremantle': { primary: '#663399', secondary: '#FFFFFF', accent: '#00B04F' },
    'Geelong': { primary: '#003366', secondary: '#FFFFFF', accent: '#0066CC' },
    'Gold Coast': { primary: '#FFD700', secondary: '#CC0000', accent: '#003366' },
    'GWS': { primary: '#FFA500', secondary: '#808080', accent: '#FFFFFF' },
    'Hawthorn': { primary: '#8B4513', secondary: '#FFD700', accent: '#000000' },
    'Melbourne': { primary: '#CC0000', secondary: '#003366', accent: '#FFFFFF' },
    'North Melbourne': { primary: '#003366', secondary: '#FFFFFF', accent: '#0066CC' },
    'Port Adelaide': { primary: '#008B8B', secondary: '#000000', accent: '#FFFFFF' },
    'Richmond': { primary: '#FFD700', secondary: '#000000', accent: '#FFFFFF' },
    'St Kilda': { primary: '#CC0000', secondary: '#000000', accent: '#FFFFFF' },
    'Sydney': { primary: '#CC0000', secondary: '#FFFFFF', accent: '#000000' },
    'West Coast': { primary: '#003366', secondary: '#FFD700', accent: '#FFFFFF' },
    'Western Bulldogs': { primary: '#CC0000', secondary: '#003366', accent: '#FFFFFF' }
  };
  
  return teamColors[teamName] || { primary: '#1f2937', secondary: '#374151', accent: '#9ca3af' };
};

// Team abbreviation helper
export const getTeamAbbreviation = (teamName: string): string => {
  const abbreviations: { [key: string]: string } = {
    'Adelaide': 'ADE',
    'Brisbane': 'BRI',
    'Carlton': 'CAR',
    'Collingwood': 'COL',
    'Essendon': 'ESS',
    'Fremantle': 'FRE',
    'Geelong': 'GEE',
    'Gold Coast': 'GCS',
    'GWS': 'GWS',
    'Hawthorn': 'HAW',
    'Melbourne': 'MEL',
    'North Melbourne': 'NTH',
    'Port Adelaide': 'PA',
    'Richmond': 'RIC',
    'St Kilda': 'STK',
    'Sydney': 'SYD',
    'West Coast': 'WCE',
    'Western Bulldogs': 'WBD'
  };
  
  return abbreviations[teamName] || teamName?.substring(0, 3).toUpperCase() || '';
};