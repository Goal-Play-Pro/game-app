import { BaseEntity, OrderStatus, ChainType } from '@common/types/base.types';

export interface Order extends BaseEntity {
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
  failureReason?: string;
  metadata?: Record<string, any>;
}