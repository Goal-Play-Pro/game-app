import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { GachaPoolEntry } from './gacha-pool-entry.entity';
import { OwnedPlayer } from './owned-player.entity';

@Entity('gacha_players')
export class GachaPlayer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  position: string;

  @Column()
  rarity: string;

  @Column()
  division: string;

  @Column({ type: 'text' })
  baseStats: any;

  @Column({ nullable: true })
  imageUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => GachaPoolEntry, entry => entry.player)
  poolEntries: GachaPoolEntry[];

  @OneToMany(() => OwnedPlayer, ownedPlayer => ownedPlayer.player)
  ownedPlayers: OwnedPlayer[];
}