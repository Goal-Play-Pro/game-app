import { BaseEntity, ProductType, Division } from '@common/types/base.types';
import Decimal from 'decimal.js';

export interface Product extends BaseEntity {
  name: string;
  description: string;
  type: ProductType;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface ProductVariant extends BaseEntity {
  productId: string;
  name: string;
  description: string;
  division: Division;
  level: number;
  priceUSDT: string; // Decimal as string
  isActive: boolean;
  maxPurchasesPerUser?: number;
  gachaPoolId: string;
  metadata?: Record<string, any>;
}