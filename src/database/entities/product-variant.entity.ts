import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Product } from './product.entity';
import { Order } from './order.entity';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  division: string;

  @Column()
  level: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceUSDT: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  maxPurchasesPerUser: number;

  @Column()
  gachaPoolId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Product, product => product.variants)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @OneToMany(() => Order, order => order.productVariant)
  orders: Order[];
}