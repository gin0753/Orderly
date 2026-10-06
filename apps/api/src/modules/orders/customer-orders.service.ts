import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CustomerOrdersQueryDto,
  type CustomerOrderSort,
} from './dto/customer-orders-query.dto';
import {
  customerOrderDetailSelect,
  customerOrderListSelect,
  mapCustomerOrderDetail,
  mapCustomerOrderSummary,
} from './mappers/customer-order.mapper';

function customerOrderSort(
  sort: CustomerOrderSort,
): Prisma.OrderOrderByWithRelationInput[] {
  switch (sort) {
    case 'oldest':
      return [{ createdAt: 'asc' }, { id: 'asc' }];
    case 'amount_high':
      return [{ totalCents: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }];
    case 'amount_low':
      return [{ totalCents: 'asc' }, { createdAt: 'desc' }, { id: 'desc' }];
    default:
      return [{ createdAt: 'desc' }, { id: 'desc' }];
  }
}

@Injectable()
export class CustomerOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(customerUserId: string, query: CustomerOrdersQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const where: Prisma.OrderWhereInput = {
      customerUserId,
      ...(query.status && query.status !== 'all'
        ? { status: query.status }
        : {}),
    };
    const [totalItems, orders] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        select: customerOrderListSelect,
        orderBy: customerOrderSort(query.sort ?? 'newest'),
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return {
      data: orders.map(mapCustomerOrderSummary),
      meta: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
      },
    };
  }

  async detail(customerUserId: string, id: string) {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        id,
      )
    ) {
      throw new NotFoundException('Order not found.');
    }
    const order = await this.prisma.order.findFirst({
      where: { id, customerUserId },
      select: customerOrderDetailSelect,
    });
    if (!order) throw new NotFoundException('Order not found.');
    return mapCustomerOrderDetail(order);
  }
}
