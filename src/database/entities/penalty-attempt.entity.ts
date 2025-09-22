import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PenaltySession } from './penalty-session.entity';

@Entity('penalty_attempts')
export class PenaltyAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  @Column()
  round: number;

  @Column()
  shooterUserId: string;

  @Column()
  goalkeeperId: string;

  @Column()
  shooterPlayerId: string;

  @Column()
  goalkeeperPlayerId: string;

  @Column()
  direction: string;

  @Column()
  power: number;

  @Column()
  keeperDirection: string;

  @Column()
  isGoal: boolean;

  @Column({ type: 'datetime' })
  attemptedAt: Date;

  @Column()
  seed: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => PenaltySession, session => session.attempts)
  @JoinColumn({ name: 'sessionId' })
  session: PenaltySession;
}