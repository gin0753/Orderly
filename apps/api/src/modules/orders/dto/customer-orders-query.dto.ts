import { OrderStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export const CUSTOMER_ORDER_SORTS = [
  'newest',
  'oldest',
  'amount_high',
  'amount_low',
] as const;
export type CustomerOrderSort = (typeof CUSTOMER_ORDER_SORTS)[number];

export class CustomerOrdersQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;

  @IsOptional()
  @IsIn(['all', ...Object.values(OrderStatus)])
  status?: OrderStatus | 'all';

  @IsOptional()
  @IsIn(CUSTOMER_ORDER_SORTS)
  sort?: CustomerOrderSort;
}
