import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ContentSuggestionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  @Matches(/\S/, { message: 'name must contain non-whitespace characters' })
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  @Matches(/\S/, {
    message: 'categoryName must contain non-whitespace characters',
  })
  categoryName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
