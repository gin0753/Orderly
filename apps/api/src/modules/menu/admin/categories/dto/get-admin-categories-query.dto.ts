import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum AdminCategoryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export class GetAdminCategoriesQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsEnum(AdminCategoryStatus)
  status?: AdminCategoryStatus;
}
