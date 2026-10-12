import { Transform } from 'class-transformer';
import {
  IsString,
  Equals,
  IsOptional,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { PasswordBytes } from './customer-credentials.dto';

export class CustomerProfileDto {
  @ValidateIf(
    (_object: CustomerProfileDto, value: unknown) => value !== undefined,
  )
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ValidateIf(
    (_object: CustomerProfileDto, value: unknown) =>
      value !== undefined && value !== null,
  )
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() || null : value,
  )
  @IsString()
  @MaxLength(40)
  @Matches(/^[+()\d\s-]{7,20}$/)
  phone?: string | null;
}

export class CustomerPasswordChangeDto {
  @IsString()
  @MinLength(1)
  @PasswordBytes()
  currentPassword!: string;

  @IsString()
  @MinLength(15)
  @PasswordBytes()
  newPassword!: string;
}

export class CustomerDeleteDto {
  @Equals('DELETE')
  confirmation!: string;
  @IsOptional()
  @IsString()
  @MinLength(1)
  @PasswordBytes()
  currentPassword?: string;
  @IsOptional()
  @IsString()
  @MaxLength(80)
  savedReceiptNumber?: string;
}
