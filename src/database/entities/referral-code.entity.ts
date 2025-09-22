import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { ReferralRegistration } from './referral-registration.entity';
import { ReferralCommission } from './referral-commission.entity';

@Entity('referral_codes')
export class ReferralCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  walletAddress: string;

  @Column({ unique: true })
  code: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  totalReferrals: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: '0' })
  totalCommissions: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.referralCodes)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => ReferralRegistration, registration => registration.referralCode)
  registrations: ReferralRegistration[];

  @OneToMany(() => ReferralCommission, commission => commission.referralCode)
  commissions: ReferralCommission[];
}