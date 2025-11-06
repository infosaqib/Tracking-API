import { VendorStages, VendorStatuses } from '@prisma/client';
import { GetPotentialVendorsDto } from '../dto/get-potential-vendors.dto';
import { VendorMatchType } from '../dto/potential-vendor-response.dto';
import {
  buildBaseVendorWhere,
  buildGeographicFilter,
  determineVendorMatch,
} from './vendor-matching.helper';

describe('VendorMatchingHelper', () => {
  describe('buildBaseVendorWhere', () => {
    it('should return base filter with deletedAt null', () => {
      const filters: GetPotentialVendorsDto = {};
      const result = buildBaseVendorWhere(filters);

      expect(result).toEqual({
        deletedAt: null,
      });
    });

    it('should include status filter when provided', () => {
      const filters: GetPotentialVendorsDto = {
        status: [VendorStatuses.ACTIVE],
      };
      const result = buildBaseVendorWhere(filters);

      expect(result).toEqual({
        deletedAt: null,
        status: { in: [VendorStatuses.ACTIVE] },
      });
    });

    it('should include stage filter when provided', () => {
      const filters: GetPotentialVendorsDto = {
        stage: [VendorStages.CNX_APPROVED],
      };
      const result = buildBaseVendorWhere(filters);

      expect(result).toEqual({
        deletedAt: null,
        stage: { in: [VendorStages.CNX_APPROVED] },
      });
    });

    it('should include both status and stage filters when provided', () => {
      const filters: GetPotentialVendorsDto = {
        status: [VendorStatuses.ACTIVE, VendorStatuses.DRAFT],
        stage: [VendorStages.CNX_APPROVED, VendorStages.ONBOARDING],
      };
      const result = buildBaseVendorWhere(filters);

      expect(result).toEqual({
        deletedAt: null,
        status: { in: [VendorStatuses.ACTIVE, VendorStatuses.DRAFT] },
        stage: { in: [VendorStages.CNX_APPROVED, VendorStages.ONBOARDING] },
      });
    });
  });

  describe('buildGeographicFilter', () => {
    const mockStateId = 'state-123';
    const mockCityId = 'city-456';
    const mockCountyId = 'county-789';

    it('should build filter with continental US and outside RFP interest', () => {
      const propertyLocation = { stateId: mockStateId };
      const result = buildGeographicFilter(propertyLocation);

      expect(result.OR).toContainEqual({
        vendorServiceCoverContinentalUs: true,
      });
      expect(result.OR).toContainEqual({
        vendorInterestedReceiveRfpOutside: true,
      });
    });

    it('should include state-wide coverage filter', () => {
      const propertyLocation = { stateId: mockStateId };
      const result = buildGeographicFilter(propertyLocation);

      expect(result.OR).toContainEqual({
        vendorServicableAreas: {
          some: {
            stateId: mockStateId,
            cityId: null,
            countyId: null,
          },
        },
      });
    });

    it('should include city-specific coverage when cityId is provided', () => {
      const propertyLocation = {
        stateId: mockStateId,
        cityId: mockCityId,
      };
      const result = buildGeographicFilter(propertyLocation);

      expect(result.OR).toContainEqual({
        vendorServicableAreas: {
          some: {
            stateId: mockStateId,
            cityId: mockCityId,
          },
        },
      });
    });

    it('should include county-specific coverage when countyId is provided', () => {
      const propertyLocation = {
        stateId: mockStateId,
        countyId: mockCountyId,
      };
      const result = buildGeographicFilter(propertyLocation);

      expect(result.OR).toContainEqual({
        vendorServicableAreas: {
          some: {
            stateId: mockStateId,
            countyId: mockCountyId,
          },
        },
      });
    });

    it('should include all coverage types when all location data is provided', () => {
      const propertyLocation = {
        stateId: mockStateId,
        cityId: mockCityId,
        countyId: mockCountyId,
      };
      const result = buildGeographicFilter(propertyLocation);

      expect(result.OR).toHaveLength(5); // Continental US, Outside RFP, State, City, County
    });
  });

  describe('determineVendorMatch', () => {
    const mockPropertyLocation = {
      stateId: 'state-123',
      cityId: 'city-456',
      countyId: 'county-789',
    };

    it('should return CONTINENTAL_US_COVERAGE when vendor covers continental US', () => {
      const vendor = {
        vendorServiceCoverContinentalUs: true,
        vendorInterestedReceiveRfpOutside: false,
        vendorServicableAreas: [],
      };

      const result = determineVendorMatch(vendor, mockPropertyLocation);

      expect(result.matchType).toBe(VendorMatchType.CONTINENTAL_US_COVERAGE);
      expect(result.matchingServiceableArea).toBeUndefined();
    });

    it('should return OUTSIDE_RFP_INTEREST when vendor is interested in outside RFPs', () => {
      const vendor = {
        vendorServiceCoverContinentalUs: false,
        vendorInterestedReceiveRfpOutside: true,
        vendorServicableAreas: [],
      };

      const result = determineVendorMatch(vendor, mockPropertyLocation);

      expect(result.matchType).toBe(VendorMatchType.OUTSIDE_RFP_INTEREST);
      expect(result.matchingServiceableArea).toBeUndefined();
    });

    it('should return STATE_WIDE_COVERAGE for state-wide serviceable area', () => {
      const mockServiceableArea = {
        id: 'area-123',
        stateId: 'state-123',
        cityId: null,
        countyId: null,
      };
      const vendor = {
        vendorServiceCoverContinentalUs: false,
        vendorInterestedReceiveRfpOutside: false,
        vendorServicableAreas: [mockServiceableArea],
      };

      const result = determineVendorMatch(vendor, mockPropertyLocation);

      expect(result.matchType).toBe(VendorMatchType.STATE_WIDE_COVERAGE);
      expect(result.matchingServiceableArea).toEqual(mockServiceableArea);
    });

    it('should return CITY_COVERAGE for city-specific serviceable area', () => {
      const mockServiceableArea = {
        id: 'area-456',
        stateId: 'state-123',
        cityId: 'city-456',
        countyId: null,
      };
      const vendor = {
        vendorServiceCoverContinentalUs: false,
        vendorInterestedReceiveRfpOutside: false,
        vendorServicableAreas: [mockServiceableArea],
      };

      const result = determineVendorMatch(vendor, mockPropertyLocation);

      expect(result.matchType).toBe(VendorMatchType.CITY_COVERAGE);
      expect(result.matchingServiceableArea).toEqual(mockServiceableArea);
    });

    it('should return COUNTY_COVERAGE for county-specific serviceable area', () => {
      const mockServiceableArea = {
        id: 'area-789',
        stateId: 'state-123',
        cityId: null,
        countyId: 'county-789',
      };
      const vendor = {
        vendorServiceCoverContinentalUs: false,
        vendorInterestedReceiveRfpOutside: false,
        vendorServicableAreas: [mockServiceableArea],
      };

      const result = determineVendorMatch(vendor, mockPropertyLocation);

      expect(result.matchType).toBe(VendorMatchType.COUNTY_COVERAGE);
      expect(result.matchingServiceableArea).toEqual(mockServiceableArea);
    });

    it('should return SPECIFIC_LOCATION for other matching areas', () => {
      const mockServiceableArea = {
        id: 'area-specific',
        stateId: 'state-123',
        cityId: 'different-city',
        countyId: null,
      };
      const vendor = {
        vendorServiceCoverContinentalUs: false,
        vendorInterestedReceiveRfpOutside: false,
        vendorServicableAreas: [mockServiceableArea],
      };

      const result = determineVendorMatch(vendor, mockPropertyLocation);

      expect(result.matchType).toBe(VendorMatchType.SPECIFIC_LOCATION);
      expect(result.matchingServiceableArea).toEqual(mockServiceableArea);
    });

    it('should prioritize continental US coverage over other matches', () => {
      const mockServiceableArea = {
        id: 'area-123',
        stateId: 'state-123',
        cityId: 'city-456',
        countyId: null,
      };
      const vendor = {
        vendorServiceCoverContinentalUs: true,
        vendorInterestedReceiveRfpOutside: true,
        vendorServicableAreas: [mockServiceableArea],
      };

      const result = determineVendorMatch(vendor, mockPropertyLocation);

      expect(result.matchType).toBe(VendorMatchType.CONTINENTAL_US_COVERAGE);
    });

    it('should prioritize outside RFP interest over serviceable areas', () => {
      const mockServiceableArea = {
        id: 'area-123',
        stateId: 'state-123',
        cityId: 'city-456',
        countyId: null,
      };
      const vendor = {
        vendorServiceCoverContinentalUs: false,
        vendorInterestedReceiveRfpOutside: true,
        vendorServicableAreas: [mockServiceableArea],
      };

      const result = determineVendorMatch(vendor, mockPropertyLocation);

      expect(result.matchType).toBe(VendorMatchType.OUTSIDE_RFP_INTEREST);
    });

    it('should handle multiple serviceable areas and return the most specific match', () => {
      const stateWideArea = {
        id: 'area-state',
        stateId: 'state-123',
        cityId: null,
        countyId: null,
      };
      const citySpecificArea = {
        id: 'area-city',
        stateId: 'state-123',
        cityId: 'city-456',
        countyId: null,
      };
      const vendor = {
        vendorServiceCoverContinentalUs: false,
        vendorInterestedReceiveRfpOutside: false,
        vendorServicableAreas: [stateWideArea, citySpecificArea],
      };

      const result = determineVendorMatch(vendor, mockPropertyLocation);

      // Should return the first match found (state-wide in this case)
      expect(result.matchType).toBe(VendorMatchType.STATE_WIDE_COVERAGE);
      expect(result.matchingServiceableArea).toEqual(stateWideArea);
    });
  });
});
