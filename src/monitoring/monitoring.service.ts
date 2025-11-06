import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MonitoringService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [users, products, orders, trackingLogs] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.product.count(),
      this.prisma.order.count(),
      this.prisma.trackingLog.count(),
    ]);

    return {
      users,
      products,
      orders,
      trackingLogs,
      timestamp: new Date().toISOString(),
    };
  }
}

