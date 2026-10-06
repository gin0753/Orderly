import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateBy,
} from 'class-validator';

export function PasswordBytes() {
  return ValidateBy({
    name: 'passwordBytes',
    validator: {
      validate: (value: unknown) =>
        typeof value === 'string' && Buffer.byteLength(value, 'utf8') <= 72,
      defaultMessage: () => 'password must not exceed 72 UTF-8 bytes',
    },
  });
}

export class CustomerLoginDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(160)
  email!: string;

  @IsString()
  @MinLength(1)
  @PasswordBytes()
  password!: string;
}

export class CustomerRegisterDto extends CustomerLoginDto {
  @IsString()
  @MinLength(15)
  @PasswordBytes()
  declare password: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  phone?: string;
}
