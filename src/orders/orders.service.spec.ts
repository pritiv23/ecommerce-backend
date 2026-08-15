import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      cart: {
        findUnique: jest.fn(),
      },

      order: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },

      product: {
        update: jest.fn(),
      },

      payment: {
        update: jest.fn(),
      },

      cartItem: {
        deleteMany: jest.fn(),
      },

      $transaction: jest.fn(),
    };

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          OrdersService,
          {
            provide: PrismaService,
            useValue: prisma,
          },
        ],
      }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  // ============================================
  // BASIC
  // ============================================

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ============================================
  // CREATE ORDER
  // ============================================

  describe('createOrder', () => {
    it('should reject an empty cart', async () => {
      prisma.$transaction.mockImplementation(
        async (callback: any) => {
          prisma.cart.findUnique.mockResolvedValue(null);

          return callback(prisma);
        },
      );

      await expect(
        service.createOrder('user-1'),
      ).rejects.toThrow('Cart is empty');
    });

    it('should reject when cart has no items', async () => {
      prisma.$transaction.mockImplementation(
        async (callback: any) => {
          prisma.cart.findUnique.mockResolvedValue({
            id: 'cart-1',
            userId: 'user-1',
            items: [],
          });

          return callback(prisma);
        },
      );

      await expect(
        service.createOrder('user-1'),
      ).rejects.toThrow('Cart is empty');
    });

    it('should reject when product stock is insufficient', async () => {
      prisma.$transaction.mockImplementation(
        async (callback: any) => {
          prisma.cart.findUnique.mockResolvedValue({
            id: 'cart-1',
            userId: 'user-1',
            items: [
              {
                id: 'item-1',
                productId: 'product-1',
                quantity: 5,
                product: {
                  id: 'product-1',
                  name: 'Test Product',
                  price: 100,
                  stock: 2,
                  isActive: true,
                },
              },
            ],
          });

          return callback(prisma);
        },
      );

      await expect(
        service.createOrder('user-1'),
      ).rejects.toThrow(
        'Not enough stock for "Test Product"',
      );
    });

    it('should reject inactive products', async () => {
      prisma.$transaction.mockImplementation(
        async (callback: any) => {
          prisma.cart.findUnique.mockResolvedValue({
            id: 'cart-1',
            userId: 'user-1',
            items: [
              {
                id: 'item-1',
                productId: 'product-1',
                quantity: 1,
                product: {
                  id: 'product-1',
                  name: 'Inactive Product',
                  price: 100,
                  stock: 10,
                  isActive: false,
                },
              },
            ],
          });

          return callback(prisma);
        },
      );

      await expect(
        service.createOrder('user-1'),
      ).rejects.toThrow(
        'Product "Inactive Product" is no longer available',
      );
    });
  });

  // ============================================
  // GET MY ORDERS
  // ============================================

  describe('getMyOrders', () => {
    it('should return orders belonging to the user', async () => {
      const orders = [
        {
          id: 'order-1',
          userId: 'user-1',
          status: 'PENDING',
        },
      ];

      prisma.order.findMany.mockResolvedValue(orders);

      const result =
        await service.getMyOrders('user-1');

      expect(result).toEqual(orders);

      expect(
        prisma.order.findMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-1',
          },
        }),
      );
    });
  });

  // ============================================
  // GET ONE ORDER
  // ============================================

  describe('getOrder', () => {
    it('should return the order if it belongs to the user', async () => {
      const order = {
        id: 'order-1',
        userId: 'user-1',
        status: 'PENDING',
      };

      prisma.order.findFirst.mockResolvedValue(order);

      const result =
        await service.getOrder(
          'order-1',
          'user-1',
        );

      expect(result).toEqual(order);

      expect(
        prisma.order.findFirst,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: 'order-1',
            userId: 'user-1',
          },
        }),
      );
    });

    it('should throw when order does not belong to user', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(
        service.getOrder(
          'order-1',
          'user-1',
        ),
      ).rejects.toThrow(
        new NotFoundException('Order not found'),
      );
    });
  });

  // ============================================
  // UPDATE ORDER STATUS
  // ============================================

  describe('updateOrderStatus', () => {
    it('should reject a non-existent order', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.updateOrderStatus(
          'order-1',
          'CONFIRMED' as any,
        ),
      ).rejects.toThrow(
        new NotFoundException('Order not found'),
      );
    });

    it('should reject shipping when payment is not completed', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: 'CONFIRMED',
        paymentStatus: 'PENDING',
        items: [],
        payment: null,
      });

      await expect(
        service.updateOrderStatus(
          'order-1',
          'SHIPPED' as any,
        ),
      ).rejects.toThrow(
        'Order must be paid before shipping or delivery',
      );
    });

    it('should reject updating a delivered order', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        items: [],
        payment: null,
      });

      await expect(
        service.updateOrderStatus(
          'order-1',
          'CONFIRMED' as any,
        ),
      ).rejects.toThrow(
        'Delivered order cannot be updated',
      );
    });

    it('should reject invalid status transitions', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: 'PENDING',
        paymentStatus: 'PAID',
        items: [],
        payment: null,
      });

      await expect(
        service.updateOrderStatus(
          'order-1',
          'SHIPPED' as any,
        ),
      ).rejects.toThrow(
        'Cannot change order status from PENDING to SHIPPED',
      );
    });

    it('should reject updating a cancelled order', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: 'CANCELLED',
        paymentStatus: 'REFUNDED',
        items: [],
        payment: null,
      });

      await expect(
        service.updateOrderStatus(
          'order-1',
          'CONFIRMED' as any,
        ),
      ).rejects.toThrow(
        'Cancelled order cannot be updated',
      );
    });
  });

  // ============================================
  // CANCEL MY ORDER
  // ============================================

  describe('cancelOrder', () => {
    it('should reject a non-existent order', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(
        service.cancelOrder(
          'order-1',
          'user-1',
        ),
      ).rejects.toThrow(
        new NotFoundException('Order not found'),
      );
    });

    it('should reject cancellation of delivered order', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        items: [],
        payment: null,
      });

      await expect(
        service.cancelOrder(
          'order-1',
          'user-1',
        ),
      ).rejects.toThrow(
        'Cannot cancel order with status DELIVERED',
      );
    });

    it('should reject cancellation of shipped order', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'order-1',
        userId: 'user-1',
        status: 'SHIPPED',
        paymentStatus: 'PAID',
        items: [],
        payment: null,
      });

      await expect(
        service.cancelOrder(
          'order-1',
          'user-1',
        ),
      ).rejects.toThrow(
        'Cannot cancel order with status SHIPPED',
      );
    });
  });
});