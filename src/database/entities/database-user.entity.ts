import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/types/base.types';
import { Wallet } from '../../modules/wallet/entities/wallet.entity';

@Entity('users')
@Index(['wallet_address'], { unique: true })
@Index(['chain'])
@Index(['is_active'])
@Index(['last_login'])
export class User implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'wallet_address', unique: true })
  walletAddress!: string;

  @Column({ default: 'ethereum' })
  chain!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'last_login', type: 'timestamptz', nullable: true })
  lastLogin?: Date;

  @Column({ 
    type: 'jsonb', 
    default: { preferences: { language: 'en', notifications: true } }
  })
  metadata!: {
    nickname?: string;
    avatar?: string;
    preferences: {
      language: string;
      notifications: boolean;
    };
  };

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  // Relations
  @OneToMany(() => Wallet, wallet => wallet.user)
  wallets?: Wallet[];
}