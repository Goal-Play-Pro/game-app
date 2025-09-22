import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { OwnedPlayer } from './owned-player.entity';
import { PenaltyAttempt } from './penalty-attempt.entity';

@Entity('penalty_sessions')
export class PenaltySession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  hostUserId: string;

  @Column({ nullable: true })
  guestUserId: string;

  @Column()
  type: string;

  @Column()
  status: string;

  @Column()
  hostPlayerId: string;

  @Column({ nullable: true })
  guestPlayerId: string;

  @Column()
  maxRounds: number;

  @Column({ default: 1 })
  currentRound: number;

  @Column({ default: 0 })
  hostScore: number;

  @Column({ default: 0 })
  guestScore: number;

  @Column({ nullable: true })
  winnerId: string;

  @Column()
  seed: string;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.hostedSessions)
  @JoinColumn({ name: 'hostUserId' })
  hostUser: User;

  @ManyToOne(() => User, user => user.guestSessions)
  @JoinColumn({ name: 'guestUserId' })
  guestUser: User;

  @ManyToOne(() => OwnedPlayer, player => player.hostedSessions)
  @JoinColumn({ name: 'hostPlayerId' })
  hostPlayer: OwnedPlayer;

  @ManyToOne(() => OwnedPlayer, player => player.guestSessions)
  @JoinColumn({ name: 'guestPlayerId' })
  guestPlayer: OwnedPlayer;

  @OneToMany(() => PenaltyAttempt, attempt => attempt.session)
  attempts: PenaltyAttempt[];
}