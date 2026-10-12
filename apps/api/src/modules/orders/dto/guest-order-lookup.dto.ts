import { IsNotEmpty, ValidateIf, IsString, MaxLength } from 'class-validator';

export class GuestOrderLookupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  orderNumber!: string;

  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @MaxLength(128)
  receiptCode?: string;
}
