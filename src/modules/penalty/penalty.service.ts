import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DataAdapterService } from '../../common/services/data-adapter.service';
import { InventoryService } from '../inventory/inventory.service';
import { Division, DivisionHelpers } from '../../config/division.config';
import { PenaltyProbabilityService } from '../../services/penalty-probability.service';
import { RealPlayersService } from '../../data/players.data';
import { OwnedPlayer } from '../inventory/entities/inventory.entity';
import { PenaltySession, PenaltyAttempt, PenaltyDirection } from './entities/penalty.entity';
import { CreateSessionDto, JoinSessionDto, PenaltyAttemptDto } from './dto/penalty.dto';
import { SessionType, SessionStatus } from '../../common/types/base.types';

@Injectable()
export class PenaltyService {
  constructor(
    private dataAdapter: DataAdapterService,
    private inventoryService: InventoryService,
    private penaltyProbabilityService: PenaltyProbabilityService,
  ) {}

  async createSession(userId: string, dto: CreateSessionDto): Promise<PenaltySession> {
    // Verify user owns the player
    const userPlayers = await this.inventoryService.getUserPlayers(userId);
    const playerOwned = userPlayers.some((p: OwnedPlayer) => p.playerId === dto.playerId);
    
    if (!playerOwned) {
      throw new BadRequestException('Player not owned by user');
    }

    const seed = this.generateSessionSeed(userId, dto.playerId);

    const session = await this.dataAdapter.create('penalty-sessions', {
      hostUserId: userId,
      type: dto.type,
      status: dto.type === SessionType.SINGLE_PLAYER ? SessionStatus.IN_PROGRESS : SessionStatus.WAITING,
      hostPlayerId: dto.playerId,
      guestPlayerId: dto.type === SessionType.SINGLE_PLAYER ? 'ai_goalkeeper' : undefined,
      maxRounds: dto.maxRounds || 5,
      currentRound: 1,
      hostScore: 0,
      guestScore: 0,
      seed,
      startedAt: dto.type === SessionType.SINGLE_PLAYER ? new Date().toISOString() : undefined,
    });

    console.log(`Penalty session created: ${session.id} by user ${userId}`);

    return session;
  }

  async joinSession(sessionId: string, userId: string, dto: JoinSessionDto): Promise<PenaltySession> {
    const session = await this.dataAdapter.findById('penalty-sessions', sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.status !== SessionStatus.WAITING) {
      throw new BadRequestException('Session is not available to join');
    }

    if (session.hostUserId === userId) {
      throw new BadRequestException('Cannot join own session');
    }

    // Verify user owns the player
    const userPlayers = await this.inventoryService.getUserPlayers(userId);
    const playerOwned = userPlayers.some((p: OwnedPlayer) => p.playerId === dto.playerId);
    
    if (!playerOwned) {
      throw new BadRequestException('Player not owned by user');
    }

    const updatedSession = await this.dataAdapter.update('penalty-sessions', sessionId, {
      guestUserId: userId,
      guestPlayerId: dto.playerId,
      status: SessionStatus.IN_PROGRESS,
      startedAt: new Date().toISOString(),
    });

    console.log(`Penalty session joined: ${sessionId} by user ${userId}`);

    return updatedSession;
  }

  async attemptPenalty(
    sessionId: string,
    userId: string,
    dto: PenaltyAttemptDto,
  ): Promise<{ isGoal: boolean; description: string; session: PenaltySession }> {
    const session = await this.dataAdapter.findById('penalty-sessions', sessionId);
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new BadRequestException('Session is not in progress');
    }

    // Generate outcome using simple algorithm
    const outcome = this.calculatePenaltyOutcome(session, dto, userId);

    // Record attempt
    await this.dataAdapter.create('penalty-attempts', {
      sessionId,
      round: session.currentRound,
      shooterUserId: userId,
      goalkeeperId: session.type === SessionType.SINGLE_PLAYER ? 'ai' : 
                   (userId === session.hostUserId ? session.guestUserId! : session.hostUserId),
      shooterPlayerId: userId === session.hostUserId ? session.hostPlayerId : session.guestPlayerId!,
      goalkeeperPlayerId: session.type === SessionType.SINGLE_PLAYER ? 'ai_goalkeeper' :
                         (userId === session.hostUserId ? session.guestPlayerId! : session.hostPlayerId),
      direction: dto.direction,
      power: dto.power,
      keeperDirection: this.generateKeeperDirection(session.seed, session.currentRound),
      isGoal: outcome.isGoal,
      attemptedAt: new Date().toISOString(),
      seed: this.generateAttemptSeed(session.seed, session.currentRound, userId),
    });

