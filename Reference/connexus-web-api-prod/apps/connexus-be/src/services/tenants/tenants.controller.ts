import { RouteController } from '@app/shared';
import { Get, Query } from '@nestjs/common';
import { SearchTenantDto } from './dto/search-tenant.dto';
import { TenantsService } from './tenants.service';

@RouteController('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('/search')
  tenantSearch(@Query() getTenantDto: SearchTenantDto) {
    return this.tenantsService.tenantSearch(getTenantDto);
  }
}
