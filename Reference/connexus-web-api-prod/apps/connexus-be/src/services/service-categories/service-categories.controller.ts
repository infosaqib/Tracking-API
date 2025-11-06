import { Actions, caslSubjects } from '@app/ability';
import { RouteController } from '@app/shared';
import { Body, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { CheckPermission } from 'src/decorator/check-permission/check-permission.decorator';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { GetServiceCategoriesDto } from './dto/get-service-categories.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';
import { ServiceCategoriesService } from './service-categories.service';

@ApiTags('Service Categories')
@RouteController('service-categories', {})
export class ServiceCategoriesController {
  constructor(
    private readonly serviceCategoriesService: ServiceCategoriesService,
  ) {}

  @Post()
  @CheckPermission(caslSubjects.Service, Actions.Create)
  create(@Body() input: CreateServiceCategoryDto) {
    return this.serviceCategoriesService.create(input);
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Service categories retrieved successfully',
  })
  @CheckPermission(caslSubjects.Service, Actions.Read)
  findAll(@Query() input: GetServiceCategoriesDto) {
    return this.serviceCategoriesService.findAll(input);
  }

  @Get(':id')
  @CheckPermission(caslSubjects.Service, Actions.Read)
  findOne(@Param('id') id: string) {
    return this.serviceCategoriesService.findOne(id);
  }

  @Patch(':id')
  @CheckPermission(caslSubjects.Service, Actions.Update)
  update(@Param('id') id: string, @Body() input: UpdateServiceCategoryDto) {
    return this.serviceCategoriesService.update(id, input);
  }

  @Delete(':id')
  @CheckPermission(caslSubjects.Service, Actions.Delete)
  remove(@Param('id') id: string) {
    return this.serviceCategoriesService.remove(id);
  }
}
