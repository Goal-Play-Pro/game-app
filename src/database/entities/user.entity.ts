import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Wallet } from './wallet.entity';
import { Order } from './order.entity';
import { OwnedPlayer } from './owned-player.entity';
import { PenaltySession } from './penalty-session.entity';
import { LedgerEntry } from './ledger-entry.entity';
import { ReferralCode } from './referral-code.entity';
import { TIMESTAMP_COLUMN_TYPE } from '../database.constants';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  walletAddress: string;

  @Column({ unique: true, nullable: true })
  walletAddressCaip10: string | null;

  @Column()
  chain: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: TIMESTAMP_COLUMN_TYPE as 'timestamptz' | 'datetime', nullable: true })
  lastLogin: Date;

  @Column({ type: 'text', nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Wallet, wallet => wallet.user)
  wallets: Wallet[];

  @OneToMany(() => Order, order => order.user)
  orders: Order[];

  @OneToMany(() => OwnedPlayer, ownedPlayer => ownedPlayer.user)
  ownedPlayers: OwnedPlayer[];

  @OneToMany(() => PenaltySession, session => session.hostUser)
  hostedSessions: PenaltySession[];

  @OneToMany(() => PenaltySession, session => session.guestUser)
  guestSessions: PenaltySession[];

  @OneToMany(() => LedgerEntry, entry => entry.user)
  ledgerEntries: LedgerEntry[];

  @OneToMany(() => ReferralCode, code => code.user)
  referralCodes: ReferralCode[];
}
