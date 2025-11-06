import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsBoolean, IsArray } from 'class-validator';
import { ProductStatus, ProductVisibility } from '@prisma/client';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  subcategoryId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  priceCurrent: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  priceOriginal?: number;

  @ApiProperty({ required: false, default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ enum: ProductStatus, default: 'draft' })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiProperty({ enum: ProductVisibility, default: 'public' })
  @IsOptional()
  @IsEnum(ProductVisibility)
  visibility?: ProductVisibility;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  tags?: string[];
}

