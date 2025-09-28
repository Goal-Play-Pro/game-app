/**
 * Datos reales de jugadores con estadísticas específicas por división
 * Sistema de progresión: jugadores empiezan con stats bajos y suben con farming/gameplay
 */

export interface PlayerData {
  name: string;
  position: string;
  divisions: string[];
  rarity: string;
  statsByDivision: {
    first: PlayerStatsData;
    second: PlayerStatsData;
    third: PlayerStatsData;
  };
  imageUrl: string;
}

export interface PlayerStatsData {
  speed: number;
  shooting: number;
  passing: number;
  defense: number;
  goalkeeping: number;
}

/**
 * Base de datos completa de jugadores reales
 */
export const REAL_PLAYERS_DATA: PlayerData[] = [
  {
    name: "Achrif Kini",
    position: "defender",
    divisions: ["First", "Second", "Third"],
    rarity: "epic",
    statsByDivision: {
      first: { speed: 16, shooting: 11, passing: 23, defense: 40, goalkeeping: 5 },    // Total: 95
      second: { speed: 13, shooting: 9, passing: 18, defense: 32, goalkeeping: 4 },   // Total: 76
      third: { speed: 10, shooting: 6, passing: 14, defense: 24, goalkeeping: 3 }     // Total: 57
    },
    imageUrl: "https://goalplay-assets.fra1.cdn.digitaloceanspaces.com/characters/achrif-kini.webp"
  },
  {
    name: "Alphon Vadis",
    position: "defender",
    divisions: ["First", "Second", "Third"],
    rarity: "rare",
    statsByDivision: {
      first: { speed: 16, shooting: 11, passing: 23, defense: 40, goalkeeping: 5 },    // Total: 95
      second: { speed: 13, shooting: 9, passing: 18, defense: 32, goalkeeping: 4 },   // Total: 76
      third: { speed: 10, shooting: 6, passing: 14, defense: 24, goalkeeping: 3 }     // Total: 57
    },
    imageUrl: "https://goalplay-assets.fra1.cdn.digitaloceanspaces.com/characters/alphon-vadis.webp"
  },
  {
    name: "Vini",
    position: "forward",
    divisions: ["First", "Second", "Third"],
    rarity: "epic",
    statsByDivision: {
      first: { speed: 28, shooting: 34, passing: 17, defense: 11, goalkeeping: 5 },    // Total: 95
      second: { speed: 23, shooting: 27, passing: 14, defense: 8, goalkeeping: 4 },   // Total: 76
      third: { speed: 17, shooting: 21, passing: 10, defense: 6, goalkeeping: 3 }     // Total: 57
    },
    imageUrl: "https://goalplay-assets.fra1.cdn.digitaloceanspaces.com/characters/vini.webp"
  },
  {
    name: "Flor Wir",
    position: "midfielder",
    divisions: ["First", "Second", "Third"],
    rarity: "rare",
    statsByDivision: {
      first: { speed: 23, shooting: 17, passing: 34, defense: 16, goalkeeping: 5 },    // Total: 95
      second: { speed: 18, shooting: 14, passing: 27, defense: 13, goalkeeping: 4 },   // Total: 76
      third: { speed: 13, shooting: 10, passing: 21, defense: 10, goalkeeping: 3 }     // Total: 57
    },
    imageUrl: "https://goalplay-assets.fra1.cdn.digitaloceanspaces.com/characters/flor-wir.webp"
  },
  {
    name: "Willsa",
    position: "defender",
    divisions: ["First", "Second", "Third"],
    rarity: "rare",
    statsByDivision: {
      first: { speed: 16, shooting: 11, passing: 23, defense: 40, goalkeeping: 5 },    // Total: 95
      second: { speed: 13, shooting: 9, passing: 18, defense: 32, goalkeeping: 4 },   // Total: 76
      third: { speed: 10, shooting: 6, passing: 14, defense: 24, goalkeeping: 3 }     // Total: 57
    },
    imageUrl: "https://goalplay-assets.fra1.cdn.digitaloceanspaces.com/characters/willsa.webp"
  },
  {
    name: "Colpam",
    position: "midfielder",
    divisions: ["First", "Second", "Third"],
    rarity: "uncommon",
    statsByDivision: {
      first: { speed: 23, shooting: 17, passing: 34, defense: 16, goalkeeping: 5 },    // Total: 95
      second: { speed: 18, shooting: 14, passing: 27, defense: 13, goalkeeping: 4 },   // Total: 76
      third: { speed: 13, shooting: 10, passing: 21, defense: 10, goalkeeping: 3 }     // Total: 57
    },
    imageUrl: "https://goalplay-assets.fra1.cdn.digitaloceanspaces.com/characters/colpam.webp"
  },
  {
    name: "Emili Mar",
    position: "goalkeeper",
    divisions: ["First", "Second", "Third"],
    rarity: "uncommon",
    statsByDivision: {
      first: { speed: 10, shooting: 5, passing: 15, defense: 22, goalkeeping: 43 },    // Total: 95
      second: { speed: 8, shooting: 4, passing: 13, defense: 17, goalkeeping: 34 },   // Total: 76
      third: { speed: 6, shooting: 3, passing: 9, defense: 13, goalkeeping: 26 }      // Total: 57
    },
    imageUrl: "https://goalplay-assets.fra1.cdn.digitaloceanspaces.com/characters/emili-mar.webp"
  },
  {
    name: "July",
    position: "forward",
    divisions: ["First", "Second", "Third"],
    rarity: "rare",
    statsByDivision: {
      first: { speed: 28, shooting: 34, passing: 17, defense: 11, goalkeeping: 5 },    // Total: 95
      second: { speed: 23, shooting: 27, passing: 14, defense: 8, goalkeeping: 4 },   // Total: 76
      third: { speed: 17, shooting: 21, passing: 10, defense: 6, goalkeeping: 3 }     // Total: 57
    },
    imageUrl: "https://goalplay-assets.fra1.cdn.digitaloceanspaces.com/characters/july.webp"
  },
  {
    name: "Almost Messi",
    position: "forward",
    divisions: ["First", "Second", "Third"],
    rarity: "legendary",
    statsByDivision: {
      first: { speed: 28, shooting: 34, passing: 17, defense: 11, goalkeeping: 5 },    // Total: 95
      second: { speed: 23, shooting: 27, passing: 14, defense: 8, goalkeeping: 4 },   // Total: 76
      third: { speed: 17, shooting: 21, passing: 10, defense: 6, goalkeeping: 3 }     // Total: 57
    },
    imageUrl: "https://goalplay-assets.fra1.cdn.digitaloceanspaces.com/characters/almost-messi.webp"
  },
  {
    name: "Cristiano Fernaldo",
    position: "forward",
    divisions: ["First", "Second", "Third"],
    rarity: "legendary",
    statsByDivision: {
      first: { speed: 28, shooting: 34, passing: 17, defense: 11, goalkeeping: 5 },    // Total: 95
      second: { speed: 23, shooting: 27, passing: 14, defense: 8, goalkeeping: 4 },   // Total: 76
      third: { speed: 17, shooting: 21, passing: 10, defense: 6, goalkeeping: 3 }     // Total: 57
    },
    imageUrl: "https://goalplay-assets.fra1.cdn.digitaloceanspaces.com/characters/cristiano-fernaldo.webp"
  },
  {
    name: "Kalyan Mbappi",
    position: "forward",
    divisions: ["First", "Second", "Third"],
    rarity: "legendary",
    statsByDivision: {
      first: { speed: 28, shooting: 34, passing: 17, defense: 11, goalkeeping: 5 },    // Total: 95
      second: { speed: 23, shooting: 27, passing: 14, defense: 8, goalkeeping: 4 },   // Total: 76
      third: { speed: 17, shooting: 21, passing: 10, defense: 6, goalkeeping: 3 }     // Total: 57
    },
    imageUrl: "https://goalplay-assets.fra1.cdn.digitaloceanspaces.com/characters/kalyan-mbappi.webp"
  },
  {
    name: "Sinedine Sidini",
    position: "midfielder",
    divisions: ["First", "Second", "Third"],
    rarity: "legendary",
    statsByDivision: {
      first: { speed: 23, shooting: 17, passing: 34, defense: 16, goalkeeping: 5 },    // Total: 95
      second: { speed: 18, shooting: 14, passing: 27, defense: 13, goalkeeping: 4 },   // Total: 76
      third: { speed: 13, shooting: 10, passing: 21, defense: 10, goalkeeping: 3 }     // Total: 57
    },
    imageUrl: "https://goalplay-assets.fra1.cdn.digitaloceanspaces.com/characters/sinedine-sidini.webp"
  },
  {
    name: "Laminate Yumal",
    position: "forward",
    divisions: ["First", "Second", "Third"],
    rarity: "epic",
    statsByDivision: {
      first: { speed: 28, shooting: 34, passing: 17, defense: 11, goalkeeping: 5 },    // Total: 95
      second: { speed: 23, shooting: 27, passing: 14, defense: 8, goalkeeping: 4 },   // Total: 76
      third: { speed: 17, shooting: 21, passing: 10, defense: 6, goalkeeping: 3 }     // Total: 57
    },
    imageUrl: "https://goalplay-assets.fra1.cdn.digitaloceanspaces.com/characters/laminate-yumal.webp"
  },
  {
    name: "Newmar",
    position: "forward",
    divisions: ["First", "Second", "Third"],
    rarity: "epic",
    statsByDivision: {
      first: { speed: 28, shooting: 34, passing: 17, defense: 11, goalkeeping: 5 },    // Total: 95
      second: { speed: 23, shooting: 27, passing: 14, defense: 8, goalkeeping: 4 },   // Total: 76
      third: { speed: 17, shooting: 21, passing: 10, defense: 6, goalkeeping: 3 }     // Total: 57
    },
    imageUrl: "https://goalplay-assets.fra1.cdn.digitaloceanspaces.com/characters/newmar.webp"
  },
  {
    name: "Allaison Baker",
    position: "goalkeeper",
    divisions: ["First", "Second", "Third"],
    rarity: "epic",
    statsByDivision: {
      first: { speed: 10, shooting: 5, passing: 15, defense: 22, goalkeeping: 43 },    // Total: 95
      second: { speed: 8, shooting: 4, passing: 13, defense: 17, goalkeeping: 34 },   // Total: 76
      third: { speed: 6, shooting: 3, passing: 9, defense: 13, goalkeeping: 26 }      // Total: 57
    },
    imageUrl: "https://goalplay-assets.fra1.cdn.digitaloceanspaces.com/characters/allaison-baker.webp"
  },
  {
    name: "Achraf Hakimi",
    position: "defender",
    divisions: ["First", "Second", "Third"],
    rarity: "epic",
    statsByDivision: {
      first: { speed: 16, shooting: 11, passing: 23, defense: 40, goalkeeping: 5 },    // Total: 95
      second: { speed: 13, shooting: 9, passing: 18, defense: 32, goalkeeping: 4 },   // Total: 76
      third: { speed: 10, shooting: 6, passing: 14, defense: 24, goalkeeping: 3 }     // Total: 57
    },
    imageUrl: "https://photos.pinksale.finance/file/pinksale-logo-upload/1757983359454-da0227972628afadbe8cf59ce675462a.jpg"
  },
  {
    name: "Alphonso Davies",
    position: "defender",
    divisions: ["First", "Second", "Third"],
    rarity: "epic",
    statsByDivision: {
      first: { speed: 28, shooting: 11, passing: 23, defense: 28, goalkeeping: 5 },    // Total: 95
      second: { speed: 23, shooting: 9, passing: 18, defense: 22, goalkeeping: 4 },   // Total: 76
      third: { speed: 17, shooting: 6, passing: 14, defense: 17, goalkeeping: 3 }     // Total: 57
    },
    imageUrl: "https://photos.pinksale.finance/file/pinksale-logo-upload/1757983390709-a89644640afd251eeb4e9bf94a696206.jpg"
  },
  {
    name: "Cole Palmer",
    position: "midfielder",
    divisions: ["First", "Second", "Third"],
    rarity: "rare",
    statsByDivision: {
      first: { speed: 23, shooting: 17, passing: 34, defense: 16, goalkeeping: 5 },    // Total: 95
      second: { speed: 18, shooting: 14, passing: 27, defense: 13, goalkeeping: 4 },   // Total: 76
      third: { speed: 13, shooting: 10, passing: 21, defense: 10, goalkeeping: 3 }     // Total: 57
    },
    imageUrl: "https://photos.pinksale.finance/file/pinksale-logo-upload/1757983408453-d154123b785f54f454863ddc35ede7e5.jpg"
  },
  {
    name: "Emiliano Martinez",
    position: "goalkeeper",
    divisions: ["First", "Second", "Third"],
    rarity: "epic",
    statsByDivision: {
      first: { speed: 10, shooting: 5, passing: 15, defense: 22, goalkeeping: 43 },    // Total: 95
      second: { speed: 8, shooting: 4, passing: 13, defense: 17, goalkeeping: 34 },   // Total: 76
      third: { speed: 6, shooting: 3, passing: 9, defense: 13, goalkeeping: 26 }      // Total: 57
    },
    imageUrl: "https://photos.pinksale.finance/file/pinksale-logo-upload/1757983408453-d154123b785f54f454863ddc35ede7e5.jpg"
  },
  {
    name: "Erling Haaland",
    position: "forward",
    divisions: ["First", "Second", "Third"],
    rarity: "legendary",
    statsByDivision: {
      first: { speed: 28, shooting: 34, passing: 17, defense: 11, goalkeeping: 5 },    // Total: 95
      second: { speed: 23, shooting: 27, passing: 14, defense: 8, goalkeeping: 4 },   // Total: 76
      third: { speed: 17, shooting: 21, passing: 10, defense: 6, goalkeeping: 3 }     // Total: 57
    },
    imageUrl: "https://photos.pinksale.finance/file/pinksale-logo-upload/1757983467796-62ced5d8ac0e92bd08052111863a9b3e.jpg"
  },
  {
    name: "Florian Wirtz",
    position: "midfielder",
    divisions: ["First", "Second", "Third"],
    rarity: "epic",
    statsByDivision: {
      first: { speed: 23, shooting: 17, passing: 34, defense: 16, goalkeeping: 5 },    // Total: 95
      second: { speed: 18, shooting: 14, passing: 27, defense: 13, goalkeeping: 4 },   // Total: 76
      third: { speed: 13, shooting: 10, passing: 21, defense: 10, goalkeeping: 3 }     // Total: 57
    },
    imageUrl: "https://photos.pinksale.finance/file/pinksale-logo-upload/1757983500840-047ba6f8d7881c6747ab71202e9ca731.jpg"
  },
  {
    name: "Julian Alvarez",
    position: "forward",
    divisions: ["First", "Second", "Third"],
    rarity: "rare",
    statsByDivision: {
      first: { speed: 28, shooting: 34, passing: 17, defense: 11, goalkeeping: 5 },    // Total: 95
      second: { speed: 23, shooting: 27, passing: 14, defense: 8, goalkeeping: 4 },   // Total: 76
      third: { speed: 17, shooting: 21, passing: 10, defense: 6, goalkeeping: 3 }     // Total: 57
    },
    imageUrl: "https://photos.pinksale.finance/file/pinksale-logo-upload/1757983521715-59c48dc44402ca706d325cff88f19688.jpg"
  },
  {
    name: "Vinicius Junior",
    position: "forward",
    divisions: ["First", "Second", "Third"],
    rarity: "legendary",
    statsByDivision: {
      first: { speed: 28, shooting: 34, passing: 17, defense: 11, goalkeeping: 5 },    // Total: 95
      second: { speed: 23, shooting: 27, passing: 14, defense: 8, goalkeeping: 4 },   // Total: 76
      third: { speed: 17, shooting: 21, passing: 10, defense: 6, goalkeeping: 3 }     // Total: 57
    },
    imageUrl: "https://photos.pinksale.finance/file/pinksale-logo-upload/1757983538747-0bcecab2037fc834544a04f096cb9165.jpg"
  },
  {
    name: "William Saliba",
    position: "defender",
    divisions: ["First", "Second", "Third"],
    rarity: "rare",
    statsByDivision: {
      first: { speed: 16, shooting: 11, passing: 23, defense: 40, goalkeeping: 5 },    // Total: 95
      second: { speed: 13, shooting: 9, passing: 18, defense: 32, goalkeeping: 4 },   // Total: 76
      third: { speed: 10, shooting: 6, passing: 14, defense: 24, goalkeeping: 3 }     // Total: 57
    },
    imageUrl: "https://photos.pinksale.finance/file/pinksale-logo-upload/1757983564994-c2856454fe20ec0b97e1ddf2e82d2e6d.jpg"
  }
];

