import { GetRequestUser, RequestUser, RouteController } from '@app/shared';
import { Body, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CheckDuplicateRfpPropertyAttachmentDto } from './dto/check-duplicate-rfp-property-attachment.dto';
import { CreateRfpPropertyAttachmentDto } from './dto/create-rfp-property-attachment.dto';
import { GetRfpPropertyAttachmentsDto } from './dto/get-rfp-property-attachments.dto';
import { UpdateRfpPropertyAttachmentDto } from './dto/update-rfp-property-attachment.dto';
import { RfpPropertyAttachmentsService } from './rfp-property-attachments.service';

@RouteController('rfp-property-attachments', {
  useBigIntSerializer: true,
})
export class RfpPropertyAttachmentsController {
  constructor(
    private readonly rfpPropertyAttachmentsService: RfpPropertyAttachmentsService,
  ) {}

  @Post()
  create(
    @Body() createRfpPropertyAttachmentDto: CreateRfpPropertyAttachmentDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.rfpPropertyAttachmentsService.create(
      createRfpPropertyAttachmentDto,
      user,
    );
  }

  @Get()
  findAll(@Query() query: GetRfpPropertyAttachmentsDto) {
    return this.rfpPropertyAttachmentsService.findAll(query);
  }

  @Get('duplicate-check')
  checkDuplicate(@Query() query: CheckDuplicateRfpPropertyAttachmentDto) {
    return this.rfpPropertyAttachmentsService.checkDuplicateByHash(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rfpPropertyAttachmentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRfpPropertyAttachmentDto: UpdateRfpPropertyAttachmentDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.rfpPropertyAttachmentsService.update(
      id,
      updateRfpPropertyAttachmentDto,
      user,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetRequestUser() user: RequestUser) {
    return this.rfpPropertyAttachmentsService.remove(id, user);
  }
}
