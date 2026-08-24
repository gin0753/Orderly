import { IsBoolean } from 'class-validator';

export class UpdateCategoryAvailabilityDto {
  @IsBoolean()
  isActive!: boolean;
}
