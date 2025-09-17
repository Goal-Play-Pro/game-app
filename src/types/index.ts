// API Response Types based on Football Gaming Platform Backend

export interface User {
  id: string;
  walletAddress: string;
  chain: string;
  isActive: boolean;
  lastLogin: Date;
  metadata: {
    nickname?: string;
    avatar?: string;
    preferences: {
      language: string;
      notifications: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Wallet {
  id: string;
  userId: string;
  address: string;
  chainType: ChainType;
  isPrimary: boolean;
  isActive: boolean;
  linkedAt: string;
  lastUsedAt?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  type: ProductType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  description: string;
  division: Division;
  level: number;
  priceUSDT: string;
  isActive: boolean;
  maxPurchasesPerUser?: number;
  gachaPoolId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  userId: string;
  productVariantId: string;
  quantity: number;
  unitPriceUSDT: string;
  totalPriceUSDT: string;
  status: OrderStatus;
  paymentWallet: string;
  receivingWallet: string;
  chainType: ChainType;
  transactionHash?: string;
  blockNumber?: number;
  confirmations?: number;
  expiresAt: string;
  paidAt?: string;
  fulfilledAt?: string;
  cancelledAt?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GachaPlayer {
  id: string;
  name: string;
  position: Position;
  rarity: Rarity;
  division: Division;
  baseStats: PlayerStats;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OwnedPlayer {
  id: string;
  userId: string;
  playerId: string;
  sourceOrderId?: string;
  sourceDrawId?: string;
  acquiredAt: string;
  currentLevel: number;
  experience: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerKit {
  id: string;
  ownedPlayerId: string;
  version: number;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  isActive: boolean;
  equippedAt?: string;
  unequippedAt?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PenaltySession {
  id: string;
  hostUserId: string;
  guestUserId?: string;
  type: SessionType;
  status: SessionStatus;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface PenaltyAttempt {
  id: string;
  sessionId: string;
  round: number;
  shooterUserId: string;
  goalkeeperId: string;
  shooterPlayerId: string;
  goalkeeperPlayerId: string;
  direction: PenaltyDirection;
  power: number;
  keeperDirection: PenaltyDirection;
  isGoal: boolean;
  attemptedAt: string;
  seed: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LedgerEntry {
  id: string;
  userId: string;
  transactionId: string;
  account: string;
  type: TransactionType;
  amount: string;
  currency: string;
  description: string;
  referenceType: string;
  referenceId: string;
  balanceAfter: string;
  createdAt: Date;
  updatedAt: Date;
}

// Enums
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

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FULFILLED = 'fulfilled',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
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

export enum PenaltyDirection {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
}

// Additional Types
export interface PlayerStats {
  speed: number;
  shooting: number;
  passing: number;
  defending: number;
  goalkeeping: number;
  overall: number;
}

// Division-related types
export interface DivisionConfig {
  name: string;
  maxPercentage: number;
  maxStats: number;
  startingPercentage: number;
  startingStats: number;
  description: string;
}

export interface StatsRange {
  min: number;
  max: number;
}

export interface PlayerProgression {
  ownedPlayerId: string;
  level: number;
  experience: number;
  requiredExperience: number;
  stats: PlayerStats;
  bonuses: PlayerStats;
  totalStats: PlayerStats;
}

export interface GameStats {
  totalUsers: number;
  totalGames: number;
  totalRewards: string;
  activeUsers: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Frontend specific types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// MetaMask types
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      isMetaMask?: boolean;
    };
  }
}

export interface GameSession {
  id: string;
  type: 'penalty' | 'training';
  status: 'waiting' | 'active' | 'completed';
  players: OwnedPlayer[];
  score: {
    user: number;
    opponent: number;
  };
  rounds: number;
  maxRounds: number;
}

// Additional types for NFT functionality
export interface NFT {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  currency: string;
  rarity: string;
  isForSale: boolean;
  isLiked: boolean;
  likes: number;
  views: number;
  creator: {
    id: string;
    displayName: string;
    avatar: string;
    isVerified: boolean;
  };
  owner: {
    id: string;
    displayName: string;
    avatar: string;
    isVerified: boolean;
  };
  collection: {
    id: string;
    name: string;
    image: string;
    isVerified: boolean;
  };
  blockchain: string;
  attributes: Array<{
    trait_type: string;
    value: string;
    rarity?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  image: string;
  banner: string;
  floorPrice: number;
  totalVolume: number;
  ownersCount: number;
  totalSupply: number;
  royalty: number;
  isVerified: boolean;
  blockchain: string;
  creator: {
    id: string;
    displayName: string;
    avatar: string;
    isVerified: boolean;
  };
  socialLinks?: {
    website?: string;
    discord?: string;
    twitter?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateNFTData {
  name: string;
  description: string;
  image: string | File;
  price: number;
  currency: string;
  category: string;
  tags: string[];
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  royalty: number;
  blockchain: string;
}

export interface FilterOptions {
  category?: string;
  rarity?: string[];
  blockchain?: string[];
  priceMin?: number;
  priceMax?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}