    // Update session score
    const scoreUpdate = outcome.isGoal ? 1 : 0;
    let updatedSession: PenaltySession;

    if (userId === session.hostUserId) {
      updatedSession = await this.dataAdapter.update('penalty-sessions', sessionId, {
        hostScore: session.hostScore + scoreUpdate,
        currentRound: session.currentRound + 1,
      });
    } else {
      updatedSession = await this.dataAdapter.update('penalty-sessions', sessionId, {
        guestScore: session.guestScore + scoreUpdate,
        currentRound: session.currentRound + 1,
      });
    }

    // Check if session is complete
    if (updatedSession.currentRound > updatedSession.maxRounds) {
      const winnerId = updatedSession.hostScore > updatedSession.guestScore 
        ? updatedSession.hostUserId 
        : updatedSession.guestScore > updatedSession.hostScore 
          ? updatedSession.guestUserId 
          : undefined;

      await this.dataAdapter.update('penalty-sessions', sessionId, {
        status: SessionStatus.COMPLETED,
        winnerId,
        completedAt: new Date().toISOString(),
      });
    }

    console.log(`Penalty attempt: ${sessionId} by user ${userId}, goal: ${outcome.isGoal}`);

    return {
      isGoal: outcome.isGoal,
      description: outcome.description,
      session: updatedSession,
    };
  }

  private calculatePenaltyOutcome(
    session: PenaltySession,
    attempt: PenaltyAttemptDto,
    userId: string,
  ): { isGoal: boolean; description: string } {
    // NUEVA LÓGICA: Usar fórmula canónica exacta
    const keeperDirection = this.generateKeeperDirection(session.seed, session.currentRound);
    
    // 1. Obtener stats reales del jugador y su división
    const playerStats = this.getPlayerStatsForPenalty(session, userId);
    const playerDivision = this.getPlayerDivisionString(session, userId);
    
    // 2. Calcular chance base usando fórmula canónica
    let baseChance = this.penaltyProbabilityService.computeChance(playerStats, playerDivision);
    
    // 3. Aplicar modificadores adicionales (manteniendo la esencia del juego)
    let finalChance = baseChance;
    
    // Factor de potencia del disparo
    if (attempt.power < 50) {
      finalChance = Math.floor(finalChance * 0.8); // Muy suave = menos efectivo
    } else if (attempt.power > 90) {
      finalChance = Math.floor(finalChance * 0.6); // Muy fuerte = menos control
    }
    
    // Factor de dirección vs portero (el más importante)
    if (attempt.direction === keeperDirection) {
      finalChance = Math.floor(finalChance * 0.3); // Portero adivina = reduce drásticamente
    }
    
    // Asegurar que esté en rango [5, 95]
    finalChance = Math.max(5, Math.min(95, finalChance));
    
    // 4. Decisión final usando roll [1..100]
    const isGoal = this.penaltyProbabilityService.decidePenalty(playerStats, playerDivision);

    const description = isGoal
      ? `Goal! The ball flies into the ${attempt.direction} corner with ${attempt.power}% power!`
      : attempt.direction === keeperDirection
        ? `Saved! The goalkeeper dives ${keeperDirection} and makes a fantastic save!`
        : `¡Fallo! El disparo se va ${attempt.power > 90 ? 'alto' : 'desviado'} mientras el portero se lanza hacia ${keeperDirection}!`;
    
    // Log detallado para debugging
    const details = this.penaltyProbabilityService.getCalculationDetails(playerStats, playerDivision);
    console.log(`Penalty Calculation Details:`, {
      player: { sumStats: details.sumSubstats, division: playerDivision },
      probability: { base: baseChance, final: finalChance },
      modifiers: { power: attempt.power, direction: attempt.direction, keeper: keeperDirection },
      result: isGoal ? 'GOAL' : 'MISS'
    });

    return { isGoal, description };
  }

  /**
   * Obtiene las stats del jugador para cálculos de penalty
   */
  private getPlayerStatsForPenalty(session: PenaltySession, userId: string): PlayerStats {
    // Obtener stats reales del jugador desde inventory
    const playerDivision = this.getPlayerDivisionString(session, userId);
    
    // Obtener el nombre del jugador desde la sesión
    const playerId = userId === session.hostUserId ? session.hostPlayerId : session.guestPlayerId!;
    
    // Buscar stats reales del jugador
    const playerStats = this.getRealPlayerStats(playerId, playerDivision);
    
    if (playerStats) {
      return playerStats;
    }
    
    // Fallback: generar stats que sumen exactamente getStartingStats()
    return this.generateFallbackStats(playerDivision);
  }
  
  /**
   * Obtiene stats reales del jugador desde los datos
   */
  private getRealPlayerStats(playerId: string, division: string): PlayerStats | null {
    try {
      // Buscar en datos reales de jugadores
      const playerData = RealPlayersService.getPlayerByName(playerId);
      if (!playerData) return null;
      
      const divisionKey = division.toLowerCase() === 'primera' ? 'first' :
                         division.toLowerCase() === 'segunda' ? 'second' :
                         division.toLowerCase() === 'tercera' ? 'third' : null;
      
      if (!divisionKey) return null;
      
      const stats = playerData.statsByDivision[divisionKey];
      
      return {
        speed: stats.speed,
        shooting: stats.shooting,
        passing: stats.passing,
        defending: stats.defense, // Mapear defense -> defending
        goalkeeping: stats.goalkeeping,
        overall: Math.floor((stats.speed + stats.shooting + stats.passing + stats.defense + stats.goalkeeping) / 5)
      };
      
    } catch (error) {
      console.error('Error getting real player stats:', error);
      return null;
    }
  }
  
  /**
   * Genera stats de fallback que sumen exactamente getStartingStats()
   */
  private generateFallbackStats(playerDivision: string): PlayerStats {
    const divisionNumber = Division.fromString(playerDivision);
    const division = new Division(divisionNumber);
    const totalStats = division.getStartingStats();
    
    // Distribuir equitativamente
    const avgStat = Math.floor(totalStats / 5);
    const remainder = totalStats % 5;
    
    return {
      speed: avgStat,
      shooting: avgStat + (remainder > 0 ? 1 : 0), // Distribuir remainder
      passing: avgStat,
      defending: avgStat,
      goalkeeping: avgStat,
      overall: avgStat
    };
  }

  /**
   * Obtiene la división del jugador como número
   */
  private getPlayerDivision(session: PenaltySession, userId: string): number {
    // TODO: Obtener división real del jugador desde inventory
    return Division.SECOND_DIVISION;
  }

  /**
   * Obtiene la división del jugador como string
   */
  private getPlayerDivisionString(session: PenaltySession, userId: string): string {
    const divisionNumber = this.getPlayerDivision(session, userId);
    return Division.toString(divisionNumber);
  }

  private generateKeeperDirection(seed: string, round: number): PenaltyDirection {
    const directions = Object.values(PenaltyDirection);
    return directions[Math.floor(Math.random() * directions.length)];
  }

  private generateSessionSeed(userId: string, playerId: string): string {
    return `${userId}-${playerId}-${Date.now()}`;
  }

  private generateAttemptSeed(sessionSeed: string, round: number, userId: string): string {
    return `${sessionSeed}-${round}-${userId}`;
  }

  async findSessionById(id: string): Promise<PenaltySession> {
    const session = await this.dataAdapter.findById('penalty-sessions', id);
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    return session;
  }

  async findUserSessions(userId: string): Promise<PenaltySession[]> {
    return this.dataAdapter.findWhere('penalty-sessions',
      (s: PenaltySession) => s.hostUserId === userId || s.guestUserId === userId
    );
  }

  async getSessionAttempts(sessionId: string): Promise<PenaltyAttempt[]> {
    return this.dataAdapter.findWhere('penalty-attempts', (a: PenaltyAttempt) => a.sessionId === sessionId);
  }
}