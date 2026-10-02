import {
  PRODUCT_IMAGE_PATH,
  PRODUCT_IMAGE_PATH_MESSAGE,
} from './product-image-path';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Matches,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { UpdateProductOptionGroupInputDto } from './update-product-option-input.dto';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @Matches(PRODUCT_IMAGE_PATH, { message: PRODUCT_IMAGE_PATH_MESSAGE })
  imageUrl?: string | null;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100_000_000)
  basePriceCents?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => UpdateProductOptionGroupInputDto)
  optionGroups?: UpdateProductOptionGroupInputDto[];
}
