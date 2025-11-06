import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTrackingDto } from './dto/update-tracking.dto';

@Injectable()
export class TrackingService {
  constructor(private prisma: PrismaService) {}

  async findByTrackingId(trackingId: string) {
    const trackingLog = await this.prisma.trackingLog.findUnique({
      where: { trackingId },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        events: {
          orderBy: { timestamp: 'desc' },
        },
        exceptions: {
          where: { isResolved: false },
        },
      },
    });

    if (!trackingLog) {
      throw new NotFoundException('Tracking not found');
    }

    return trackingLog;
  }

  async updateTracking(trackingId: string, updateTrackingDto: UpdateTrackingDto) {
    const trackingLog = await this.prisma.trackingLog.findUnique({
      where: { trackingId },
    });

    if (!trackingLog) {
      throw new NotFoundException('Tracking not found');
    }

    // Add event if status changed
    if (updateTrackingDto.status) {
      await this.prisma.trackingEvent.create({
        data: {
          trackingLogId: trackingLog.id,
          status: updateTrackingDto.status,
          description: updateTrackingDto.description || `Status updated to ${updateTrackingDto.status}`,
          locationName: updateTrackingDto.locationName,
          locationCity: updateTrackingDto.locationCity,
          locationState: updateTrackingDto.locationState,
          locationCountry: updateTrackingDto.locationCountry,
          source: 'system',
        },
      });
    }

    return this.prisma.trackingLog.update({
      where: { trackingId },
      data: {
        statusCurrent: updateTrackingDto.status || trackingLog.statusCurrent,
        statusLastUpdated: new Date(),
      },
      include: {
        events: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });
  }
}

