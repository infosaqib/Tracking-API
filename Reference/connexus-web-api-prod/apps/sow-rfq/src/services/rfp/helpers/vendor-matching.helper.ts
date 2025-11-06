import { Prisma } from '@prisma/client';
import { GetPotentialVendorsDto } from '../dto/get-potential-vendors.dto';
import { VendorMatchType } from '../dto/potential-vendor-response.dto';

/**
 * Build base vendor where clause with optional status and stage filters
 */
export function buildBaseVendorWhere(
  filters: GetPotentialVendorsDto,
): Prisma.VendorsWhereInput {
  // Handle null or undefined filters gracefully
  if (!filters) {
    return {};
  }

  const where: Prisma.VendorsWhereInput = {};

  // Add status filter only if provided and valid
  if (
    filters.status &&
    Array.isArray(filters.status) &&
    filters.status.length > 0
  ) {
    where.status = { in: filters.status };
  }

  return where;
}

/**
 * Build geographic filter for vendor serviceable areas based on property location
 */
export function buildGeographicFilter(propertyLocation: {
  stateId?: string | null;
  cityId?: string | null;
  countyId?: string | null;
}): Prisma.VendorsWhereInput {
  // Handle null or undefined property location
  if (!propertyLocation) {
    return {
      OR: [
        { vendorServiceCoverContinentalUs: true },
        { vendorInterestedReceiveRfpOutside: true },
      ],
    };
  }

  const { stateId, cityId, countyId } = propertyLocation;

  // If no state ID, only return vendors with continental US or outside RFP coverage
  if (!stateId) {
    return {
      OR: [
        { vendorServiceCoverContinentalUs: true },
        { vendorInterestedReceiveRfpOutside: true },
      ],
    };
  }

  // Build OR conditions for different geographic coverage scenarios
  const geographicConditions: Prisma.VendorsWhereInput[] = [
    // Continental US coverage
    {
      vendorServiceCoverContinentalUs: true,
    },
    // Outside RFP interest
    {
      vendorInterestedReceiveRfpOutside: true,
    },
  ];

  // State-wide coverage (vendor covers the entire state)
  geographicConditions.push({
    vendorServicableAreas: {
      some: {
        stateId,
        cityId: null,
        countyId: null,
      },
    },
  });

  // City-specific coverage (if property has a city)
  if (cityId) {
    geographicConditions.push({
      vendorServicableAreas: {
        some: {
          stateId,
          cityId,
        },
      },
    });
  }

  // County-specific coverage (if property has a county)
  if (countyId) {
    geographicConditions.push({
      vendorServicableAreas: {
        some: {
          stateId,
          countyId,
        },
      },
    });
  }

  return {
    OR: geographicConditions,
  };
}

/**
 * Determine vendor match type and matching serviceable area
 */
export function determineVendorMatch(
  vendor: {
    vendorServiceCoverContinentalUs?: boolean | null;
    vendorInterestedReceiveRfpOutside?: boolean | null;
    vendorServicableAreas: Array<{
      id: string;
      stateId: string;
      cityId?: string | null;
      countyId?: string | null;
    }>;
  },
  propertyLocation: {
    stateId?: string | null;
    cityId?: string | null;
    countyId?: string | null;
  },
): {
  matchType: VendorMatchType;
  matchingServiceableArea?: {
    id: string;
    stateId: string;
    cityId?: string | null;
    countyId?: string | null;
  };
} {
  // Handle null or undefined inputs gracefully
  if (!vendor || !propertyLocation) {
    return {
      matchType: VendorMatchType.CONTINENTAL_US_COVERAGE,
    };
  }

  const { stateId, cityId, countyId } = propertyLocation;

  // Check for continental US coverage first
  if (vendor.vendorServiceCoverContinentalUs) {
    return {
      matchType: VendorMatchType.CONTINENTAL_US_COVERAGE,
    };
  }

  // Check for outside RFP interest
  if (vendor.vendorInterestedReceiveRfpOutside) {
    return {
      matchType: VendorMatchType.OUTSIDE_RFP_INTEREST,
    };
  }

  // Handle case where property has no state ID
  if (!stateId) {
    return {
      matchType: VendorMatchType.CONTINENTAL_US_COVERAGE,
    };
  }

  // Ensure vendorServicableAreas is an array
  const serviceableAreas = Array.isArray(vendor.vendorServicableAreas)
    ? vendor.vendorServicableAreas
    : [];

  // Check for state-wide coverage (no city or county specified)
  const stateWideArea = serviceableAreas.find(
    (area) => area.stateId === stateId && !area.cityId && !area.countyId,
  );
  if (stateWideArea) {
    return {
      matchType: VendorMatchType.STATE_WIDE_COVERAGE,
      matchingServiceableArea: stateWideArea,
    };
  }

  // Check for city-specific coverage
  if (cityId) {
    const cityArea = serviceableAreas.find(
      (area) => area.stateId === stateId && area.cityId === cityId,
    );
    if (cityArea) {
      return {
        matchType: VendorMatchType.CITY_COVERAGE,
        matchingServiceableArea: cityArea,
      };
    }
  }

  // Check for county-specific coverage
  if (countyId) {
    const countyArea = serviceableAreas.find(
      (area) => area.stateId === stateId && area.countyId === countyId,
    );
    if (countyArea) {
      return {
        matchType: VendorMatchType.COUNTY_COVERAGE,
        matchingServiceableArea: countyArea,
      };
    }
  }

  // Check for specific location match (both city and county)
  if (cityId && countyId) {
    const specificArea = serviceableAreas.find(
      (area) =>
        area.stateId === stateId &&
        area.cityId === cityId &&
        area.countyId === countyId,
    );
    if (specificArea) {
      return {
        matchType: VendorMatchType.SPECIFIC_LOCATION,
        matchingServiceableArea: specificArea,
      };
    }
  }

  // If we reach here, find any area that matches the state as fallback
  const matchingArea = serviceableAreas.find(
    (area) => area.stateId === stateId,
  );

  return {
    matchType: VendorMatchType.SPECIFIC_LOCATION,
    matchingServiceableArea: matchingArea,
  };
}
