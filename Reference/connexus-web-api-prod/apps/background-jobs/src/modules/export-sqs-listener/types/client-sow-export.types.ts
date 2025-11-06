import { Prisma } from '@prisma/client';

export interface ClientSowExportData {
  id: string;
  scopeName: string;
  scopeType: string;
  scopeOfWorkStatus: string;
  createdAt: Date;
  updatedAt: Date;
  service: {
    id: string;
    servicesName: string;
  } | null;
  client: {
    id: string;
    name: string;
  } | null;
  createdBy: {
    id: string;
    fullName: string;
  } | null;
  modifiedBy: {
    id: string;
    fullName: string;
  } | null;
  scopeOfWorkProperty: {
    id: string;
    property: {
      id: string;
      name: string;
    } | null;
  }[];
}

// ClientSowExportFilters is a Prisma where clause built in the service layer
export type ClientSowExportFilters = Prisma.ScopeOfWorkWhereInput;
