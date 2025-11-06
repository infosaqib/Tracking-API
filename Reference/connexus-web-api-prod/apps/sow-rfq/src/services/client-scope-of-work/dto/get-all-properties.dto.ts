import { PaginationDto } from '@app/shared/dto/pagination.dto';
import { PickType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetAllPropertiesDto extends PickType(PaginationDto, [
  'sort',
  'sortDirection',
]) {
  @IsString()
  @IsOptional()
  selectedScopeOfWorkId: string;
}
