import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod, Carrier } from '@prisma/client';

class OrderItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;

  @ApiProperty()
  @IsNumber()
  price: number;

  @ApiProperty()
  @IsNumber()
  total: number;

  @ApiProperty({ required: false, default: [] })
  @IsOptional()
  @IsArray()
  attributes?: any[];
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  paymentTax?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  paymentShipping?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  paymentDiscount?: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  shippingFirstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  shippingLastName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  shippingCompany?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  shippingStreet: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  shippingCity: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  shippingState: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  shippingZipCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  shippingCountry: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  shippingPhone?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  shippingMethod: string;

  @ApiProperty({ enum: Carrier, required: false })
  @IsOptional()
  @IsEnum(Carrier)
  shippingCarrier?: Carrier;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  shippingTrackingNumber?: string;
}

