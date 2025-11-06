import { RouteController } from '@app/shared';
import {
  Body,
  InternalServerErrorException,
  Logger,
  Post,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { SaveOnlyOfficeDocDto } from './dto/create-only-office.dto';
import { OnlyOfficeService } from './only-office.service';

@RouteController('only-office', {
  security: 'public',
})
export class OnlyOfficeController {
  constructor(private readonly onlyOfficeService: OnlyOfficeService) {}

  private readonly logger = new Logger(OnlyOfficeController.name);

  /**
   * Save OnlyOffice data callback.
   */
  @Post('/save')
  @ApiOperation({ summary: 'Save OnlyOffice data callback' })
  @ApiResponse({ status: 200, description: 'Save result' })
  @UsePipes(
    new ValidationPipe({
      whitelist: false,
    }),
  )
  async save(
    @Body() createOnlyOfficeDto: SaveOnlyOfficeDocDto,
    @Res() res: Response,
  ) {
    try {
      const result =
        await this.onlyOfficeService.saveDocument(createOnlyOfficeDto);

      if (result.error) {
        this.logger.error(result.message);
      }

      res.status(200).json(result);
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Internal server error', error);
    }
  }
}
