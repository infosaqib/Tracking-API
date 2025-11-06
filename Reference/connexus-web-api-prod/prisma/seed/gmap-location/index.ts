/* eslint-disable no-console */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */
import axios from 'axios';
import { mkdirSync } from 'fs';
import { join } from 'path';
import * as XLSX from 'xlsx-js-style';
import { db } from '../db';
import {
  API_CONFIG,
  API_STATUS,
  EXCEL_EXPORT_CONFIG,
  GOOGLE_MAPS_API_BASE_URL,
  LOCATION_SEARCH_CONFIGS,
  SPECIAL_TERRITORIES,
  STATE_ABBREVIATION_MAP,
} from './data';
import {
  FailedItem,
  FailedItemsCollection,
  GoogleMapsResponse,
  LocationEntityType,
  LocationSearchConfig,
} from './types';

const prisma = db;

// Global collection to track failed items across all seeding operations
const failedItemsCollection: FailedItemsCollection = {
  countries: [],
  states: [],
  cities: [],
  counties: [],
};

/**
 * Sleep function to add delays between API calls
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Add a failed item to the collection
 */
function addFailedItem(
  id: string,
  name: string,
  entityType: LocationEntityType,
  reason: string,
): void {
  const failedItem: FailedItem = {
    id,
    name,
    entityType,
    reason,
    timestamp: new Date(),
  };

  switch (entityType) {
    case 'country':
      failedItemsCollection.countries.push(failedItem);
      break;
    case 'state':
      failedItemsCollection.states.push(failedItem);
      break;
    case 'city':
      failedItemsCollection.cities.push(failedItem);
      break;
    case 'county':
      failedItemsCollection.counties.push(failedItem);
      break;
    default:
      console.warn(`Unknown entity type: ${entityType}`);
      break;
  }
}

/**
 * Get state name from state abbreviation
 */
function getStateNameFromAbbreviation(
  stateAbbreviation: string,
): string | null {
  // Convert state abbreviation to full name using the map
  return STATE_ABBREVIATION_MAP[stateAbbreviation] || stateAbbreviation;
}

/**
 * Generic function to search Google Maps API for location data
 */
async function searchLocation(
  entityName: string,
  apiKey: string,
  entityType?: LocationEntityType,
  types?: readonly string[],
  entity?: any,
): Promise<GoogleMapsResponse | null> {
  try {
    let query = entityName;

    // For states, convert abbreviation to full name if possible
    if (entityType === 'state' && STATE_ABBREVIATION_MAP[entityName]) {
      query = STATE_ABBREVIATION_MAP[entityName];
      console.log(
        `Converted state abbreviation "${entityName}" to "${query}" for search`,
      );
    }

    // For countries, check if it's a special territory that needs enhanced search
    if (entityType === 'country' && SPECIAL_TERRITORIES[entityName]) {
      query = SPECIAL_TERRITORIES[entityName];
      console.log(
        `Enhanced search for special territory "${entityName}" to "${query}"`,
      );
    }

    // For states, add "State" suffix to avoid ambiguity with cities
    if (entityType === 'state') {
      const config = LOCATION_SEARCH_CONFIGS.state;
      if (config.searchSuffix) {
        query = `${query}${config.searchSuffix}`;
        console.log(`Enhanced state search: "${entityName}" to "${query}"`);
      }
    }

    // For cities, add state name suffix for better results
    if (entityType === 'city') {
      // Get the state name from the entity's state object
      const stateName = getStateNameFromAbbreviation(entity.state?.stateName);
      if (stateName) {
        query = `${query}, ${stateName}`;
        console.log(`Enhanced city search: "${entityName}" to "${query}"`);
      }
    }

    // For counties, add state name suffix for better results
    if (entityType === 'county') {
      // Get the state name from the entity's state object
      const stateName = getStateNameFromAbbreviation(entity.state?.stateName);
      if (stateName) {
        query = `${query}, ${stateName}`;
        console.log(`Enhanced county search: "${entityName}" to "${query}"`);
      }
    }

    const fullQuery = `${query}`;

    // Build API parameters
    const params: Record<string, any> = {
      query: fullQuery,
      key: apiKey,
    };

    // Add types parameter if specified for more precise searches
    if (types && types.length > 0) {
      params.types = types.join('|');
    }

    const response = await axios.get<GoogleMapsResponse>(
      GOOGLE_MAPS_API_BASE_URL,
      { params },
    );

    return response.data;
  } catch (error) {
    console.error(`Error searching for "${entityName}":`, error);
    return null;
  }
}

