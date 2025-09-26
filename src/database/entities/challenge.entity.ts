import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { TIMESTAMP_COLUMN_TYPE } from '../database.constants';

@Entity('challenges')
export class Challenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nonce: string;

  @Column()
  address: string;

  @Column()
  chainType: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: TIMESTAMP_COLUMN_TYPE as 'timestamptz' | 'datetime' })
  expiresAt: Date;

  @Column({ default: false })
  used: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