/**
 * Utilidades para trabajar con datos de jugadores reales
 */
export class RealPlayersService {
  /**
   * Obtiene un jugador por nombre
   */
  static getPlayerByName(name: string): PlayerData | null {
    return REAL_PLAYERS_DATA.find(player => 
      player.name.toLowerCase() === name.toLowerCase()
    ) || null;
  }

  /**
   * Obtiene jugadores por posición
   */
  static getPlayersByPosition(position: string): PlayerData[] {
    return REAL_PLAYERS_DATA.filter(player => 
      player.position.toLowerCase() === position.toLowerCase()
    );
  }

  /**
   * Obtiene jugadores por rareza
   */
  static getPlayersByRarity(rarity: string): PlayerData[] {
    return REAL_PLAYERS_DATA.filter(player => 
      player.rarity.toLowerCase() === rarity.toLowerCase()
    );
  }

  /**
   * Obtiene jugadores disponibles para una división específica
   */
  static getPlayersForDivision(division: string): PlayerData[] {
    const divisionMap: Record<'primera' | 'segunda' | 'tercera', 'First' | 'Second' | 'Third'> = {
      primera: 'First',
      segunda: 'Second',
      tercera: 'Third',
    };

    const normalized = division.toLowerCase();
    const isKnownDivision = (value: string): value is keyof typeof divisionMap => value in divisionMap;
    const targetDivision = isKnownDivision(normalized) ? divisionMap[normalized] : division;

    return REAL_PLAYERS_DATA.filter((player) => player.divisions.includes(targetDivision));
  }