/**
 * Process Google Maps API response and extract location data
 */
function extractLocationData(response: GoogleMapsResponse): {
  latitude: number;
  longitude: number;
  placeId: string;
} | null {
  if (
    response.status !== API_STATUS.OK ||
    !response.results ||
    response.results.length === 0
  ) {
    return null;
  }

  const firstResult = response.results[0];
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { geometry, place_id } = firstResult;

  if (!geometry?.location) {
    return null;
  }

  return {
    latitude: geometry.location.lat,
    longitude: geometry.location.lng,
    placeId: place_id,
  };
}

/**
 * Generic function to update location data in database
 */
async function updateLocationData(
  entityType: LocationEntityType,
  entityId: string,
  latitude: number,
  longitude: number,
  placeId: string,
): Promise<void> {
  try {
    const updateData = {
      latitude,
      longitude,
      placeId,
      modifiedAt: new Date(),
    };

    switch (entityType) {
      case 'country':
        await prisma.countries.update({
          where: { id: entityId },
          data: updateData,
        });
        break;
      case 'state':
        await prisma.states.update({
          where: { id: entityId },
          data: updateData,
        });
        break;
      case 'city':
        await prisma.cities.update({
          where: { id: entityId },
          data: updateData,
        });
        break;
      case 'county':
        await prisma.county.update({
          where: { id: entityId },
          data: updateData,
        });
        break;
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }
  } catch (error) {
    console.error(`Error updating ${entityType} ${entityId}:`, error);
    throw error;
  }
}

/**
 * Generic function to process a batch of location entities
 */
async function processLocationBatch<
  T extends { id: string; [key: string]: any },
