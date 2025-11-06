import { PaginationDto } from '@app/shared/dto/pagination.dto';
import { ContractTypes } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class GetContractDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ContractTypes)
  contractType?: ContractTypes;
}
