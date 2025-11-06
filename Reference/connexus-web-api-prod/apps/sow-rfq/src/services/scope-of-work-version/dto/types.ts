export interface OnlyOfficeVersioningInput {
  scopeOfWorkId: string;
  scopeOfWorkPropertyId?: string; // present for property versioning
  fileName: string;
  buffer: Buffer;
  contentType?: string;
  userId: string;
  scopeOfWorkVersionId: string;
  shouldCreateNewVersion: boolean; // determines whether to update existing or create new version
}
