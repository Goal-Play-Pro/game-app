import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('ledger_entries')
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  transactionId: string;

  @Column()
  account: string;

  @Column()
  type: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  amount: string;

  @Column()
  currency: string;

  @Column()
  description: string;

  @Column()
  referenceType: string;

  @Column()
  referenceId: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  balanceAfter: string;

  @Column({ type: 'text', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.ledgerEntries)
  @JoinColumn({ name: 'userId' })
  user: User;
}