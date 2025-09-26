import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { OwnedPlayer } from './owned-player.entity';
import { TIMESTAMP_COLUMN_TYPE } from '../database.constants';

@Entity('player_kits')
export class PlayerKit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ownedPlayerId: string;

  @Column()
  version: number;

  @Column()
  name: string;

  @Column()
  primaryColor: string;

  @Column()
  secondaryColor: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: TIMESTAMP_COLUMN_TYPE as 'timestamptz' | 'datetime', nullable: true })
  equippedAt: Date;

  @Column({ type: TIMESTAMP_COLUMN_TYPE as 'timestamptz' | 'datetime', nullable: true })
  unequippedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => OwnedPlayer, ownedPlayer => ownedPlayer.kits)
  @JoinColumn({ name: 'ownedPlayerId' })
  ownedPlayer: OwnedPlayer;
}
