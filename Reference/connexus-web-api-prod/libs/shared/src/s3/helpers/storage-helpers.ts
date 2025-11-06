import { v4 as uuidV4 } from 'uuid';
import { storageFolderNames } from './storage-folder-names';

export enum AccessLevel {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export enum SignedUrlExpiresIn {
  ONE_HOUR = 3600,
  ONE_DAY = 86400,
  ONE_WEEK = 604800,
  ONE_MONTH = 2592000,
}

export enum FileType {
  png = 'png',
  jpg = 'jpg',
  jpeg = 'jpeg',
  gif = 'gif',
  svg = 'svg',
  pdf = 'pdf',
  doc = 'doc',
  docx = 'docx',
  PNG = 'PNG',
  JPG = 'JPG',
  JPEG = 'JPEG',
  GIF = 'GIF',
  SVG = 'SVG',
  PDF = 'PDF',
  DOC = 'DOC',
  DOCX = 'DOCX',
  ZIP = 'zip',
  MSZIP = 'x-zip-compressed',
  // Excel and sheets
  XLS = 'xls',
  XLSX = 'xlsx',
  XLSM = 'xlsm',
  XLSB = 'xlsb',
  XLT = 'xlt',
  XLTM = 'xltm',
  MD = 'md',
}

export enum UploadType {
  CLIENT_LOGO = 'client_logo',
  VENDOR_LOGO = 'vendor_logo',
  VENDOR_W9 = 'vendor_w9',
  VENDOR_CERTIFICATE_OF_INSURANCE = 'vendor_certificate_of_insurance',
  AI_CONTRACT_DOCUMENT = 'ai_contract_document',
  AI_CONTRACTS_ZIP = 'ai_contracts_zip',
  SCOPE_OF_WORK = 'scope_of_work',
  RFP_PROPERTY_ATTACHMENT = 'rfp_property_attachment',
  RFP_ATTACHMENT = 'rfp_attachment',
  CLIENT_HEADER_IMAGE = 'client_header_image',
  SOW_TEMPLATE = 'sow_template',
  RFP_TEMPLATE = 'rfp_template',
}

export const getStorageKey = (input: {
  resourceId: string;
  fileType: FileType;
  uploadType: UploadType;
  accessLevel: AccessLevel;
  fileName?: string;
}) => {
  const { resourceId, fileType, uploadType, accessLevel, fileName } = input;

  const uploadTypePathMap: Record<UploadType, string> = {
    [UploadType.CLIENT_LOGO]: `${storageFolderNames.clients}/${resourceId}/${storageFolderNames.logo}`,
    [UploadType.VENDOR_LOGO]: `${storageFolderNames.vendors}/${resourceId}/${storageFolderNames.logo}`,
    [UploadType.VENDOR_W9]: `${storageFolderNames.vendors}/${resourceId}/${storageFolderNames.w9}`,
    [UploadType.VENDOR_CERTIFICATE_OF_INSURANCE]: `${storageFolderNames.vendors}/${resourceId}/${storageFolderNames.certificateOfInsurance}`,
    [UploadType.AI_CONTRACT_DOCUMENT]: `${storageFolderNames.clients}/${resourceId}/${storageFolderNames.aiContractDocument}`,
    [UploadType.AI_CONTRACTS_ZIP]: `${storageFolderNames.clients}/${resourceId}/${storageFolderNames.aiContractsZip}`,
    [UploadType.SCOPE_OF_WORK]: `${storageFolderNames.clients}/${resourceId}/${storageFolderNames.scopeOfWork}`,
    [UploadType.RFP_PROPERTY_ATTACHMENT]: `${storageFolderNames.scopeOfWork}/${resourceId}/${storageFolderNames.rfpPropertyAttachment}`,
    [UploadType.RFP_ATTACHMENT]: `${storageFolderNames.rfp}/${resourceId}/${storageFolderNames.rfpAttachment}`,
    [UploadType.CLIENT_HEADER_IMAGE]: `${storageFolderNames.clients}/${resourceId}/${storageFolderNames.headerImage}`,
    [UploadType.SOW_TEMPLATE]: `${storageFolderNames.sowTemplate}/${resourceId}`,
    [UploadType.RFP_TEMPLATE]: `${storageFolderNames.rfpTemplate}/${resourceId}`,
  };

  let fileNamePart = '';

  if (fileName) {
    // Omit the file extension from the fileName comparing to fileType
    fileNamePart = `${uuidV4()}___${fileName.split('.').slice(0, -1).join('.')}.${fileType}`;
  } else {
    fileNamePart = `${uuidV4()}.${fileType}`;
  }

  fileNamePart = fileNamePart
    .replace(/[/\s\\()[\]{}!@#$%^&*+=\\|;:'"<>,?]/g, '-') // Removed redundant escaping
    .replace(/-+/g, '-'); // Removed redundant hyphens

  const storageKeyParts = [
    accessLevel === AccessLevel.PUBLIC
      ? storageFolderNames.public
      : storageFolderNames.private,
    uploadTypePathMap[uploadType],
    fileNamePart,
  ];

  return storageKeyParts.join('/');
};
