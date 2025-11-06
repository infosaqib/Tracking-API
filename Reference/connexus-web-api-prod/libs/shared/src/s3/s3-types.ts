/**
 * S3 configuration options.
 */
export interface S3Config {
  readonly region: string;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
  readonly bucket: string;
}

/**
 * Input for uploading a file to S3.
 */
export interface UploadFileInput {
  readonly key: string;
  readonly body: Buffer | Uint8Array | Blob | string;
  readonly contentType?: string;
}

/**
 * Output for uploading a file to S3.
 */
export interface UploadFileOutput {
  readonly url: string;
}

/**
 * Input for getting a file from S3.
 */
export interface GetFileInput {
  readonly key: string;
}

/**
 * Output for getting a file from S3.
 */
export interface GetFileOutput {
  readonly body: Buffer;
  readonly contentType?: string;
}

/**
 * Input for generating a signed URL.
 */
export interface GenerateSignedUrlInput {
  readonly key: string;
  readonly expiresInSeconds?: number;
  readonly contentType?: string;
}

/**
 * Output for generating a signed URL.
 */
export interface GenerateSignedUrlOutput {
  readonly url: string;
}

/**
 * Input for copying a file to multiple locations in S3.
 */
export interface CopyFileInput {
  readonly sourceKey: string;
  readonly destinationKeys: string[];
}

/**
 * Output for copying a file to multiple locations in S3.
 */
export interface CopyFileOutput {
  readonly destinationKeys: string[];
  readonly urls: string[];
}
