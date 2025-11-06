import { PartialType } from '@nestjs/swagger';
import { CreateOnlyOfficeDto } from './create-only-office.dto';

export class UpdateOnlyOfficeDto extends PartialType(CreateOnlyOfficeDto) {}
