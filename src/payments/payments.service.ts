import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMethod } from '../generated/prisma/enums';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // CREATE PAYMENT
  // ==========================================

  async createPayment(
    orderId: string,
    paymentMethod: PaymentMethod,
  ) {
    const order = await this.prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    // Cannot create payment for cancelled order
    if (order.status === 'CANCELLED') {
      throw new BadRequestException(
        'Cannot create payment for a cancelled order',
      );
    }

    // Cannot create payment for delivered order
    if (order.status === 'DELIVERED') {
      throw new BadRequestException(
        'Cannot create payment for a delivered order',
      );
    }

    if (order.paymentStatus === 'PAID') {
      throw new BadRequestException(
        'Order is already paid',
      );
    }

    const existingPayment =
      await this.prisma.payment.findUnique({
        where: {
          orderId,
        },
      });

    if (existingPayment) {
      throw new BadRequestException(
        'Payment already exists for this order',
      );
    }

    return this.prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.totalAmount,
        paymentMethod,
      },
    });
  }

  // ==========================================
  // PROCESS PAYMENT
  // ==========================================

  async processPayment(paymentId: string) {
    const payment =
      await this.prisma.payment.findUnique({
        where: {
          id: paymentId,
        },
        include: {
          order: true,
        },
      });

    if (!payment) {
      throw new BadRequestException(
        'Payment not found',
      );
    }

    if (payment.status === 'PAID') {
      throw new BadRequestException(
        'Payment is already completed',
      );
    }

    if (payment.status === 'REFUNDED') {
      throw new BadRequestException(
        'Refunded payment cannot be processed',
      );
    }

    // Cannot pay for cancelled order
    if (payment.order.status === 'CANCELLED') {
      throw new BadRequestException(
        'Cannot process payment for a cancelled order',
      );
    }

    // Cannot pay for delivered order
    if (payment.order.status === 'DELIVERED') {
      throw new BadRequestException(
        'Delivered order cannot accept payment',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const transactionId = `TXN-${Date.now()}`;

      const updatedPayment =
        await tx.payment.update({
          where: {
            id: paymentId,
          },
          data: {
            status: 'PAID',
            transactionId,
          },
        });

      await tx.order.update({
        where: {
          id: payment.orderId,
        },
        data: {
          paymentStatus: 'PAID',
        },
      });

      return updatedPayment;
    });
  }

  // ==========================================
  // FAIL PAYMENT
  // ==========================================

  async failPayment(paymentId: string) {
    const payment =
      await this.prisma.payment.findUnique({
        where: {
          id: paymentId,
        },
        include: {
          order: true,
        },
      });

    if (!payment) {
      throw new BadRequestException(
        'Payment not found',
      );
    }

    if (payment.status === 'PAID') {
      throw new BadRequestException(
        'Paid payment cannot be marked as failed',
      );
    }

    if (payment.status === 'REFUNDED') {
      throw new BadRequestException(
        'Refunded payment cannot be marked as failed',
      );
    }

    if (payment.order.status === 'CANCELLED') {
      throw new BadRequestException(
        'Cancelled order payment cannot be failed',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedPayment =
        await tx.payment.update({
          where: {
            id: paymentId,
          },
          data: {
            status: 'FAILED',
          },
        });

      await tx.order.update({
        where: {
          id: payment.orderId,
        },
        data: {
          paymentStatus: 'FAILED',
        },
      });

      return updatedPayment;
    });
  }

  // ==========================================
  // REFUND PAYMENT
  // ==========================================

  async refundPayment(paymentId: string) {
    const payment =
      await this.prisma.payment.findUnique({
        where: {
          id: paymentId,
        },
        include: {
          order: true,
        },
      });

    if (!payment) {
      throw new BadRequestException(
        'Payment not found',
      );
    }

    if (payment.status !== 'PAID') {
      throw new BadRequestException(
        'Only paid payments can be refunded',
      );
    }

    // Refund is allowed only for cancelled orders
    if (payment.order.status !== 'CANCELLED') {
      throw new BadRequestException(
        'Payment can only be refunded after order cancellation',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedPayment =
        await tx.payment.update({
          where: {
            id: paymentId,
          },
          data: {
            status: 'REFUNDED',
          },
        });

      await tx.order.update({
        where: {
          id: payment.orderId,
        },
        data: {
          paymentStatus: 'REFUNDED',
        },
      });

      return updatedPayment;
    });
  }

  // ==========================================
  // GET SINGLE PAYMENT
  // ==========================================

  async getPayment(
    paymentId: string,
    userId: string,
    isAdmin: boolean,
  ) {
    const payment =
      await this.prisma.payment.findUnique({
        where: {
          id: paymentId,
        },
        include: {
          order: {
            select: {
              id: true,
              userId: true,
              status: true,
              paymentStatus: true,
              totalAmount: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

    if (!payment) {
      throw new BadRequestException(
        'Payment not found',
      );
    }

    if (
      !isAdmin &&
      payment.order.userId !== userId
    ) {
      throw new BadRequestException(
        'Payment not found',
      );
    }

    return payment;
  }

  // ==========================================
  // GET MY PAYMENTS
  // ==========================================

  async getMyPayments(userId: string) {
    return this.prisma.payment.findMany({
      where: {
        order: {
          userId,
        },
      },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            totalAmount: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ==========================================
  // GET ALL PAYMENTS - ADMIN
  // ==========================================

  async getAllPayments() {
    return this.prisma.payment.findMany({
      include: {
        order: {
          select: {
            id: true,
            userId: true,
            status: true,
            paymentStatus: true,
            totalAmount: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}