>(
  entities: T[],
  config: LocationSearchConfig,
  apiKey: string,
): Promise<{ success: number; failed: number; skipped: number }> {
  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (const entity of entities) {
    try {
      const entityName = entity[config.nameField];
      const hasLocationData =
        entity.latitude && entity.longitude && entity.placeId;

      // Skip entities that already have complete location data
      if (hasLocationData) {
        console.log(
          `Skipping ${config.entityType} "${entityName}" - already has location data`,
        );
        skipped += 1;
        continue;
      }

      console.log(`Processing ${config.entityType}: ${entityName}`);

      // Search Google Maps API
      const response = await searchLocation(
        entityName,
        apiKey,
        config.entityType,
        config.types,
        entity,
      );

      if (!response) {
        console.warn(`No response for ${config.entityType} "${entityName}"`);
        addFailedItem(
          entity.id,
          entityName,
          config.entityType,
          'No API response',
        );
        failed += 1;
        continue;
      }

      // Handle different API statuses
      if (response.status === API_STATUS.ZERO_RESULTS) {
        console.warn(
          `No results found for ${config.entityType} "${entityName}"`,
        );
        addFailedItem(
          entity.id,
          entityName,
          config.entityType,
          'No results found',
        );
        failed += 1;
        continue;
      }

      // Log the types returned by the API for debugging
      if (response.results && response.results.length > 0) {
        console.log(
          `API returned ${response.results.length} results for ${config.entityType} "${entityName}"`,
        );
        response.results.forEach((result, index) => {
          console.log(
            `  Result ${index + 1}: types [${result.types.join(', ')}], name: "${result.name}"`,
          );
        });
      }

      if (response.status === API_STATUS.OVER_QUERY_LIMIT) {
        console.error(
          `Rate limit exceeded for ${config.entityType} "${entityName}". Stopping processing.`,
        );
        throw new Error('Google Maps API rate limit exceeded');
      }

      if (response.status !== API_STATUS.OK) {
        console.error(
          `API error for ${config.entityType} "${entityName}": ${response.status}`,
        );
        addFailedItem(
          entity.id,
          entityName,
          config.entityType,
          `API error: ${response.status}`,
        );
        failed += 1;
        continue;
      }

      // Extract location data
      const locationData = extractLocationData(response);

      if (!locationData) {
        console.warn(
          `Could not extract location data for ${config.entityType} "${entityName}"`,
        );
        addFailedItem(
          entity.id,
          entityName,
          config.entityType,
          'Could not extract location data',
        );
        failed += 1;
        continue;
      }

      // Find the best matching result based on types
      if (response.results && response.results.length > 0) {
        const expectedTypes = config.types;
        let bestResult = response.results[0]; // Default to first result
        let bestTypeMatch = false;

        // Look for a result with matching types
        for (const result of response.results) {
          const returnedTypes = result.types || [];
          const hasMatchingType = expectedTypes.some((expectedType) =>
            returnedTypes.includes(expectedType),
          );

          if (hasMatchingType) {
            bestResult = result;
            bestTypeMatch = true;
            break; // Use the first result with matching types
          }
        }

        // Log which result we're using
        if (bestTypeMatch) {
          console.log(
            `Using result with matching types [${bestResult.types.join(', ')}] for ${config.entityType} "${entityName}"`,
          );
        } else {
          console.log(
            `No exact type match found, using first result with types [${bestResult.types.join(', ')}] for ${config.entityType} "${entityName}"`,
          );
        }

        // Update the response to use the best result
        response.results = [bestResult];
      }

      // Update entity in database
      await updateLocationData(
        config.entityType,
        entity.id,
        locationData.latitude,
        locationData.longitude,
        locationData.placeId,
      );

      console.log(
        `Successfully updated ${config.entityType} "${entityName}" with location data`,
      );
      success += 1;

      // Add delay between API calls to respect rate limits
      await sleep(API_CONFIG.RATE_LIMIT_DELAY);
    } catch (error) {
      const entityName = entity[config.nameField];
      console.error(
        `Error processing ${config.entityType} "${entityName}":`,
        error,
      );
      failed += 1;

      // If it's a rate limit error, stop processing
      if (error instanceof Error && error.message.includes('rate limit')) {
        throw error;
      }
    }
  }

  return { success, failed, skipped };
}

/**
 * Generic function to seed location data for any entity type
 */
async function seedLocationData<T extends { id: string; [key: string]: any }>(
  entities: T[],
  config: LocationSearchConfig,
  apiKey: string,
): Promise<void> {
  try {
    console.log(
      `Starting to seed ${config.entityType} locations from Google Maps API...`,
    );

    if (entities.length === 0) {
      console.log(`No ${config.entityType}s found. Exiting.`);
      return;
    }

    // Process entities in batches
    const batches = [];
    for (let i = 0; i < entities.length; i += API_CONFIG.BATCH_SIZE) {
      batches.push(entities.slice(i, i + API_CONFIG.BATCH_SIZE));
    }

    console.log(
      `Processing ${entities.length} ${config.entityType}s in ${batches.length} batches`,
    );

    let totalSuccess = 0;
    let totalFailed = 0;
    let totalSkipped = 0;

    for (let i = 0; i < batches.length; i += 1) {
      const batch = batches[i];
      console.log(
        `Processing batch ${i + 1}/${batches.length} (${batch.length} ${config.entityType}s)`,
      );

      try {
        const result = await processLocationBatch(batch, config, apiKey);
        totalSuccess += result.success;
        totalFailed += result.failed;
        totalSkipped += result.skipped;

        console.log(
          `Batch ${i + 1} completed: ${result.success} success, ${result.failed} failed, ${result.skipped} skipped`,
        );

        // Add delay between batches
        if (i < batches.length - 1) {
          await sleep(API_CONFIG.RATE_LIMIT_DELAY * 2);
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('rate limit')) {
          console.error('Rate limit exceeded. Stopping processing.');
          break;
        }
        console.error(`Error processing batch ${i + 1}:`, error);
      }
    }

    const entityTypeCapitalized =
      config.entityType.charAt(0).toUpperCase() + config.entityType.slice(1);
    console.log(`\n=== ${entityTypeCapitalized} Location Seeding Summary ===`);
    console.log(`Total ${config.entityType}s processed: ${entities.length}`);
    console.log(`Successfully updated: ${totalSuccess}`);
    console.log(`Failed: ${totalFailed}`);
    console.log(`Skipped (already had data): ${totalSkipped}`);
    console.log('=====================================\n');
  } catch (error) {
    console.error(`Error seeding ${config.entityType} locations:`, error);
    throw error;
  }
}

