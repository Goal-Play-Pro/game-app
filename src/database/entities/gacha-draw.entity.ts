import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Order } from './order.entity';
import { GachaPool } from './gacha-pool.entity';
import { OwnedPlayer } from './owned-player.entity';

@Entity('gacha_draws')
export class GachaDraw {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  orderId: string;

  @Column()
  poolId: string;

  @Column({ type: 'simple-array' })
  playersDrawn: string[];

  @Column()
  seed: string;

  @Column({ type: 'timestamptz' })
  drawDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Order, order => order.gachaDraws)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ManyToOne(() => GachaPool, pool => pool.draws)
  @JoinColumn({ name: 'poolId' })
  pool: GachaPool;

  @OneToMany(() => OwnedPlayer, ownedPlayer => ownedPlayer.sourceDraw)
  ownedPlayers: OwnedPlayer[];
}