  /**
   * Obtiene las estadísticas base de un jugador para una división
   */
  static getPlayerBaseStats(playerName: string, division: string): PlayerStatsData | null {
    const player = this.getPlayerByName(playerName);
    if (!player) return null;

    const divisionKeyMap: Record<'primera' | 'segunda' | 'tercera', 'first' | 'second' | 'third'> = {
      primera: 'first',
      segunda: 'second',
      tercera: 'third',
    };

    const normalizedDivision = division.toLowerCase();
    const isValidDivisionKey = (value: string): value is keyof typeof divisionKeyMap => value in divisionKeyMap;
    if (!isValidDivisionKey(normalizedDivision)) {
      return null;
    }

    const divisionKey = divisionKeyMap[normalizedDivision];
    return player.statsByDivision[divisionKey];
  }

  /**
   * Calcula las estadísticas finales con bonificaciones de nivel
   */
  static calculateFinalStats(
    playerName: string, 
    division: string, 
    currentLevel: number,
    experience: number
  ): { baseStats: PlayerStatsData; bonuses: PlayerStatsData; totalStats: PlayerStatsData } | null {
    const baseStats = this.getPlayerBaseStats(playerName, division);
    if (!baseStats) return null;

    // Calcular bonificaciones por nivel y experiencia
    const bonuses = this.calculateLevelBonuses(currentLevel, experience);
    
    // Calcular stats totales
    const totalStats = {
      speed: baseStats.speed + bonuses.speed,
      shooting: baseStats.shooting + bonuses.shooting,
      passing: baseStats.passing + bonuses.passing,
      defense: baseStats.defense + bonuses.defense,
      goalkeeping: baseStats.goalkeeping + bonuses.goalkeeping
    };

    return { baseStats, bonuses, totalStats };
  }

