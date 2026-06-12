import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum CreateOrderFulfillmentType {
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
}

class CreateOrderCustomerDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsString()
  @MaxLength(40)
  phone!: string;

  @IsEmail()
  @MaxLength(160)
  email!: string;
}

class CreateOrderAddressDto {
  @IsString()
  @MaxLength(180)
  addressLine1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  addressLine2?: string;

  @IsString()
  @MaxLength(80)
  city!: string;

  @IsString()
  @MaxLength(80)
  state!: string;

  @IsString()
  @MaxLength(20)
  postcode!: string;
}

class CreateOrderItemAddOnDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsInt()
  @Min(0)
  priceCents!: number;
}

class CreateOrderItemDto {
  @IsString()
  productId!: string;

  @IsString()
  @MaxLength(160)
  productName!: string;

  @IsOptional()
  @IsString()
  productImageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  sizeName?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sizePriceCents?: number;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsInt()
  @Min(0)
  unitPriceCents!: number;

  @IsInt()
  @Min(0)
  lineTotalCents!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemAddOnDto)
  addOns!: CreateOrderItemAddOnDto[];
}

export class CreateOrderDto {
  @IsEnum(CreateOrderFulfillmentType)
  fulfillmentType!: CreateOrderFulfillmentType;

  @ValidateNested()
  @Type(() => CreateOrderCustomerDto)
  customer!: CreateOrderCustomerDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateOrderAddressDto)
  address?: CreateOrderAddressDto;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
