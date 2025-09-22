import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { GachaPoolEntry } from './gacha-pool-entry.entity';
import { GachaDraw } from './gacha-draw.entity';

@Entity('gacha_pools')
export class GachaPool {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  division: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  antiDuplicatePolicy: string;

  @Column({ nullable: true })
  guaranteedRarity: string;

  @Column({ type: 'text', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => GachaPoolEntry, entry => entry.pool)
  entries: GachaPoolEntry[];

  @OneToMany(() => GachaDraw, draw => draw.pool)
  draws: GachaDraw[];
}