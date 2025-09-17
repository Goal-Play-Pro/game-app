import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity, ChainType } from '../../common/types/base.types';
import { User } from './database-user.entity';

@Entity('wallets')
@Index(['user_id'])
@Index(['address'], { unique: true })
@Index(['chain_type'])
@Index(['is_primary'])
@Index(['is_active'])
export class Wallet implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column({ unique: true })
  address!: string;

  @Column({ name: 'chain_type', type: 'enum', enum: ChainType, default: ChainType.ETHEREUM })
  chainType!: ChainType;

  @Column({ name: 'is_primary', default: false })
  isPrimary!: boolean;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'linked_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  linkedAt!: string;

  @Column({ name: 'last_used_at', type: 'timestamptz', nullable: true })
  lastUsedAt?: string;

  @Column({ type: 'jsonb', default: {} })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => User, user => user.wallets)
  @JoinColumn({ name: 'user_id' })
  user?: User;
}