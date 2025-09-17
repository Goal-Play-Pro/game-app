import { Controller, Get, Post, Put, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Idempotent } from '@common/decorators/idempotent.decorator';
import { OrderService } from './order.service';
import { CreateOrderDto, OrderDto, PaymentStatusDto } from './dto/order.dto';
import { OrderStatus } from '@common/types/base.types';

@ApiTags('order')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @ApiOperation({ summary: 'Get user orders' })
  @ApiResponse({ status: 200, description: 'Orders retrieved', type: [OrderDto] })
  async getUserOrders(@Request() req: any): Promise<OrderDto[]> {
    return this.orderService.findUserOrders(req.user.userId);
  }

  @Post()
  @Idempotent()
  @ApiOperation({ summary: 'Create new order' })
  @ApiResponse({ status: 201, description: 'Order created', type: OrderDto })
  async createOrder(@Request() req: any, @Body() dto: CreateOrderDto): Promise<OrderDto> {
    return this.orderService.createOrder(req.user.userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved', type: OrderDto })
  async getOrder(@Param('id') id: string): Promise<OrderDto> {
    return this.orderService.findOrderById(id);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel pending order' })
  @ApiResponse({ status: 200, description: 'Order cancelled', type: OrderDto })
  async cancelOrder(@Request() req: any, @Param('id') id: string): Promise<OrderDto> {
    return this.orderService.cancelOrder(req.user.userId, id);
  }

  @Get(':id/payment-status')
  @ApiOperation({ summary: 'Check payment status' })
  @ApiResponse({ status: 200, description: 'Payment status', type: PaymentStatusDto })
  async getPaymentStatus(@Param('id') id: string): Promise<PaymentStatusDto> {
    const order = await this.orderService.findOrderById(id);
    
    return {
      status: order.status,
      transactionHash: order.transactionHash,
      confirmations: order.confirmations,
      requiredConfirmations: 12,
      estimatedConfirmationTime: order.status === OrderStatus.PENDING ? '5-10 minutes' : undefined,
    };
  }
}