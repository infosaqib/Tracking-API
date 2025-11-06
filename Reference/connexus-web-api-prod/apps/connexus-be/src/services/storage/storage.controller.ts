import { RouteController } from '@app/shared';
import { Body, Get, Param, Post } from '@nestjs/common';
import { BackgroundJobsService } from 'src/services/background-jobs/background-jobs.service';
import { CreateDownloadUrlDto } from './dto/create-download-url.dto';
import { CreateSignedUrlDto } from './dto/create-signed-url.dto';
import { StorageService } from './storage.service';

@RouteController('storage', {
  security: 'protected',
})
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
    private readonly backgroundJobsService: BackgroundJobsService,
  ) {}

  @Get('/file/:key')
  async getFile(@Param('key') key: string) {
    return this.storageService.getFile(key);
  }

  @Post('/create-presigned-url')
  async getSignedUrl(@Body() body: CreateSignedUrlDto) {
    if (body.fileHash) {
      const existingFile = await this.backgroundJobsService.checkFileExists(
        body.fileHash,
        body.resourceId,
      );

      if (existingFile) {
        return {
          exists: true,
          message: 'File already exists',
          fileInfo: {
            id: existingFile.id,
          },
        };
      }
    }

    return this.storageService.generateSignedUrl(body);
  }

  @Post('/create-download-url')
  async getDownloadUrl(@Body() body: CreateDownloadUrlDto) {
    return this.storageService.generateDownloadUrl(body);
  }
}
