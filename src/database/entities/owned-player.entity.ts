import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { GachaPlayer } from './gacha-player.entity';
import { Order } from './order.entity';
import { GachaDraw } from './gacha-draw.entity';
import { PlayerKit } from './player-kit.entity';
import { PenaltySession } from './penalty-session.entity';

@Entity('owned_players')
export class OwnedPlayer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  playerId: string;

  @Column({ nullable: true })
  sourceOrderId: string;

  @Column({ nullable: true })
  sourceDrawId: string;

  @Column({ type: 'datetime' })
  acquiredAt: Date;

  @Column({ default: 1 })
  currentLevel: number;

  @Column({ default: 0 })
  experience: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  division: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.ownedPlayers)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => GachaPlayer, player => player.ownedPlayers)
  @JoinColumn({ name: 'playerId' })
  player: GachaPlayer;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'sourceOrderId' })
  sourceOrder: Order;

  @ManyToOne(() => GachaDraw, draw => draw.ownedPlayers)
  @JoinColumn({ name: 'sourceDrawId' })
  sourceDraw: GachaDraw;

  @OneToMany(() => PlayerKit, kit => kit.ownedPlayer)
  kits: PlayerKit[];

  @OneToMany(() => PenaltySession, session => session.hostPlayer)
  hostedSessions: PenaltySession[];

  @OneToMany(() => PenaltySession, session => session.guestPlayer)
  guestSessions: PenaltySession[];
}