import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { TIMESTAMP_COLUMN_TYPE } from '../database.constants';

@Entity('idempotency_keys')
export class IdempotencyKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string;

  @Column()
  userId: string;

  @Column({ type: 'text' })
  response: string;

  @Column({ type: TIMESTAMP_COLUMN_TYPE as 'timestamptz' | 'datetime' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
