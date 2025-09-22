import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../database/entities/order.entity';
import { GachaPool } from '../../database/entities/gacha-pool.entity';
import { GachaPlayer } from '../../database/entities/gacha-player.entity';
import { GachaPoolEntry } from '../../database/entities/gacha-pool-entry.entity';
import { GachaDraw } from '../../database/entities/gacha-draw.entity';
import { OwnedPlayer } from '../../database/entities/owned-player.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GachaService {
  private readonly logger = new Logger(GachaService.name);

  constructor(
    @InjectRepository(GachaPool)
    private gachaPoolRepository: Repository<GachaPool>,
    @InjectRepository(GachaPlayer)
    private gachaPlayerRepository: Repository<GachaPlayer>,
    @InjectRepository(GachaPoolEntry)
    private gachaPoolEntryRepository: Repository<GachaPoolEntry>,
    @InjectRepository(GachaDraw)
    private gachaDrawRepository: Repository<GachaDraw>,
    @InjectRepository(OwnedPlayer)
    private ownedPlayerRepository: Repository<OwnedPlayer>,
  ) {}

  async executeGachaDraw(order: Order) {
    this.logger.log(`🎲 Executing gacha draw for order ${order.id}`);

    // Get gacha pool from product variant
    const gachaPoolId = order.productVariant?.gachaPoolId;
    if (!gachaPoolId) {
      throw new Error('No gacha pool ID found for product variant');
    }

    // Get gacha pool
    const pool = await this.gachaPoolRepository.findOne({
      where: { id: gachaPoolId, isActive: true }
    });

    if (!pool) {
      throw new NotFoundException(`Gacha pool ${gachaPoolId} not found`);
    }

    // Get pool entries with players
    const poolEntries = await this.gachaPoolEntryRepository.find({
      where: { poolId: pool.id, isActive: true },
      relations: ['player'],
    });

    if (poolEntries.length === 0) {
      throw new Error('No players available in gacha pool');
    }

    // Get user's owned players for anti-duplicate policy
    const ownedPlayers = await this.ownedPlayerRepository.find({
      where: { userId: order.userId, isActive: true }
    });

    const ownedPlayerIds = ownedPlayers.map(op => op.playerId);

    // Filter available players based on anti-duplicate policy
    let availableEntries = poolEntries;
    if (pool.antiDuplicatePolicy === 'EXCLUDE_OWNED_AT_DRAW') {
      availableEntries = poolEntries.filter(entry => !ownedPlayerIds.includes(entry.playerId));
    }

    if (availableEntries.length === 0) {
      this.logger.warn(`⚠️ No available players for user ${order.userId} in pool ${pool.id}`);
      availableEntries = poolEntries; // Fallback to allow duplicates
    }

    // Execute weighted random selection
    const drawnPlayers = [];
    const drawCount = order.quantity;
    const seed = uuidv4();

    for (let i = 0; i < drawCount; i++) {
      const selectedEntry = this.weightedRandomSelection(availableEntries, seed + i);
      drawnPlayers.push(selectedEntry.player);
    }

    // Create gacha draw record
    const gachaDraw = await this.gachaDrawRepository.save({
      userId: order.userId,
      orderId: order.id,
      poolId: pool.id,
      playersDrawn: drawnPlayers.map(p => p.id),
      seed,
      drawDate: new Date(),
    });

    this.logger.log(`🎉 Gacha draw completed: ${drawnPlayers.length} players drawn`);

    return {
      drawId: gachaDraw.id,
      players: drawnPlayers,
      poolName: pool.name,
    };
  }

  async addPlayerToInventory(userId: string, player: GachaPlayer, orderId: string, drawId: string) {
    const ownedPlayer = await this.ownedPlayerRepository.save({
      userId,
      playerId: player.id,
      sourceOrderId: orderId,
      sourceDrawId: drawId,
      acquiredAt: new Date(),
      currentLevel: 1,
      experience: 0,
      isActive: true,
    });

    this.logger.log(`👤 Player ${player.name} added to user ${userId} inventory`);
    return ownedPlayer;
  }

  async getGachaPool(id: string) {
    return this.gachaPoolRepository.findOne({
      where: { id, isActive: true }
    });
  }

  async getGachaPlayer(id: string) {
    return this.gachaPlayerRepository.findOne({
      where: { id }
    });
  }

  async getRealPlayersData() {
    return this.gachaPlayerRepository.find({
      order: { name: 'ASC' }
    });
  }

  private weightedRandomSelection(entries: GachaPoolEntry[], seed: string): GachaPoolEntry {
    // Create deterministic random based on seed
    const random = this.seededRandom(seed);
    
    // Calculate total weight
    const totalWeight = entries.reduce((sum, entry) => sum + parseFloat(entry.weight.toString()), 0);
    
    // Generate random value
    let randomValue = random * totalWeight;
    
    // Select entry based on weight
    for (const entry of entries) {
      randomValue -= parseFloat(entry.weight.toString());
      if (randomValue <= 0) {
        return entry;
      }
    }
    
    // Fallback to first entry
    return entries[0];
  }

  private seededRandom(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) / 2147483647;
  }
}