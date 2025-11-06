import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebhooksService {
  constructor(private prisma: PrismaService) {}

  async handleWebhook(body: any, headers: any) {
    // Webhook handling logic
    return {
      success: true,
      message: 'Webhook received',
    };
  }
}