  /**
   * Calcula bonificaciones por nivel y experiencia
   */
  private static calculateLevelBonuses(level: number, experience: number): PlayerStatsData {
    // Bonificación base por nivel (cada 5 niveles = +1 a todas las stats)
    const levelBonus = Math.floor(level / 5);
    
    // Bonificación por experiencia (cada 1000 XP = +1 adicional)
    const experienceBonus = Math.floor(experience / 1000);
    
    const totalBonus = levelBonus + experienceBonus;

    return {
      speed: totalBonus,
      shooting: totalBonus,
      passing: totalBonus,
      defense: totalBonus,
      goalkeeping: totalBonus
    };
  }

  /**
   * Obtiene el progreso de farming requerido para un jugador
   */
  static getFarmingProgress(currentLevel: number, experience: number): {
    farmingComplete: boolean;
    progressPercentage: number;
    requiredLevel: number;
    requiredExperience: number;
  } {
    const REQUIRED_LEVEL = 5;  // Nivel mínimo para jugar
    const REQUIRED_XP = 500;   // XP mínima para jugar

    const farmingComplete = currentLevel >= REQUIRED_LEVEL && experience >= REQUIRED_XP;
    
    const levelProgress = Math.min(currentLevel / REQUIRED_LEVEL, 1) * 50; // 50% del progreso
    const xpProgress = Math.min(experience / REQUIRED_XP, 1) * 50;         // 50% del progreso
    const progressPercentage = levelProgress + xpProgress;

    return {
      farmingComplete,
      progressPercentage: Math.floor(progressPercentage),
      requiredLevel: REQUIRED_LEVEL,
      requiredExperience: REQUIRED_XP
    };
  }

