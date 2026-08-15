import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '../generated/prisma/enums';
@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // CREATE ORDER
  // ============================================

  async createOrder(userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: {
          userId,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      let totalAmount = 0;

      for (const item of cart.items) {
        if (!item.product.isActive) {
          throw new BadRequestException(
            `Product "${item.product.name}" is no longer available`,
          );
        }

        if (item.product.stock < item.quantity) {
          throw new BadRequestException(
            `Not enough stock for "${item.product.name}"`,
          );
        }

        totalAmount += item.product.price * item.quantity;
      }

      const order = await tx.order.create({
        data: {
          userId,
          totalAmount,
          status: 'PENDING',
          paymentStatus: 'PENDING',

          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.product.price,
            })),
          },
        },

        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      for (const item of cart.items) {
        await tx.product.update({
          where: {
            id: item.productId,
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      await tx.cartItem.deleteMany({
        where: {
          cartId: cart.id,
        },
      });

      return order;
    });
  }

  // ============================================
  // GET MY ORDERS
  // ============================================

  async getMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: {
        userId,
      },

      include: {
        items: {
          include: {
            product: true,
          },
        },

        payment: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ============================================
  // GET ALL ORDERS - ADMIN
  // ============================================

  async getAllOrders() {
    return this.prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },

        items: {
          include: {
            product: true,
          },
        },

        payment: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ============================================
  // GET ONE ORDER
  // ============================================

  async getOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },

      include: {
        items: {
          include: {
            product: true,
          },
        },

        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  // ============================================
  // UPDATE ORDER STATUS - ADMIN
  // ============================================

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
  ) {
    const order = await this.prisma.order.findUnique({
      where: {
        id: orderId,
      },

      include: {
        items: true,
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === 'DELIVERED') {
      throw new BadRequestException(
        'Delivered order cannot be updated',
      );
    }

    if (order.status === 'CANCELLED') {
      throw new BadRequestException(
        'Cancelled order cannot be updated',
      );
    }

    if (
      (status === 'SHIPPED' || status === 'DELIVERED') &&
      order.paymentStatus !== 'PAID'
    ) {
      throw new BadRequestException(
        'Order must be paid before shipping or delivery',
      );
    }

    const validTransitions: Record<
      OrderStatus,
      OrderStatus[]
    > = {
      PENDING: ['CONFIRMED', 'CANCELLED'],

      CONFIRMED: ['SHIPPED', 'CANCELLED'],

      SHIPPED: ['DELIVERED'],

      DELIVERED: [],

      CANCELLED: [],
    };

    const allowedStatuses =
      validTransitions[order.status];

    if (!allowedStatuses.includes(status)) {
      throw new BadRequestException(
        `Cannot change order status from ${order.status} to ${status}`,
      );
    }

    // ============================================
    // CANCEL ORDER - ADMIN
    // ============================================

    if (status === 'CANCELLED') {
      return this.prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.product.update({
            where: {
              id: item.productId,
            },

            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }

        if (
          order.payment &&
          order.payment.status === 'PAID'
        ) {
          await tx.payment.update({
            where: {
              id: order.payment.id,
            },

            data: {
              status: 'REFUNDED',
            },
          });
        }

        return tx.order.update({
          where: {
            id: orderId,
          },

          data: {
            status: 'CANCELLED',

            paymentStatus:
              order.payment?.status === 'PAID'
                ? 'REFUNDED'
                : order.paymentStatus,
          },

          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },

            items: {
              include: {
                product: true,
              },
            },

            payment: true,
          },
        });
      });
    }

    // ============================================
    // NORMAL STATUS UPDATE
    // ============================================

    return this.prisma.order.update({
      where: {
        id: orderId,
      },

      data: {
        status,
      },

      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },

        items: {
          include: {
            product: true,
          },
        },

        payment: true,
      },
    });
  }

  // ============================================
  // CANCEL MY ORDER - CUSTOMER
  // ============================================

  async cancelOrder(
    orderId: string,
    userId: string,
  ) {
    
    // Find the order belonging to this customer
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
      },

      include: {
        items: true,
        payment: true,
      },
    });

    // Order doesn't exist or doesn't belong to customer
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Only PENDING and CONFIRMED orders can be cancelled
    if (
      order.status !== 'PENDING' &&
      order.status !== 'CONFIRMED'
    ) {
      throw new BadRequestException(
        `Cannot cancel order with status ${order.status}`,
      );
    }

    // Perform cancellation atomically
    return this.prisma.$transaction(async (tx) => {
      // Restore product stock
      for (const item of order.items) {
        await tx.product.update({
          where: {
            id: item.productId,
          },

          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }

      // Refund payment if payment was already completed
      if (
        order.payment &&
        order.payment.status === 'PAID'
      ) {
        await tx.payment.update({
          where: {
            id: order.payment.id,
          },

          data: {
            status: 'REFUNDED',
          },
        });
      }

      // Update order
      return tx.order.update({
        where: {
          id: orderId,
        },

        data: {
          status: 'CANCELLED',

          paymentStatus:
            order.payment?.status === 'PAID'
              ? 'REFUNDED'
              : order.paymentStatus,
        },

        include: {
          items: {
            include: {
              product: true,
            },
          },

          payment: true,
        },
      });
    });
  }
}