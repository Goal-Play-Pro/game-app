export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export enum Chain {
  ETHEREUM = 'ethereum',
  POLYGON = 'polygon',
  BSC = 'bsc',
  ARBITRUM = 'arbitrum',
  SOLANA = 'solana',
}

export enum ChainType {
  ETHEREUM = 'ethereum',
  POLYGON = 'polygon',
  BSC = 'bsc',
  ARBITRUM = 'arbitrum',
  SOLANA = 'solana',
}

export enum ProductType {
  CHARACTER_PACK = 'character_pack',
  COSMETIC = 'cosmetic',
  BOOST = 'boost',
}

export enum Division {
  PRIMERA = 'primera',
  SEGUNDA = 'segunda',
  TERCERA = 'tercera',
}

export enum Position {
  GOALKEEPER = 'goalkeeper',
  DEFENDER = 'defender',
  MIDFIELDER = 'midfielder',
  FORWARD = 'forward',
}

export enum Rarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export enum SessionType {
  SINGLE_PLAYER = 'single_player',
  MULTIPLAYER = 'multiplayer',
}

export enum SessionStatus {
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class BaseDto {
  id!: string;
  createdAt!: Date;
  updatedAt!: Date;
}

// Extended interfaces for specific entities
export interface UserEntity extends BaseEntity {
  walletAddress: string;
  chain: string;
  isActive: boolean;
  lastLogin?: Date;
  metadata?: any;
}

export interface ProductEntity extends BaseEntity {
  name: string;
  description: string;
  type: string;
  isActive: boolean;
  metadata?: any;
}

export interface ProductVariantEntity extends BaseEntity {
  productId: string;
  name: string;
  description: string;
  division: string;
  level: number;
  priceUSDT: string;
  isActive: boolean;
  maxPurchasesPerUser?: number;
  gachaPoolId: string;
}

export interface OrderEntity extends BaseEntity {
  userId: string;
  productVariantId: string;
  quantity: number;
  unitPriceUSDT: string;
  totalPriceUSDT: string;
  status: string;
  paymentWallet: string;
  receivingWallet: string;
  chainType: string;
  transactionHash?: string;
  blockNumber?: number;
  confirmations?: number;
  expiresAt: string;
  paidAt?: string;
  fulfilledAt?: string;
  cancelledAt?: string;
}

export interface OwnedPlayerEntity extends BaseEntity {
  userId: string;
  playerId: string;
  sourceOrderId?: string;
  sourceDrawId?: string;
  acquiredAt: string;
  currentLevel: number;
  experience: number;
  isActive: boolean;
  division?: string;
}

export interface GachaPlayerEntity extends BaseEntity {
  name: string;
  position: string;
  rarity: string;
  division: string;
  baseStats: any;
  imageUrl?: string;
}

export interface PenaltySessionEntity extends BaseEntity {
  hostUserId: string;
  guestUserId?: string;
  type: string;
  status: string;
  hostPlayerId: string;
  guestPlayerId?: string;
  maxRounds: number;
  currentRound: number;
  hostScore: number;
  guestScore: number;
  winnerId?: string;
  seed: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ChallengeEntity extends BaseEntity {
  nonce: string;
  address: string;
  chainType: string;
  message: string;
  expiresAt: Date;
  used: boolean;
}

export interface ReferralCodeEntity extends BaseEntity {
  userId: string;
  walletAddress: string;
  code: string;
  isActive: boolean;
  totalReferrals: number;
  totalCommissions: string;
}

export enum GameDivision {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
}

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FULFILLED = 'fulfilled',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}
