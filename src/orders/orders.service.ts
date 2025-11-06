import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(createOrderDto: CreateOrderDto, customerId: string) {
    // Generate order number
    const count = await this.prisma.order.count();
    const orderNumber = `ORD-${Date.now()}-${(count + 1).toString().padStart(6, '0')}`;

    // Generate tracking ID
    const trackingId = `TRK-${Date.now()}-${(count + 1).toString().padStart(8, '0')}`;

    // Calculate totals
    const subtotal = createOrderDto.items.reduce((sum, item) => sum + item.total, 0);
    const total = subtotal + (createOrderDto.paymentTax || 0) + (createOrderDto.paymentShipping || 0) - (createOrderDto.paymentDiscount || 0);

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerId,
        trackingId,
        paymentSubtotal: subtotal,
        paymentTax: createOrderDto.paymentTax || 0,
        paymentShipping: createOrderDto.paymentShipping || 0,
        paymentDiscount: createOrderDto.paymentDiscount || 0,
        paymentTotal: total,
        paymentMethod: createOrderDto.paymentMethod,
        ...createOrderDto,
        items: {
          create: createOrderDto.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
            attributes: item.attributes || [],
          })),
        },
        timeline: {
          create: {
            status: 'pending',
            description: 'Order created',
          },
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Create tracking log
    await this.prisma.trackingLog.create({
      data: {
        trackingId,
        orderId: order.id,
        carrierName: createOrderDto.shippingCarrier || 'local',
        carrierTrackingNumber: createOrderDto.shippingTrackingNumber || trackingId,
      },
    });

    return order;
  }

  async findAll(customerId?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where = customerId ? { customerId } : {};

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        trackingLog: {
          include: {
            events: true,
          },
        },
        timeline: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
}

