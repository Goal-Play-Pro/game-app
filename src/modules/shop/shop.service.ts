import { Injectable, NotFoundException } from '@nestjs/common';
import { getBasePrice } from '../../config/pricing.config';
import { DataAdapterService } from '../../common/services/data-adapter.service';
import { Product, ProductVariant } from './entities/product.entity';
import { CreateProductDto, CreateProductVariantDto } from './dto/shop.dto';
import { Division, ProductType } from '../../common/types/base.types';

@Injectable()
export class ShopService {
  constructor(private dataAdapter: DataAdapterService) {}

  async findAllProducts(): Promise<Product[]> {
    const products = await this.dataAdapter.findAll<Product>('products');
    return products.filter((p: Product) => p.isActive);
  }

  async findProductById(id: string): Promise<Product> {
    const product = await this.dataAdapter.findById<Product>('products', id);
    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async findProductVariants(productId: string): Promise<ProductVariant[]> {
    const product = await this.findProductById(productId);
    const variants = await this.dataAdapter.findAll<ProductVariant>('product-variants');
    return variants.filter((v: ProductVariant) => v.productId === productId && v.isActive);
  }

  async findVariantById(id: string): Promise<ProductVariant> {
    const variant = await this.dataAdapter.findById<ProductVariant>('product-variants', id);
    if (!variant || !variant.isActive) {
      throw new NotFoundException('Product variant not found');
    }
    return variant;
  }

  async createProduct(dto: CreateProductDto): Promise<Product> {
    return this.dataAdapter.create('products', {
      ...dto,
      isActive: dto.isActive ?? true,
    });
  }

  async createProductVariant(productId: string, dto: CreateProductVariantDto): Promise<ProductVariant> {
    await this.findProductById(productId); // Validate product exists
    
    // Validate price matches the expected price for division and level
    const expectedPrice = getBasePrice(dto.division, dto.level);
    const providedPrice = parseFloat(dto.priceUSDT);
    
    if (Math.abs(providedPrice - expectedPrice) > 0.01) {
      throw new BadRequestException(
        `Invalid price. Expected $${expectedPrice} for ${dto.division} division level ${dto.level}, got $${providedPrice}`
      );
    }
    
    return this.dataAdapter.create('product-variants', {
      ...dto,
      productId,
      isActive: dto.isActive ?? true,
    });
  }
}