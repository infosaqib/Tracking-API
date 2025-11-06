/**
 * JWT payload for OnlyOffice document editing
 */
export interface OnlyOfficeJwtPayload {
  document: {
    title: string;
    url: string;
    fileType: string;
    key: string;
  };
  editorConfig: {
    callbackUrl: string;
    mode: string;
    user: {
      id: string;
      name: string;
    };
  };
  permissions: {
    edit: boolean;
    download: boolean;
  };
  custom: {
    filePath: string;
  };
}

export interface SaveOnlyOfficeResult {
  error: number;
  message?: string;
}

export interface OnlyOfficeEditPayload {
  documentType: string;
  type: string;
  width: string;
  height: string;
  token: string;
  document: {
    fileType: string;
    key: string;
    title: string;
    url: string;
  };
  editorConfig: {
    callbackUrl: string;
    mode: string;
    user: {
      id: string;
      name: string;
    };
    customization: {
      forcesave: boolean;
      autosave: boolean;
      toolbarNoTabs: boolean;
    };
  };
  permissions: {
    edit: boolean;
    download: boolean;
  };
}
