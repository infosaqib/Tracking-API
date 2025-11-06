import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

/**
 * @typedef {object} SaveOnlyOfficeDoc
 *
 * @example
 * {
 *   "key": "string",
 *   "status": 2,
 *   "url": "https://...",
 *   "changesurl": "https://...",
 *   "history": {},
 *   "users": ["userId1"],
 *   "actions": [],
 *   "lastsave": "2024-06-07T12:34:56Z",
 *   "notmodified": false,
 *   "forcesavetype": 0,
 *   "userdata": {},
 *   "token": "string",
 *   "error": 0,
 *   "filetype": "docx",
 *   "filename": "document.docx"
 * }
 */

export interface OnlyOfficeHistory {
  /**
   * List of changes for this version (structure may vary by OnlyOffice version).
   */
  changes?: {
    user: {
      id: string;
      name: string;
    };
  }[];
  /**
   * Server version number for this document version.
   */
  serverVersion?: number;
}

/**
 * DTO for OnlyOffice save callback.
 */
export class SaveOnlyOfficeDocDto {
  /**
   * Status of the OnlyOffice save event.
   */
  @ApiProperty({ description: 'Status of the OnlyOffice save event.' })
  @IsInt()
  status: number;

  /**
   * URL of the file to download.
   */
  @ApiProperty({ description: 'URL of the file to download.' })
  @IsString()
  @IsOptional()
  url?: string;

  /**
   * Name of the file to save in S3.
   */
  @ApiProperty({ description: 'Name of the file to save in S3.' })
  @IsString()
  @IsOptional()
  filename?: string;

  /**
   * JWT token for OnlyOffice callback validation.
   */
  @ApiProperty({ description: 'JWT token for OnlyOffice callback validation.' })
  @IsString()
  @IsOptional()
  token?: string;

  /**
   * Unique document key from OnlyOffice.
   */
  @ApiProperty({ description: 'Unique document key from OnlyOffice.' })
  @IsString()
  @IsOptional()
  key?: string;

  /**
   * Document history from OnlyOffice callback.
   */
  @ApiProperty({
    description: 'Document history from OnlyOffice callback.',
    required: false,
    type: 'object',
  })
  @IsOptional()
  history?: OnlyOfficeHistory;
}
