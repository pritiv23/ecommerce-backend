import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
  ) {}

  // ============================================
  // CUSTOMER: Create order from cart
  // ============================================

  @UseGuards(JwtAuthGuard)
  @Post()
  createOrder(
    @Request() request: { user: { id: string } },
  ) {
    return this.ordersService.createOrder(
      request.user.id,
    );
  }

  // ============================================
  // CUSTOMER: Get my orders
  // ============================================

  @UseGuards(JwtAuthGuard)
  @Get()
  getMyOrders(
    @Request() request: { user: { id: string } },
  ) {
    return this.ordersService.getMyOrders(
      request.user.id,
    );
  }

  // ============================================
  // ADMIN: Get all orders
  // ============================================

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/all')
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }

  // ============================================
  // ADMIN: Update order status
  // ============================================

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('admin/:id/status')
  updateOrderStatus(
    @Param('id') orderId: string,
    @Body()
    updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(
      orderId,
      updateOrderStatusDto.status,
    );
  }

  // ============================================
  // CUSTOMER: Get one specific order
  // ============================================

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getOrder(
    @Param('id') orderId: string,
    @Request() request: { user: { id: string } },
  ) {
    return this.ordersService.getOrder(
      orderId,
      request.user.id,
    );
  }

  // ============================================
  // CUSTOMER: Cancel my order
  // ============================================

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  cancelOrder(
    @Param('id') orderId: string,
    @Request() request: { user: { id: string } },
  ) {
    return this.ordersService.cancelOrder(
      orderId,
      request.user.id,
    );
  }
}