/**
 * Export failed items to Excel file
 */
function exportFailedItemsToExcel(): void {
  try {
    // Create output directory if it doesn't exist
    mkdirSync(EXCEL_EXPORT_CONFIG.OUTPUT_DIR, { recursive: true });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = EXCEL_EXPORT_CONFIG.FILE_NAME_FORMAT.replace(
      '{timestamp}',
      timestamp,
    );
    const filepath = join(EXCEL_EXPORT_CONFIG.OUTPUT_DIR, filename);

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Add sheets for each entity type
    Object.entries(failedItemsCollection).forEach(
      ([entityType, failedItems]) => {
        if (failedItems.length > 0) {
          const sheetName =
            EXCEL_EXPORT_CONFIG.SHEET_NAMES[
              entityType as keyof typeof EXCEL_EXPORT_CONFIG.SHEET_NAMES
            ];

          // Convert failed items to worksheet data
          const worksheetData = failedItems.map((item) => ({
            'Entity ID': item.id,
            'Entity Name': item.name,
            'Entity Type': item.entityType,
            'Failure Reason': item.reason,
            Timestamp: item.timestamp.toISOString(),
          }));

          // Create worksheet
          const worksheet = XLSX.utils.json_to_sheet(worksheetData);

          // Add worksheet to workbook
          XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        }
      },
    );

    // Write workbook to file
    XLSX.writeFile(workbook, filepath);

    console.log(`\n=== Failed Items Export ===`);
    console.log(`Excel file saved to: ${filepath}`);
    console.log(`Total failed items exported:`);
    console.log(`- Countries: ${failedItemsCollection.countries.length}`);
    console.log(`- States: ${failedItemsCollection.states.length}`);
    console.log(`- Cities: ${failedItemsCollection.cities.length}`);
    console.log(`- Counties: ${failedItemsCollection.counties.length}`);
    console.log(`=====================================\n`);
  } catch (error) {
    console.error('Error exporting failed items to Excel:', error);
  }
}

/**
 * Clear the failed items collection
 */
function clearFailedItemsCollection(): void {
  failedItemsCollection.countries = [];
  failedItemsCollection.states = [];
  failedItemsCollection.cities = [];
  failedItemsCollection.counties = [];
}

/**
 * Seed country locations from Google Maps API
 */
export async function seedCountryLocations(): Promise<void> {
  try {
    const apiKey = process.env.MAPS_API_KEY;

    if (!apiKey) {
      throw new Error('MAPS_API_KEY environment variable is not set');
    }

    // Clear any previous failed countries
    failedItemsCollection.countries = [];

    // Get all countries from database
    const countries = await prisma.countries.findMany({
      select: {
        id: true,
        countryName: true,
        latitude: true,
        longitude: true,
        placeId: true,
      },
      where: {
        isDeleted: false,
      },
    });

    console.log(`Found ${countries.length} countries to process`);

    await seedLocationData(countries, LOCATION_SEARCH_CONFIGS.country, apiKey);

    // Export failed countries to Excel if any exist
    if (failedItemsCollection.countries.length > 0) {
      console.log(
        `\nExporting ${failedItemsCollection.countries.length} failed countries to Excel...`,
      );
      exportFailedItemsToExcel();
    } else {
      console.log('No failed countries to export.');
    }
  } catch (error) {
    console.error('Error seeding country locations:', error);
    throw error;
  }
}