  /**
   * Genera un jugador aleatorio para gacha draw
   */
  static generateRandomPlayerForDraw(division: string, excludeOwned: string[] = []): PlayerData | null {
    const availablePlayers = this.getPlayersForDivision(division)
      .filter(player => !excludeOwned.includes(player.name));

    if (availablePlayers.length === 0) return null;

    // Aplicar pesos por rareza
    const weightedPlayers = availablePlayers.map(player => ({
      ...player,
      weight: this.getRarityWeight(player.rarity)
    }));

    // Selección ponderada
    const totalWeight = weightedPlayers.reduce((sum, p) => sum + p.weight, 0);
    let random = Math.random() * totalWeight;

    for (const player of weightedPlayers) {
      random -= player.weight;
      if (random <= 0) {
        return player;
      }
    }

    return availablePlayers[0]; // Fallback
  }

  /**
   * Obtiene el peso de probabilidad por rareza
   */
  private static getRarityWeight(rarity: string): number {
    const weights: Record<'legendary' | 'epic' | 'rare' | 'uncommon' | 'common', number> = {
      legendary: 1,
      epic: 5,
      rare: 15,
      uncommon: 30,
      common: 49,
    };

    const normalized = rarity.toLowerCase();
    if (normalized in weights) {
      return weights[normalized as keyof typeof weights];
    }

    return 25;
  }

