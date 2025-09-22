import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { ProductVariant } from './product-variant.entity';
import { GachaDraw } from './gacha-draw.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  productVariantId: string;

  @Column()
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPriceUSDT: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPriceUSDT: string;

  @Column()
  status: string;

  @Column()
  paymentWallet: string;

  @Column()
  receivingWallet: string;

  @Column()
  chainType: string;

  @Column({ nullable: true })
  transactionHash: string;

  @Column({ type: 'bigint', nullable: true })
  blockNumber: number;

  @Column({ nullable: true })
  confirmations: number;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  fulfilledAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt: Date;

  @Column({ type: 'text', nullable: true })
  metadata: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.orders)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => ProductVariant, variant => variant.orders)
  @JoinColumn({ name: 'productVariantId' })
  productVariant: ProductVariant;

  @OneToMany(() => GachaDraw, draw => draw.order)
  gachaDraws: GachaDraw[];
}