/**
 * Seed state locations from Google Maps API
 */
export async function seedStateLocations(): Promise<void> {
  try {
    const apiKey = process.env.MAPS_API_KEY;

    if (!apiKey) {
      throw new Error('MAPS_API_KEY environment variable is not set');
    }

    // Clear any previous failed states
    failedItemsCollection.states = [];

    // Get all states from database
    const states = await prisma.states.findMany({
      select: {
        id: true,
        stateName: true,
        countryId: true,
        latitude: true,
        longitude: true,
        placeId: true,
      },
      where: {
        isDeleted: false,
      },
    });

    console.log(`Found ${states.length} states to process`);

    await seedLocationData(states, LOCATION_SEARCH_CONFIGS.state, apiKey);

    // Export failed states to Excel if any exist
    if (failedItemsCollection.states.length > 0) {
      console.log(
        `\nExporting ${failedItemsCollection.states.length} failed states to Excel...`,
      );
      exportFailedItemsToExcel();
    } else {
      console.log('No failed states to export.');
    }
  } catch (error) {
    console.error('Error seeding state locations:', error);
    throw error;
  }
}

/**
 * Seed city locations from Google Maps API
 */
export async function seedCityLocations(): Promise<void> {
  try {
    const apiKey = process.env.MAPS_API_KEY;

    if (!apiKey) {
      throw new Error('MAPS_API_KEY environment variable is not set');
    }

    // Clear any previous failed cities
    failedItemsCollection.cities = [];

    // Get all cities from database
    const cities = await prisma.cities.findMany({
      select: {
        id: true,
        cityName: true,
        stateId: true,
        latitude: true,
        longitude: true,
        placeId: true,
        state: {
          select: {
            stateName: true,
          },
        },
      },
      where: {
        isDeleted: false,
      },
    });

    console.log(`Found ${cities.length} cities to process`);

    await seedLocationData(cities, LOCATION_SEARCH_CONFIGS.city, apiKey);

    // Export failed cities to Excel if any exist
    if (failedItemsCollection.cities.length > 0) {
      console.log(
        `\nExporting ${failedItemsCollection.cities.length} failed cities to Excel...`,
      );
      exportFailedItemsToExcel();
    } else {
      console.log('No failed cities to export.');
    }
  } catch (error) {
    console.error('Error seeding city locations:', error);
    throw error;
  }
}

/**
 * Seed county locations from Google Maps API
 */
export async function seedCountyLocations(): Promise<void> {
  try {
    const apiKey = process.env.MAPS_API_KEY;

    if (!apiKey) {
      throw new Error('MAPS_API_KEY environment variable is not set');
    }

    // Clear any previous failed counties
    failedItemsCollection.counties = [];

    // Get all counties from database
    const counties = await prisma.county.findMany({
      select: {
        id: true,
        name: true,
        stateId: true,
        latitude: true,
        longitude: true,
        placeId: true,
        state: {
          select: {
            stateName: true,
          },
        },
      },
    });

    console.log(`Found ${counties.length} counties to process`);

    await seedLocationData(counties, LOCATION_SEARCH_CONFIGS.county, apiKey);

    // Export failed counties to Excel if any exist
    if (failedItemsCollection.counties.length > 0) {
      console.log(
        `\nExporting ${failedItemsCollection.counties.length} failed counties to Excel...`,
      );
      exportFailedItemsToExcel();
    } else {
      console.log('No failed counties to export.');
    }
  } catch (error) {
    console.error('Error seeding county locations:', error);
    throw error;
  }
}

/**
 * Seed all location data (countries, states, cities, counties)
 */
