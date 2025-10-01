export interface PlayerStats {
  speed: number;
  shooting: number;
  passing: number;
  defense: number;
  goalkeeping: number;
}

export interface PlayerData {
  id: string;
  name: string;
  position: string;
  overall: number;
  country: string;
  league: string;
  team: string;
  imageUrl: string;
  rarity: string;
  divisions: string[];
  statsByDivision: {
    first: PlayerStats;
    second: PlayerStats;
    third: PlayerStats;
  };
}

export const REAL_PLAYERS_DATA: PlayerData[] = [
  {
    id: '1',
    name: 'Lionel Messi',
    position: 'forward',
    overall: 91,
    country: 'Argentina',
    league: 'MLS',
    team: 'Inter Miami',
    imageUrl: 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?auto=compress&cs=tinysrgb&w=400',
    rarity: 'legendary',
    divisions: ['First', 'Second', 'Third'],
    statsByDivision: {
      first: { speed: 85, shooting: 92, passing: 91, defense: 38, goalkeeping: 6 },
      second: { speed: 80, shooting: 88, passing: 88, defense: 35, goalkeeping: 6 },
      third: { speed: 75, shooting: 84, passing: 85, defense: 32, goalkeeping: 6 }
    }
  },
  {
    id: '2',
    name: 'Cristiano Ronaldo',
    position: 'forward',
    overall: 87,
    country: 'Portugal',
    league: 'Saudi Pro League',
    team: 'Al Nassr',
    imageUrl: 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?auto=compress&cs=tinysrgb&w=400',
    rarity: 'legendary',
    divisions: ['First', 'Second', 'Third'],
    statsByDivision: {
      first: { speed: 82, shooting: 93, passing: 82, defense: 35, goalkeeping: 7 },
      second: { speed: 78, shooting: 90, passing: 80, defense: 33, goalkeeping: 7 },
      third: { speed: 74, shooting: 86, passing: 77, defense: 30, goalkeeping: 7 }
    }
  },
  {
    id: '3',
    name: 'Kylian Mbappé',
    position: 'forward',
    overall: 91,
    country: 'France',
    league: 'La Liga',
    team: 'Real Madrid',
    imageUrl: 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?auto=compress&cs=tinysrgb&w=400',
    rarity: 'legendary',
    divisions: ['First', 'Second'],
    statsByDivision: {
      first: { speed: 97, shooting: 89, passing: 80, defense: 36, goalkeeping: 5 },
      second: { speed: 94, shooting: 85, passing: 77, defense: 33, goalkeeping: 5 },
      third: { speed: 90, shooting: 80, passing: 74, defense: 30, goalkeeping: 5 }
    }
  },
  {
    id: '4',
    name: 'Erling Haaland',
    position: 'forward',
    overall: 91,
    country: 'Norway',
    league: 'Premier League',
    team: 'Manchester City',
    imageUrl: 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?auto=compress&cs=tinysrgb&w=400',
    rarity: 'epic',
    divisions: ['First', 'Second'],
    statsByDivision: {
      first: { speed: 89, shooting: 91, passing: 65, defense: 45, goalkeeping: 5 },
      second: { speed: 86, shooting: 88, passing: 62, defense: 42, goalkeeping: 5 },
      third: { speed: 82, shooting: 84, passing: 59, defense: 39, goalkeeping: 5 }
    }
  },
  {
    id: '5',
    name: 'Kevin De Bruyne',
    position: 'midfielder',
    overall: 91,
    country: 'Belgium',
    league: 'Premier League',
    team: 'Manchester City',
    imageUrl: 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?auto=compress&cs=tinysrgb&w=400',
    rarity: 'epic',
    divisions: ['First', 'Second', 'Third'],
    statsByDivision: {
      first: { speed: 76, shooting: 86, passing: 93, defense: 64, goalkeeping: 7 },
      second: { speed: 73, shooting: 83, passing: 90, defense: 61, goalkeeping: 7 },
      third: { speed: 70, shooting: 79, passing: 86, defense: 58, goalkeeping: 7 }
    }
  }
];

export class RealPlayersService {
  static getPlayersByDivision(division: string): PlayerData[] {
    const divisionMap: { [key: string]: string } = {
      'primera': 'First',
      'segunda': 'Second',
      'tercera': 'Third'
    };

    const targetDivision = divisionMap[division.toLowerCase()] || division;
    return REAL_PLAYERS_DATA.filter(player => player.divisions.includes(targetDivision));
  }

  static getPlayerById(id: string): PlayerData | undefined {
    return REAL_PLAYERS_DATA.find(player => player.id === id);
  }

  static getAllPlayers(): PlayerData[] {
    return REAL_PLAYERS_DATA;
  }
}

export const MOCK_PLAYERS = REAL_PLAYERS_DATA;
