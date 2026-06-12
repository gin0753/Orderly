import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateOrderDto,
  CreateOrderFulfillmentType,
} from './dto/create-order.dto';

const DELIVERY_FEE_CENTS = 399;
const SERVICE_FEE_CENTS = 120;
const FREE_DELIVERY_THRESHOLD_CENTS = 5000;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(dto: CreateOrderDto) {
    this.validateOrderPayload(dto);

    const subtotalCents = dto.items.reduce(
      (total, item) => total + item.lineTotalCents,
      0,
    );

    const deliveryFeeCents = this.getDeliveryFeeCents(
      subtotalCents,
      dto.fulfillmentType,
    );

    const totalCents = subtotalCents + deliveryFeeCents + SERVICE_FEE_CENTS;

    const order = await this.prisma.order.create({
      data: {
        orderType:
          dto.fulfillmentType === CreateOrderFulfillmentType.PICKUP
            ? OrderType.PICKUP
            : OrderType.DELIVERY,

        customerName: dto.customer.name,
        customerPhone: dto.customer.phone,
        customerEmail: dto.customer.email,

        addressLine1: dto.address?.addressLine1,
        addressLine2: dto.address?.addressLine2,
        city: dto.address?.city,
        state: dto.address?.state,
        postcode: dto.address?.postcode,

        notes: dto.notes,

        subtotalCents,
        deliveryFeeCents,
        serviceFeeCents: SERVICE_FEE_CENTS,
        totalCents,

        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,

            productNameSnapshot: item.productName,
            productImageUrlSnapshot: item.productImageUrl,

            sizeNameSnapshot: item.sizeName,
            sizePriceCentsSnapshot: item.sizePriceCents,

            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            lineTotalCents: item.lineTotalCents,

            options: {
              create: item.addOns.map((addOn) => ({
                optionGroupNameSnapshot: 'Add-ons',
                optionNameSnapshot: addOn.name,
                priceDeltaCentsSnapshot: addOn.priceCents,
              })),
            },
          })),
        },
      },
      include: {
        items: {
          include: {
            options: true,
          },
        },
      },
    });

    return {
      orderId: order.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      orderType: order.orderType,
      totalCents: order.totalCents,
      createdAt: order.createdAt,
    };
  }

  private validateOrderPayload(dto: CreateOrderDto) {
    if (
      dto.fulfillmentType === CreateOrderFulfillmentType.DELIVERY &&
      !dto.address
    ) {
      throw new BadRequestException('Delivery orders require an address.');
    }

    for (const item of dto.items) {
      const expectedLineTotal = item.unitPriceCents * item.quantity;

      if (item.lineTotalCents !== expectedLineTotal) {
        throw new BadRequestException(
          `Invalid line total for item: ${item.productName}`,
        );
      }
    }
  }

  private getDeliveryFeeCents(
    subtotalCents: number,
    fulfillmentType: CreateOrderFulfillmentType,
  ) {
    if (fulfillmentType === CreateOrderFulfillmentType.PICKUP) {
      return 0;
    }

    if (subtotalCents >= FREE_DELIVERY_THRESHOLD_CENTS) {
      return 0;
    }

    return DELIVERY_FEE_CENTS;
  }
}
