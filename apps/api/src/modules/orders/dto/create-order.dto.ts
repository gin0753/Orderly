import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDefined,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

export enum CreateOrderFulfillmentType {
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
}

class CreateOrderCustomerDto {
  @IsString()
  @Matches(/\S/, { message: 'name must not be blank' })
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
  @Matches(/\S/, { message: 'addressLine1 must not be blank' })
  @MaxLength(180)
  addressLine1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  addressLine2?: string;

  @IsString()
  @Matches(/\S/, { message: 'city must not be blank' })
  @MaxLength(80)
  city!: string;

  @IsString()
  @Matches(/\S/, { message: 'state must not be blank' })
  @MaxLength(80)
  state!: string;

  @IsString()
  @Matches(/\S/, { message: 'postcode must not be blank' })
  @MaxLength(20)
  postcode!: string;
}

class CreateOrderItemDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;

  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(30)
  @IsUUID(undefined, { each: true })
  selectedOptionIds!: string[];
}

export class CreateOrderDto {
  @IsEnum(CreateOrderFulfillmentType)
  fulfillmentType!: CreateOrderFulfillmentType;

  @IsDefined()
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
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
