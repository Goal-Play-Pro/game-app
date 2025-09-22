import { Controller, Get, Post, Put, Param, Body, UseGuards, Request, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateOrderDto } from './dto/order.dto';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create new order' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Order created successfully' })
  async createOrder(@Body() dto: CreateOrderDto, @Request() req: any) {
    return this.orderService.createOrder(req.user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user orders' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Orders retrieved successfully' })
  async getUserOrders(@Request() req: any) {
    return this.orderService.getUserOrders(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Order retrieved successfully' })
  async getOrderById(@Param('id') id: string, @Request() req: any) {
    return this.orderService.getOrderById(id, req.user.sub);
  }

  @Get(':id/payment-status')
  @ApiOperation({ summary: 'Get order payment status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Payment status retrieved successfully' })
  async getPaymentStatus(@Param('id') id: string, @Request() req: any) {
    return this.orderService.getPaymentStatus(id, req.user.sub);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Order cancelled successfully' })
  async cancelOrder(@Param('id') id: string, @Request() req: any) {
    return this.orderService.cancelOrder(id, req.user.sub);
  }

  @Post(':id/payment-completed')
  @ApiOperation({ summary: 'Notify payment completion with transaction hash' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Payment notification processed' })
  async notifyPaymentCompleted(
    @Param('id') id: string, 
    @Body() paymentData: { transactionHash: string },
    @Request() req: any
  ) {
    return this.orderService.processPaymentNotification(id, paymentData.transactionHash, req.user.sub);
  }
}