import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { TIMESTAMP_COLUMN_TYPE } from '../database.constants';
import { ReferralCode } from './referral-code.entity';

@Entity('referral_registrations')
export class ReferralRegistration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  referrerUserId: string;

  @Column()
  referrerWallet: string;

  @Column()
  referredUserId: string;

  @Column()
  referredWallet: string;

  @Column()
  referralCode: string;

  @Column({ type: TIMESTAMP_COLUMN_TYPE as 'timestamptz' | 'datetime' })
  registeredAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'referrerUserId' })
  referrer: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'referredUserId' })
  referred: User;

  @ManyToOne(() => ReferralCode, code => code.registrations)
  @JoinColumn({ name: 'referralCode', referencedColumnName: 'code' })
  referralCodeEntity: ReferralCode;
}
