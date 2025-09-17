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

export enum TransactionType {
  DEBIT = 'debit',
  CREDIT = 'credit',
}

export class BaseDto {
  id!: string;
  createdAt!: Date;
  updatedAt!: Date;
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
