import { OrderStatus, OrderType } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class ListOrdersQueryDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(OrderType)
  orderType?: OrderType;
}