  /**
   * Convierte división string a formato interno
   */
  static normalizeDivision(division: string): string {
    const divisionMap: Record<'first' | 'second' | 'third', 'primera' | 'segunda' | 'tercera'> = {
      first: 'primera',
      second: 'segunda',
      third: 'tercera',
    };

    const normalized = division.toLowerCase();
    const isInternalDivision = (value: string): value is keyof typeof divisionMap => value in divisionMap;

    return isInternalDivision(normalized) ? divisionMap[normalized] : normalized;
  }

  /**
   * Obtiene todos los jugadores únicos (sin duplicados por división)
   */
  static getAllUniquePlayerNames(): string[] {
    return [...new Set(REAL_PLAYERS_DATA.map(player => player.name))];
  }

  /**
   * Obtiene estadísticas de la colección de jugadores
   */
  static getCollectionStats() {
    const totalPlayers = REAL_PLAYERS_DATA.length;
    const uniquePlayers = this.getAllUniquePlayerNames().length;
    
    const byPosition = REAL_PLAYERS_DATA.reduce((acc, player) => {
      acc[player.position] = (acc[player.position] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byRarity = REAL_PLAYERS_DATA.reduce((acc, player) => {
      acc[player.rarity] = (acc[player.rarity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalPlayers,
      uniquePlayers,
      byPosition,
      byRarity,
      averageStatsFirst: this.calculateAverageStats('first'),
      averageStatsSecond: this.calculateAverageStats('second'),
      averageStatsThird: this.calculateAverageStats('third')
    };
  }

  /**
   * Calcula estadísticas promedio por división
   */
  private static calculateAverageStats(division: 'first' | 'second' | 'third'): PlayerStatsData {
    const players = REAL_PLAYERS_DATA;
    const totalPlayers = players.length;

    const totals = players.reduce((acc, player) => {
      const stats = player.statsByDivision[division];
      acc.speed += stats.speed;
      acc.shooting += stats.shooting;
      acc.passing += stats.passing;
      acc.defense += stats.defense;
      acc.goalkeeping += stats.goalkeeping;
      return acc;
    }, { speed: 0, shooting: 0, passing: 0, defense: 0, goalkeeping: 0 });

    return {
      speed: Math.round(totals.speed / totalPlayers),
      shooting: Math.round(totals.shooting / totalPlayers),
      passing: Math.round(totals.passing / totalPlayers),
      defense: Math.round(totals.defense / totalPlayers),
      goalkeeping: Math.round(totals.goalkeeping / totalPlayers)
    };
  }
}

/**
 * Exportar datos para uso en otros módulos
 */
export default REAL_PLAYERS_DATA;
