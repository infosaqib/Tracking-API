import { GetRequestUser, RequestUser, RouteController } from '@app/shared';
import { Delete, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';
import { ValidatedBody } from 'src/decorator/validation/validated-body.decorator';
import { ValidatedQuery } from 'src/decorator/validation/validated-query.decorator';
import { setBackgroundJobsExportResponseHeaders } from 'src/utils/file-export-utils';
import { BackgroundJobsService } from './background-jobs.service';
import { CreateBackgroundJobDto } from './dto/create-background-job.dto';
import { ExportBackgroundJobsDto } from './dto/export-background-jobs.dto';
import { GetJobsDto } from './dto/get-jobs.dto';
import { GetUploadedUserDto } from './dto/get-uploaded-user.dto';
import { UpdateBackgroundJobDto } from './dto/update-background-job.dto';

@RouteController('background-jobs')
export class BackgroundJobsController {
  constructor(private readonly backgroundJobsService: BackgroundJobsService) {}

  @Post()
  create(
    @ValidatedBody() createBackgroundJobDto: CreateBackgroundJobDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.backgroundJobsService.create(createBackgroundJobDto, user);
  }

  @Get()
  findAll(
    @ValidatedQuery() query: GetJobsDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.backgroundJobsService.findAll(query, user);
  }

  @Get('/export')
  async exportBackgroundJobs(
    @Query() query: ExportBackgroundJobsDto,
    @GetRequestUser() user: RequestUser,
    @Res() response: any,
  ) {
    const data = await this.backgroundJobsService.exportBackgroundJobs({
      query,
      user,
    });

    setBackgroundJobsExportResponseHeaders(response, query.format);
    response.send(data);
  }

  @Get('/uploaded-user')
  findUploadedUser(
    @ValidatedQuery() query: GetUploadedUserDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.backgroundJobsService.findUploadedUser(query, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.backgroundJobsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @ValidatedBody() updateBackgroundJobDto: UpdateBackgroundJobDto,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.backgroundJobsService.update(id, updateBackgroundJobDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetRequestUser() user: RequestUser) {
    return this.backgroundJobsService.remove(id, user);
  }
}
