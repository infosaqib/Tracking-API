import { storageFolderNames } from './storage-folder-names';

/**
 * Generate the S3 key for a SOW versioned file.
 * @param params - Required IDs and file name
 * @returns S3 key string
 */
export function getSowVersionS3Key(params: {
  scopeOfWorkId: string;
  fileName: string;
  versionId: string;
  scopeOfWorkPropertyId?: string;
}): string {
  const { scopeOfWorkId, fileName, versionId, scopeOfWorkPropertyId } = params;
  if (scopeOfWorkPropertyId) {
    return `${storageFolderNames.private}/${storageFolderNames.scopeOfWork}/${scopeOfWorkId}/${scopeOfWorkPropertyId}/${versionId}/${fileName}`;
  }
  return `${storageFolderNames.private}/${storageFolderNames.scopeOfWork}/${scopeOfWorkId}/${versionId}/${fileName}`;
}
