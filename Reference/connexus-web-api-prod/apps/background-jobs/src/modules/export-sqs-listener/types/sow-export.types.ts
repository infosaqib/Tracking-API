import { Prisma } from '@prisma/client';

export interface SowExportData {
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
  scopeOfWorkVersion: SowVersionData[];
}

export interface SowVersionData {
  id: string;
  versionNumber: number;
  fileName: string;
  sourceFileUrl: string;
  content: string;
  createdAt: Date;
  createdBy: {
    id: string;
    fullName: string;
  } | null;
}

// SowExportFilters is actually a Prisma where clause built in the service layer
export type SowExportFilters = Prisma.ScopeOfWorkWhereInput;
