import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { OptionGroupType, ProductOptionGroupKind } from '@prisma/client';

export class UpdateProductOptionInputDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsInt()
  @Min(0)
  @Max(10_000_000)
  priceDeltaCents!: number;

  @IsBoolean()
  isAvailable!: boolean;

  @IsBoolean()
  isDefault!: boolean;
}

export class UpdateProductOptionGroupInputDto {
  @IsOptional()
  @IsUUID()
  id?: string;

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

  @IsBoolean()
  isActive!: boolean;

  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => UpdateProductOptionInputDto)
  options!: UpdateProductOptionInputDto[];
}
