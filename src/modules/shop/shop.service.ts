import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../database/entities/product.entity';
import { ProductVariant } from '../../database/entities/product-variant.entity';

@Injectable()
export class ShopService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
  ) {}

  async getProducts() {
    return this.productRepository.find({
      where: { isActive: true },
      order: { createdAt: 'ASC' }
    });
  }
  
  async getProductById(productId: string) {
    const product = await this.productRepository.findOne({
      where: { id: productId, isActive: true }
    });
    
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }
    
    return product;
  }

  async getProductVariants(productId: string) {
    // Verify product exists
    await this.getProductById(productId);
    
    return this.variantRepository.find({
      where: { 
        productId, 
        isActive: true 
      },
      order: { level: 'ASC' }
    });
  }
}