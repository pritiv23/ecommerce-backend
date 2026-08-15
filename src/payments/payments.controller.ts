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

import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  // CUSTOMER: Create a payment
  @UseGuards(JwtAuthGuard)
  @Post(':orderId')
  createPayment(
    @Param('orderId') orderId: string,
    @Body() createPaymentDto: CreatePaymentDto,
  ) {
    return this.paymentsService.createPayment(
      orderId,
      createPaymentDto.paymentMethod,
    );
  }

  // CUSTOMER: View my payments
  @UseGuards(JwtAuthGuard)
  @Get()
  getMyPayments(
    @Request() request: { user: { id: string } },
  ) {
    return this.paymentsService.getMyPayments(
      request.user.id,
    );
  }

  // ADMIN: View all payments
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/all')
  getAllPayments() {
    return this.paymentsService.getAllPayments();
  }

  // CUSTOMER: View own payment
  // ADMIN: View any payment
  @UseGuards(JwtAuthGuard)
  @Get(':paymentId')
  getPayment(
    @Param('paymentId') paymentId: string,
    @Request()
    request: { user: { id: string; role: string } },
  ) {
    return this.paymentsService.getPayment(
      paymentId,
      request.user.id,
      request.user.role === 'ADMIN',
    );
  }

  // ADMIN: Process payment
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':paymentId/process')
  processPayment(
    @Param('paymentId') paymentId: string,
  ) {
    return this.paymentsService.processPayment(
      paymentId,
    );
  }

  // ADMIN: Mark payment as failed
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':paymentId/fail')
  failPayment(
    @Param('paymentId') paymentId: string,
  ) {
    return this.paymentsService.failPayment(
      paymentId,
    );
  }

  // ADMIN: Refund payment
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':paymentId/refund')
  refundPayment(
    @Param('paymentId') paymentId: string,
  ) {
    return this.paymentsService.refundPayment(
      paymentId,
    );
  }
}