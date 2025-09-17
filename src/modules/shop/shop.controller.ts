import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { ShopService } from './shop.service';
import { ProductDto, ProductVariantDto, CreateProductDto, CreateProductVariantDto } from './dto/shop.dto';

@ApiTags('shop')
@Controller('products')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active products' })
  @ApiResponse({ status: 200, description: 'Products retrieved', type: [ProductDto] })
  async getProducts(): Promise<ProductDto[]> {
    return this.shopService.findAllProducts();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product retrieved', type: ProductDto })
  async getProduct(@Param('id') id: string): Promise<ProductDto> {
    return this.shopService.findProductById(id);
  }

  @Get(':id/variants')
  @ApiOperation({ summary: 'Get product variants' })
  @ApiResponse({ status: 200, description: 'Variants retrieved', type: [ProductVariantDto] })
  async getProductVariants(@Param('id') id: string): Promise<ProductVariantDto[]> {
    return this.shopService.findProductVariants(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new product (Admin only)' })
  @ApiResponse({ status: 201, description: 'Product created', type: ProductDto })
  async createProduct(@Body() dto: CreateProductDto): Promise<ProductDto> {
    return this.shopService.createProduct(dto);
  }

  @Post(':id/variants')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create product variant (Admin only)' })
  @ApiResponse({ status: 201, description: 'Variant created', type: ProductVariantDto })
  async createVariant(
    @Param('id') productId: string,
    @Body() dto: CreateProductVariantDto
  ): Promise<ProductVariantDto> {
    return this.shopService.createProductVariant(productId, dto);
  }
}