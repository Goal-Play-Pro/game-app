import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/types/base.types';

@Entity('challenges')
@Index(['address', 'expires_at'])
@Index(['nonce'])
export class Challenge implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  nonce!: string;

  @Column()
  address!: string;

  @Column({ name: 'chain_type', default: 'ethereum' })
  chainType!: string;

  @Column('text')
  message!: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ default: false })
  used!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

@Entity('idempotency_keys')
@Index(['key'])
@Index(['user_id'])
@Index(['expires_at'])
export class IdempotencyKey implements BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  key!: string;

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @Column('jsonb')
  response!: any;

  @Column({ 
    name: 'expires_at', 
    type: 'timestamptz',
    default: () => "now() + interval '24 hours'"
  })
  expiresAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

@Entity('audit_logs')
@Index(['user_id'])
@Index(['action'])
@Index(['resource_type'])
@Index(['created_at'])
@Index(['correlation_id'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', nullable: true })
  userId?: string;

  @Column()
  action!: string;

  @Column({ name: 'resource_type' })
  resourceType!: string;

  @Column({ name: 'resource_id', nullable: true })
  resourceId?: string;

  @Column({ name: 'old_values', type: 'jsonb', nullable: true })
  oldValues?: any;

  @Column({ name: 'new_values', type: 'jsonb', nullable: true })
  newValues?: any;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent?: string;

  @Column({ name: 'correlation_id', nullable: true })
  correlationId?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}