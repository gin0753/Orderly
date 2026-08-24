import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum AdminCategoryStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
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
