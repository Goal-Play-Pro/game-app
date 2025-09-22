import { Controller, Get, Param, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ShopService } from './shop.service';

@ApiTags('shop')
@Controller()
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('products')
  @ApiOperation({ summary: 'Get all active products' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Products retrieved successfully' })
  async getProducts() {
    return this.shopService.getProducts();
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Product retrieved successfully' })
  async getProductById(@Param('id') id: string) {
    return this.shopService.getProductById(id);
  }

  @Get('products/:id/variants')
  @ApiOperation({ summary: 'Get product variants by product ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Product variants retrieved successfully' })
  async getProductVariants(@Param('id') productId: string) {
    return this.shopService.getProductVariants(productId);
  }
}