export async function seedAllLocations(): Promise<void> {
  try {
    console.log('Starting to seed all location data...');

    // Clear any previous failed items
    clearFailedItemsCollection();

    await seedCountryLocations();
    await seedStateLocations();
    await seedCityLocations();
    await seedCountyLocations();

    console.log('All location data seeding completed!');

    // Note: Each individual seed function now handles its own Excel export
    // so no need to export here as it's already done per entity type
  } catch (error) {
    console.error('Error seeding all locations:', error);
    throw error;
  }
}

/**
 * Check location data status for all entity types
 */
// export async function checkAllLocationStatus(): Promise<void> {
//   try {
//     console.log('Checking location data status for all entities...');

//     // Check countries
//     const countries = await prisma.countries.findMany({
//       select: {
//         countryName: true,
//         latitude: true,
//         longitude: true,
//         placeId: true,
//       },
//       where: {
//         isDeleted: false,
//       },
//     });

//     const countriesWithLocation = countries.filter(
//       (c) => c.latitude && c.longitude && c.placeId,
//     );
//     const countriesWithoutLocation = countries.filter(
//       (c) => !c.latitude || !c.longitude || !c.placeId,
//     );

//     console.log(
//       `Countries with complete location data: ${countriesWithLocation.length}`,
//     );
//     console.log(
//       `Countries missing location data: ${countriesWithoutLocation.length}`,
//     );

//     // Check states
//     const states = await prisma.states.findMany({
//       select: {
//         stateName: true,
//         latitude: true,
//         longitude: true,
//         placeId: true,
//       },
//       where: {
//         isDeleted: false,
//       },
//     });

//     const statesWithLocation = states.filter(
//       (s) => s.latitude && s.longitude && s.placeId,
//     );
//     const statesWithoutLocation = states.filter(
//       (s) => !s.latitude || !s.longitude || !s.placeId,
//     );

//     console.log(
//       `States with complete location data: ${statesWithLocation.length}`,
//     );
//     console.log(
//       `States missing location data: ${statesWithoutLocation.length}`,
//     );

//     // Check cities
//     const cities = await prisma.cities.findMany({
//       select: {
//         cityName: true,
//         latitude: true,
//         longitude: true,
//         placeId: true,
//       },
//       where: {
//         isDeleted: false,
//       },
//     });

//     const citiesWithLocation = cities.filter(
//       (c) => c.latitude && c.longitude && c.placeId,
//     );
//     const citiesWithoutLocation = cities.filter(
//       (c) => !c.latitude || !c.longitude || !c.placeId,
//     );

//     console.log(
//       `Cities with complete location data: ${citiesWithLocation.length}`,
//     );
//     console.log(
//       `Cities missing location data: ${citiesWithoutLocation.length}`,
//     );

//     // Check counties
//     const counties = await prisma.county.findMany({
//       select: {
//         name: true,
//         latitude: true,
//         longitude: true,
//         placeId: true,
//       },
//     });

//     const countiesWithLocation = counties.filter(
//       (c) => c.latitude && c.longitude && c.placeId,
//     );
//     const countiesWithoutLocation = counties.filter(
//       (c) => !c.latitude || !c.longitude || !c.placeId,
//     );

//     console.log(
//       `Counties with complete location data: ${countiesWithLocation.length}`,
//     );
//     console.log(
//       `Counties missing location data: ${countiesWithoutLocation.length}`,
//     );

//     // Summary
//     console.log('\n=== Overall Location Data Status ===');
//     console.log(
//       `Total entities: ${countries.length + states.length + cities.length + counties.length}`,
//     );
//     console.log(
//       `With location data: ${countriesWithLocation.length + statesWithLocation.length + citiesWithLocation.length + countiesWithLocation.length}`,
//     );
//     console.log(
//       `Missing location data: ${countriesWithoutLocation.length + statesWithoutLocation.length + citiesWithoutLocation.length + countiesWithoutLocation.length}`,
//     );
//     console.log('=====================================\n');
//   } catch (error) {
//     console.error('Error checking location status:', error);
//     throw error;
//   }
// }

// // Legacy function names for backward compatibility
// export const checkStateLocationStatus = () => checkAllLocationStatus();
