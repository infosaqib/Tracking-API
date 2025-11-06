import { PrismaService } from '@app/prisma';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { EventTypes } from '../../libs/events/types/event-types';

@Injectable()
export class ServiceCoverageService {
  private readonly logger = new Logger(ServiceCoverageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent(EventTypes.UPDATE_VENDOR_SERVICE_AREA_COVERAGE)
  async handleUpdateVendorServiceAreaCoverage(payload: { vendorId: string }) {
    try {
      this.logger.log(
        `Processing service coverage update for vendor: ${payload.vendorId}`,
      );

      // Get vendor service areas
      const vendorServiceAreas =
        await this.prisma.vendorServicableAreas.findMany({
          where: {
            vendorId: payload.vendorId,
          },
          include: {
            vendor: {
              include: {
                vendorServices: {
                  include: {
                    service: true,
                  },
                },
              },
            },
          },
        });

      if (vendorServiceAreas.length === 0) {
        this.logger.warn(
          `No service areas found for vendor: ${payload.vendorId}`,
        );
        return;
      }

      // First, determine what coverage needs to be created (without creating yet)
      const coverageDataToCreate = vendorServiceAreas.flatMap((area) => {
        const { tenantId } = area.vendor;
        return area.vendor.vendorServices.map((vendorService) => {
          const { serviceId } = vendorService;

          // Determine geo scope and geo ID based on the most specific location available
          let geoScope: 'CITY' | 'COUNTY' | 'STATE';
          let geoId: string;

          if (area.cityId) {
            geoScope = 'CITY';
            geoId = area.cityId;
          } else if (area.countyId) {
            geoScope = 'COUNTY';
            geoId = area.countyId;
          } else {
            geoScope = 'STATE';
            geoId = area.stateId;
          }

          return {
            tenantId,
            serviceId,
            geoScope,
            geoId,
          };
        });
      });

      // Use transaction to create all coverage entries atomically
      const coverageCreations = await this.prisma.client.$transaction(
        async (tx) => {
          const processCoverage = async (
            coverageData: (typeof coverageDataToCreate)[0],
          ) => {
            // Check if coverage already exists within the transaction
            const existingCoverage = await tx.serviceUnitCoverage.findFirst({
              where: {
                tenantId: coverageData.tenantId,
                serviceId: coverageData.serviceId,
                geoScope: coverageData.geoScope,
                geoId: coverageData.geoId,
              },
            });

            if (!existingCoverage) {
              // Create new service coverage within the transaction
              const coverage = await tx.serviceUnitCoverage.create({
                data: coverageData,
              });

              this.logger.log(
                `Created service coverage: ${coverage.id} for service ${coverageData.serviceId} in ${coverageData.geoScope} ${coverageData.geoId}`,
              );

              return coverage;
            }

            return null;
          };

          const results = await Promise.all(
            coverageDataToCreate.map(processCoverage),
          );

          return results.filter(Boolean);
        },
      );

      this.logger.log(
        `Completed service coverage update for vendor: ${payload.vendorId}. Created ${coverageCreations.length} coverage entries in transaction.`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing service coverage update for vendor ${payload.vendorId}:`,
        error,
      );
      throw error;
    }
  }
}
