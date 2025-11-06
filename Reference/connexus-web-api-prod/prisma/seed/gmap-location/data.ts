export const GOOGLE_MAPS_API_BASE_URL =
  'https://maps.googleapis.com/maps/api/place/textsearch/json';

export const API_CONFIG = {
  // Delay between API calls to respect rate limits (in milliseconds)
  RATE_LIMIT_DELAY: 200,
  // Maximum retries for failed requests
  MAX_RETRIES: 3,
  // Batch size for processing entities
  BATCH_SIZE: 20,
  // Retry delay multiplier for exponential backoff
  RETRY_DELAY_MULTIPLIER: 2,
};

export const EXCEL_EXPORT_CONFIG = {
  // Directory to save Excel files
  OUTPUT_DIR: './failed-items-export',
  // File name format
  FILE_NAME_FORMAT: 'failed-locations-{timestamp}.xlsx',
  // Sheet names for different entity types
  SHEET_NAMES: {
    country: 'Failed Countries',
    state: 'Failed States',
    city: 'Failed Cities',
    county: 'Failed Counties',
  },
};

export const SEARCH_QUERY_SUFFIX = ' United States';

// State abbreviation to full name mapping for better Google Maps API searches
export const STATE_ABBREVIATION_MAP: Record<string, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
  DC: 'District of Columbia',
  AS: 'American Samoa',
  GU: 'Guam',
  MP: 'Northern Mariana Islands',
  PR: 'Puerto Rico',
  VI: 'U.S. Virgin Islands',
};

// Special territories and overseas regions that might need different search strategies
export const SPECIAL_TERRITORIES: Record<string, string> = {
  Bonaire: 'Bonaire, Caribbean Netherlands',
  Azores: 'Azores, Portugal',
  Canarias: 'Canary Islands, Spain',
  'Glorioso Islands': 'Glorioso Islands, France',
  'Juan De Nova Island': 'Juan de Nova Island, France',
  Madeira: 'Madeira, Portugal',
  Saba: 'Saba, Caribbean Netherlands',
  'Saint Eustatius': 'Saint Eustatius, Caribbean Netherlands',
};

export const LOCATION_SEARCH_CONFIGS = {
  country: {
    entityType: 'country' as const,
    tableName: 'countries',
    nameField: 'countryName',
    idField: 'id',
    types: ['country', 'administrative_area_level_1', 'locality', 'political'],
  },
  state: {
    entityType: 'state' as const,
    tableName: 'states',
    nameField: 'stateName',
    idField: 'id',
    types: ['administrative_area_level_1', 'political'],
    searchSuffix: ' State, United States',
  },
  city: {
    entityType: 'city' as const,
    tableName: 'cities',
    nameField: 'cityName',
    idField: 'id',
    types: ['locality'],
    searchSuffix: '',
  },
  county: {
    entityType: 'county' as const,
    tableName: 'county',
    nameField: 'name',
    idField: 'id',
    types: ['administrative_area_level_2'],
    searchSuffix: '',
  },
} as const;

export const API_STATUS = {
  OK: 'OK',
  ZERO_RESULTS: 'ZERO_RESULTS',
  OVER_QUERY_LIMIT: 'OVER_QUERY_LIMIT',
  REQUEST_DENIED: 'REQUEST_DENIED',
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ApiStatus = (typeof API_STATUS)[keyof typeof API_STATUS];
