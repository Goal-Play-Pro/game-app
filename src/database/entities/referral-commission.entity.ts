import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Order } from './order.entity';
import { ReferralCode } from './referral-code.entity';
import { TIMESTAMP_COLUMN_TYPE } from '../database.constants';

@Entity('referral_commissions')
export class ReferralCommission {
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
  orderId: string;

  @Column()
  referralCode: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  orderAmount: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  commissionAmount: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 5.0 })
  commissionPercentage: number;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: TIMESTAMP_COLUMN_TYPE as 'timestamptz' | 'datetime', nullable: true })
  paidAt: Date;

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

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ManyToOne(() => ReferralCode, code => code.commissions)
  @JoinColumn({ name: 'referralCode', referencedColumnName: 'code' })
  referralCodeEntity: ReferralCode;
}
