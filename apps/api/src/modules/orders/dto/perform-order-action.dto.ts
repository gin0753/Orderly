import { IsEnum } from 'class-validator';

import { OrderAction } from '../order-action';

export class PerformOrderActionDto {
  @IsEnum(OrderAction)
  action!: OrderAction;
}
