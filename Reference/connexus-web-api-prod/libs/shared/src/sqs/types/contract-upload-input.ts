import { ExportRequestTypes } from '@app/export-data/dto';
import { ExportFileTypes, ScopeOfWorkTypes } from '@prisma/client';

export interface ContractUploadInput {
  filePath: string;
  clientId: string;
  jobId: string;
  createdById: string;
}

export type SqsMessageInput = {
  jobType: 'AI_CONTRACT_PROCESSING';
  input: ContractUploadInput;
};

export interface ZipUploadInput {
  filePath: string;
  clientId: string;
  jobId: string;
  createdById: string;
  tenantId: string;
}

export type ZipSqsMessageInput = {
  jobType: 'ZIP_EXTRACTION_PROCESSING';
  input: ZipUploadInput;
};

export interface SowDocumentUploadInput {
  filePath: string;
  tenantId: string;
  scopeId: string;
  type: ScopeOfWorkTypes;
  version: number;
  versionId: string;
}

export interface ClientScopeOfWorkDocumentUploadInput {
  jobType: 'CLIENT_SCOPE_OF_WORK_DOCUMENT_PROCESSING';
  input: {
    jobType: string;
    filePath: string;
    tenantId: string;
    scopeId: string;
    scopeOfWorkVersionIds: string[];
  };
}

export interface SowDocumentSqsMessageInput {
  jobType: 'SCOPE_OF_WORK_DOCUMENT_PROCESSING';
  input: SowDocumentUploadInput;
}

export interface GenerateSowDocTemplateInput {
  jobType: 'GENERATE_SOW_DOCX_TEMPLATE' | 'GENERATE_SOW_PDF_TEMPLATE';
  input: {
    taskId: string;
  };
}

export interface GenerateRfpDocTemplateInput {
  jobType: 'GENERATE_RFP_DOCX_TEMPLATE' | 'GENERATE_RFP_PDF_TEMPLATE';
  input: {
    taskId: string;
  };
}

export interface ExportTableInput {
  fileType: ExportFileTypes;
  type: ExportRequestTypes;
  exportId: string;
  userId: string;
  filters?: Record<string, any>;
  sort?: object;
}

export interface ExportTableSqsMessageInput {
  message: 'TABLE_EXPORT';
  data: ExportTableInput;
}
