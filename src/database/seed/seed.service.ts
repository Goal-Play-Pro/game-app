import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { GachaPool } from '../entities/gacha-pool.entity';
import { GachaPlayer } from '../entities/gacha-player.entity';
import { GachaPoolEntry } from '../entities/gacha-pool-entry.entity';
import { REAL_PLAYERS_DATA } from '../../data/players.data';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    @InjectRepository(GachaPool)
    private poolRepository: Repository<GachaPool>,
    @InjectRepository(GachaPlayer)
    private playerRepository: Repository<GachaPlayer>,
    @InjectRepository(GachaPoolEntry)
    private poolEntryRepository: Repository<GachaPoolEntry>,
  ) {}

  async seedDatabase() {
    this.logger.log('🌱 Starting database seeding...');

    try {
      await this.seedProducts();
      await this.seedGachaPools();
      await this.seedGachaPlayers();
      await this.seedPoolEntries();
      
      this.logger.log('✅ Database seeding completed successfully');
    } catch (error) {
      this.logger.error('❌ Database seeding failed:', error);
      throw error;
    }
  }

  private async seedProducts() {
    const existingProducts = await this.productRepository.count();
    if (existingProducts > 0) {
      this.logger.log('📦 Products already exist, skipping...');
      return;
    }

    const products = [
      {
        id: 'product-tercera',
        name: 'Pack Tercera División',
        description: 'Comienza tu aventura con jugadores básicos',
        type: 'character_pack',
        isActive: true,
      },
      {
        id: 'product-segunda',
        name: 'Pack Segunda División',
        description: 'Jugadores intermedios con mejores estadísticas',
        type: 'character_pack',
        isActive: true,
      },
      {
        id: 'product-primera',
        name: 'Pack Primera División',
        description: 'Jugadores de élite para gamers profesionales',
        type: 'character_pack',
        isActive: true,
      },
    ];

    for (const productData of products) {
      await this.productRepository.save(productData);
    }

    // Seed product variants
    const variants = [
      // Tercera División
      { productId: 'product-tercera', division: 'tercera', level: 1, price: '30.00' },
      { productId: 'product-tercera', division: 'tercera', level: 2, price: '58.00' },
      { productId: 'product-tercera', division: 'tercera', level: 3, price: '84.00' },
      { productId: 'product-tercera', division: 'tercera', level: 4, price: '108.00' },
      { productId: 'product-tercera', division: 'tercera', level: 5, price: '130.00' },
      
      // Segunda División
      { productId: 'product-segunda', division: 'segunda', level: 1, price: '200.00' },
      { productId: 'product-segunda', division: 'segunda', level: 2, price: '380.00' },
      { productId: 'product-segunda', division: 'segunda', level: 3, price: '555.00' },
      { productId: 'product-segunda', division: 'segunda', level: 4, price: '710.00' },
      { productId: 'product-segunda', division: 'segunda', level: 5, price: '850.00' },
      
      // Primera División
      { productId: 'product-primera', division: 'primera', level: 1, price: '1000.00' },
      { productId: 'product-primera', division: 'primera', level: 2, price: '1900.00' },
      { productId: 'product-primera', division: 'primera', level: 3, price: '2775.00' },
      { productId: 'product-primera', division: 'primera', level: 4, price: '3600.00' },
      { productId: 'product-primera', division: 'primera', level: 5, price: '5000.00' },
    ];

    for (const variantData of variants) {
      await this.variantRepository.save({
        productId: variantData.productId,
        name: `Pack ${variantData.division.charAt(0).toUpperCase() + variantData.division.slice(1)} División - Nivel ${variantData.level}`,
        description: `Pack de jugadores de ${variantData.division} división nivel ${variantData.level}`,
        division: variantData.division,
        level: variantData.level,
        priceUSDT: variantData.price,
        isActive: true,
        gachaPoolId: `pool_${variantData.division}`,
      });
    }

    this.logger.log('📦 Products and variants seeded');
  }

  private async seedGachaPools() {
    const existingPools = await this.poolRepository.count();
    if (existingPools > 0) {
      this.logger.log('🎲 Gacha pools already exist, skipping...');
      return;
    }

    const pools = [
      {
        id: 'pool_tercera',
        name: 'Pool Tercera División',
        division: 'tercera',
        isActive: true,
        antiDuplicatePolicy: 'EXCLUDE_OWNED_AT_DRAW',
        guaranteedRarity: 'common',
      },
      {
        id: 'pool_segunda',
        name: 'Pool Segunda División',
        division: 'segunda',
        isActive: true,
        antiDuplicatePolicy: 'EXCLUDE_OWNED_AT_DRAW',
        guaranteedRarity: 'uncommon',
      },
      {
        id: 'pool_primera',
        name: 'Pool Primera División',
        division: 'primera',
        isActive: true,
        antiDuplicatePolicy: 'EXCLUDE_OWNED_AT_DRAW',
        guaranteedRarity: 'rare',
      },
    ];

    for (const poolData of pools) {
      await this.poolRepository.save(poolData);
    }

    this.logger.log('🎲 Gacha pools seeded');
  }

  private async seedGachaPlayers() {
    const existingPlayers = await this.playerRepository.count();
    if (existingPlayers > 0) {
      this.logger.log('👤 Gacha players already exist, skipping...');
      return;
    }

    for (const playerData of REAL_PLAYERS_DATA) {
      // Create player for each division they support
      for (const division of playerData.divisions) {
        const divisionKey = division.toLowerCase() === 'first' ? 'primera' :
                           division.toLowerCase() === 'second' ? 'segunda' : 'tercera';
        
        const statsKey = division.toLowerCase() === 'first' ? 'first' :
                        division.toLowerCase() === 'second' ? 'second' : 'third';
        
        const stats = playerData.statsByDivision[statsKey];
        
        await this.playerRepository.save({
          name: playerData.name,
          position: playerData.position,
          rarity: playerData.rarity,
          division: divisionKey,
          baseStats: JSON.stringify({
            speed: stats.speed,
            shooting: stats.shooting,
            passing: stats.passing,
            defending: stats.defense,
            goalkeeping: stats.goalkeeping,
            overall: Math.floor((stats.speed + stats.shooting + stats.passing + stats.defense + stats.goalkeeping) / 5),
          }),
          imageUrl: playerData.imageUrl,
        });
      }
    }

    this.logger.log('👤 Gacha players seeded');
  }

  private async seedPoolEntries() {
    const existingEntries = await this.poolEntryRepository.count();
    if (existingEntries > 0) {
      this.logger.log('🔗 Pool entries already exist, skipping...');
      return;
    }

    const pools = await this.poolRepository.find();
    
    for (const pool of pools) {
      const players = await this.playerRepository.find({
        where: { division: pool.division }
      });

      for (const player of players) {
        // Set weight based on rarity
        const weights = {
          legendary: 1,
          epic: 5,
          rare: 15,
          uncommon: 30,
          common: 49,
        };

        const weight = weights[player.rarity] || 25;

        await this.poolEntryRepository.save({
          poolId: pool.id,
          playerId: player.id,
          weight,
          isActive: true,
        });
      }
    }

    this.logger.log('🔗 Pool entries seeded');
  }
}