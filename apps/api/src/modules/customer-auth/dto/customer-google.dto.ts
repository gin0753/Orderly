import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class GoogleSignInStartDto {
  @IsOptional()
  @IsString()
  @MaxLength(512)
  returnTo?: string;
}

export class GoogleConnectDto {
  @IsString()
  @MinLength(1)
  @MaxLength(72)
  password!: string;
}
