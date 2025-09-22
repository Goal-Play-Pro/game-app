import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PenaltySession } from '../../database/entities/penalty-session.entity';
import { PenaltyAttempt } from '../../database/entities/penalty-attempt.entity';
import { OwnedPlayer } from '../../database/entities/owned-player.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PenaltyService {
  constructor(
    @InjectRepository(PenaltySession)
    private sessionRepository: Repository<PenaltySession>,
    @InjectRepository(PenaltyAttempt)
    private attemptRepository: Repository<PenaltyAttempt>,
    @InjectRepository(OwnedPlayer)
    private ownedPlayerRepository: Repository<OwnedPlayer>,
  ) {}

  async getUserSessions(userId: string) {
    return this.sessionRepository.find({
      where: [
        { hostUserId: userId },
        { guestUserId: userId }
      ],
      order: { createdAt: 'DESC' }
    });
  }

  async createSession(userId: string, sessionData: any) {
    // Verify player ownership
    const ownedPlayer = await this.ownedPlayerRepository.findOne({
      where: { id: sessionData.playerId, userId }
    });
    
    if (!ownedPlayer) {
      throw new ForbiddenException('Player not owned by user');
    }

    // Verify player is ready to play
    if (ownedPlayer.currentLevel < 5 || ownedPlayer.experience < 500) {
      throw new BadRequestException('Player needs more training before playing');
    }

    // Create session
    const session = await this.sessionRepository.save({
      hostUserId: userId,
      guestUserId: sessionData.type === 'multiplayer' ? null : null,
      type: sessionData.type || 'single_player',
      status: 'in_progress',
      hostPlayerId: sessionData.playerId,
      guestPlayerId: sessionData.type === 'single_player' ? 'ai_goalkeeper' : null,
      maxRounds: sessionData.maxRounds || 5,
      currentRound: 1,
      hostScore: 0,
      guestScore: 0,
      seed: uuidv4(),
      startedAt: new Date(),
    });

    return session;
  }

  async getSessionDetails(sessionId: string, userId: string) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
      relations: ['hostPlayer', 'guestPlayer']
    });
    
    if (!session || (session.hostUserId !== userId && session.guestUserId !== userId)) {
      throw new NotFoundException('Session not found');
    }
    
    return session;
  }

  async attemptPenalty(sessionId: string, attemptData: any, userId: string) {
    const session = await this.getSessionDetails(sessionId, userId);
    
    if (session.status !== 'in_progress') {
      throw new BadRequestException('Session is not active');
    }

    // Validate attempt data
    if (!['left', 'center', 'right'].includes(attemptData.direction)) {
      throw new BadRequestException('Invalid penalty direction');
    }
    
    if (attemptData.power < 0 || attemptData.power > 100) {
      throw new BadRequestException('Invalid penalty power');
    }

    // Calculate penalty result
    const power = attemptData.power || 75;
    const direction = attemptData.direction;
    const keeperDirection = this.getAIKeeperDirection();
    const isGoal = this.calculatePenaltyResult(direction, keeperDirection, power);
    
    // Record attempt
    await this.attemptRepository.save({
      sessionId,
      round: session.currentRound,
      shooterUserId: userId,
      goalkeeperId: 'ai',
      shooterPlayerId: session.hostPlayerId,
      goalkeeperPlayerId: 'ai_goalkeeper',
      direction,
      power,
      keeperDirection,
      isGoal,
      attemptedAt: new Date(),
      seed: uuidv4(),
    });

    // Update session score
    const newHostScore = session.hostScore + (isGoal ? 1 : 0);
    const newRound = session.currentRound + 1;
    const isCompleted = newRound > session.maxRounds;

    let winnerId = null;
    if (isCompleted) {
      if (newHostScore > session.guestScore) {
        winnerId = userId;
      } else if (session.guestScore > newHostScore) {
        winnerId = session.type === 'single_player' ? 'ai' : session.guestUserId;
      }
    }

    await this.sessionRepository.update(sessionId, {
      hostScore: newHostScore,
      currentRound: isCompleted ? session.currentRound : newRound,
      status: isCompleted ? 'completed' : 'in_progress',
      completedAt: isCompleted ? new Date() : null,
      winnerId: isCompleted ? winnerId : null,
    });

    return {
      isGoal,
      description: isGoal 
        ? `¡Gol! El balón vuela hacia la esquina ${direction} con ${power}% de potencia!`
        : `¡Parada! El portero adivina la dirección y detiene el balón.`,
      round: session.currentRound,
      hostScore: newHostScore,
      guestScore: session.guestScore,
      sessionStatus: isCompleted ? 'completed' : 'in_progress',
      winnerId: isCompleted ? winnerId : null,
    };
  }

  async joinSession(sessionId: string, playerId: string, userId: string) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId }
    });
    
    if (!session || session.type !== 'multiplayer' || session.status !== 'waiting') {
      throw new BadRequestException('Cannot join this session');
    }

    // Verify player ownership
    const ownedPlayer = await this.ownedPlayerRepository.findOne({
      where: { id: playerId, userId }
    });
    
    if (!ownedPlayer) {
      throw new ForbiddenException('Player not owned by user');
    }

    // Update session
    await this.sessionRepository.update(sessionId, {
      guestUserId: userId,
      guestPlayerId: playerId,
      status: 'in_progress',
      startedAt: new Date(),
    });

    return this.sessionRepository.findOne({ where: { id: sessionId } });
  }

  private getAIKeeperDirection(): string {
    const directions = ['left', 'center', 'right'];
    return directions[Math.floor(Math.random() * directions.length)];
  }

  private calculatePenaltyResult(direction: string, keeperDirection: string, power: number): boolean {
    if (direction !== keeperDirection) {
      // Keeper goes wrong way - higher chance of goal
      const baseChance = 0.75;
      const powerBonus = (power / 100) * 0.2;
      return Math.random() < (baseChance + powerBonus);
    } else {
      // Keeper guesses correctly - lower chance but still possible
      const baseChance = 0.15;
      const powerBonus = (power / 100) * 0.25;
      return Math.random() < (baseChance + powerBonus);
    }
  }
}