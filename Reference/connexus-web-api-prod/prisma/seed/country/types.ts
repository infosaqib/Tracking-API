// Interface for PostGIS geometry type
export interface MultiPolygon {
  type: 'MultiPolygon';
  coordinates: number[][][][];
  crs: {
    type: string;
    properties: {
      name: string;
    };
  };
}

export interface Country {
  id: string;
  countryName: string;
  geom: MultiPolygon | null;
}

export interface State {
  id: string;
  stateName: string;
  countryId: string;
  geom: MultiPolygon | null;
}

export interface City {
  id: string;
  cityName: string;
  stateId: string;
  geom: MultiPolygon | null;
}
