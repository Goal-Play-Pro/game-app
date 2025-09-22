import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { GachaPool } from './gacha-pool.entity';
import { GachaPlayer } from './gacha-player.entity';

@Entity('gacha_pool_entries')
export class GachaPoolEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  poolId: string;

  @Column()
  playerId: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 1.0 })
  weight: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => GachaPool, pool => pool.entries)
  @JoinColumn({ name: 'poolId' })
  pool: GachaPool;

  @ManyToOne(() => GachaPlayer, player => player.poolEntries)
  @JoinColumn({ name: 'playerId' })
  player: GachaPlayer;
}