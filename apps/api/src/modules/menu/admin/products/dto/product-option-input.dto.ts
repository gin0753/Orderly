import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { OptionGroupType, ProductOptionGroupKind } from '@prisma/client';

export class ProductOptionInputDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsInt()
  @Min(0)
  @Max(10_000_000)
  priceDeltaCents!: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class ProductOptionGroupInputDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsEnum(ProductOptionGroupKind)
  kind!: ProductOptionGroupKind;

  @IsEnum(OptionGroupType)
  type!: OptionGroupType;

  @IsBoolean()
  isRequired!: boolean;

  @IsInt()
  @Min(0)
  @Max(50)
  minSelect!: number;

  @IsInt()
  @Min(1)
  @Max(50)
  maxSelect!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ProductOptionInputDto)
  options!: ProductOptionInputDto[];
}
