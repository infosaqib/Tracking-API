import { Prisma } from '@prisma/client';

export interface PropertyExportData {
  id: string;
  name: string;
  address: string;
  status: string;
  client: {
    id: string;
    name: string;
  } | null;
  state: {
    id: string;
    stateName: string;
  } | null;
  city: {
    id: string;
    cityName: string;
  } | null;
  county: {
    id: string;
    name: string;
  } | null;
  propertyManager: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

// PropertyExportFilters is actually a Prisma where clause built in the service layer
export type PropertyExportFilters = Prisma.ClientPropertiesWhereInput;
