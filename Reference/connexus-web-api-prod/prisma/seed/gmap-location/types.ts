export interface GoogleMapsLocation {
  lat: number;
  lng: number;
}

export interface GoogleMapsViewport {
  northeast: GoogleMapsLocation;
  southwest: GoogleMapsLocation;
}

export interface GoogleMapsGeometry {
  location: GoogleMapsLocation;
  viewport: GoogleMapsViewport;
}

export interface GoogleMapsPhoto {
  height: number;
  html_attributions: string[];
  photo_reference: string;
  width: number;
}

export interface GoogleMapsResult {
  formatted_address: string;
  geometry: GoogleMapsGeometry;
  icon: string;
  icon_background_color: string;
  icon_mask_base_uri: string;
  name: string;
  photos: GoogleMapsPhoto[];
  place_id: string;
  reference: string;
  types: string[];
}

export interface GoogleMapsResponse {
  html_attributions: string[];
  results: GoogleMapsResult[];
  status: string;
}

export interface StateLocationData {
  id: string;
  stateName: string;
  countryId: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
}

export interface CountryLocationData {
  id: string;
  countryName: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
}

export interface CityLocationData {
  id: string;
  cityName: string;
  stateId: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
}

export interface CountyLocationData {
  id: string;
  name: string;
  stateId: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
}

export type LocationEntityType = 'country' | 'state' | 'city' | 'county';

export interface LocationSearchConfig {
  entityType: LocationEntityType;
  tableName: string;
  nameField: string;
  idField: string;
  types: readonly string[];
  searchSuffix?: string;
}

export interface FailedItem {
  id: string;
  name: string;
  entityType: LocationEntityType;
  reason: string;
  timestamp: Date;
}

export interface FailedItemsCollection {
  countries: FailedItem[];
  states: FailedItem[];
  cities: FailedItem[];
  counties: FailedItem[];
}
