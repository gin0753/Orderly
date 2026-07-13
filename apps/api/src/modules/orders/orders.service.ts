import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  OptionGroupType,
  OrderStatus,
  OrderType,
  Prisma,
  ProductOptionGroupKind,
} from '@prisma/client';
import type { StoreSettings } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { moneyToCents } from '../../utils/moneyToCents';

import {
  CreateOrderDto,
  CreateOrderFulfillmentType,
} from './dto/create-order.dto';
import { GuestOrderLookupDto } from './dto/guest-order-lookup.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { PerformOrderActionDto } from './dto/perform-order-action.dto';
import { mapOrderToTrackingResponse } from './mappers/order-tracking.mapper';
import { resolveOrderAction } from './order-action';

const SERVICE_FEE_CENTS = 120;
const FREE_DELIVERY_THRESHOLD_CENTS = 5000;

type OrderableProduct = Prisma.ProductGetPayload<{
  include: {
    category: true;
    optionGroups: {
      include: {
        options: true;
      };
    };
  };
}>;

type SelectedDatabaseOption = {
  group: OrderableProduct['optionGroups'][number];
  option: OrderableProduct['optionGroups'][number]['options'][number];
};

type ResolvedOrderItem = {
  productId: string;

  productNameSnapshot: string;
  productImageUrlSnapshot: string | null;

  sizeNameSnapshot: string | null;
  sizePriceCentsSnapshot: number | null;

  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;

  options: Array<{
    optionId: string;
    optionGroupNameSnapshot: string;
    optionNameSnapshot: string;
    priceDeltaCentsSnapshot: number;
  }>;
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(dto: CreateOrderDto) {
    this.validateOrderFulfillment(dto);

    const customerPhone = this.normalizeCustomerPhone(dto.customer.phone);

    return this.prisma.$transaction(async (tx) => {
      const storeSettings = await tx.storeSettings.findUnique({
        where: {
          id: 'default',
        },
      });

      if (!storeSettings) {
        throw new ServiceUnavailableException(
          'Store settings are not configured.',
        );
      }

      this.validateStoreAvailability(storeSettings, dto.fulfillmentType);

      const resolvedItems = await this.resolveOrderItems(tx, dto.items);

      const subtotalCents = resolvedItems.reduce(
        (total, item) => total + item.lineTotalCents,
        0,
      );

      const minimumOrderAmountCents = moneyToCents(
        storeSettings.minimumOrderAmount,
      );

      if (subtotalCents < minimumOrderAmountCents) {
        throw new BadRequestException(
          `The minimum order amount is $${(
            minimumOrderAmountCents / 100
          ).toFixed(2)}.`,
        );
      }

      const deliveryFeeCents = this.getDeliveryFeeCents(
        subtotalCents,
        dto.fulfillmentType,
        moneyToCents(storeSettings.deliveryFee),
      );

      const totalCents = subtotalCents + deliveryFeeCents + SERVICE_FEE_CENTS;

      const orderNumber = await this.generateOrderNumber(tx);

      const order = await tx.order.create({
        data: {
          orderNumber,

          orderType:
            dto.fulfillmentType === CreateOrderFulfillmentType.PICKUP
              ? OrderType.PICKUP
              : OrderType.DELIVERY,

          customerName: dto.customer.name.trim(),
          customerPhone,
          customerEmail: dto.customer.email.trim().toLowerCase(),

          addressLine1: dto.address?.addressLine1.trim(),
          addressLine2: dto.address?.addressLine2?.trim() || undefined,
          city: dto.address?.city.trim(),
          state: dto.address?.state.trim(),
          postcode: dto.address?.postcode.trim(),

          notes: dto.notes?.trim() || undefined,

          subtotalCents,
          deliveryFeeCents,
          serviceFeeCents: SERVICE_FEE_CENTS,
          totalCents,

          items: {
            create: resolvedItems.map((item) => ({
              productId: item.productId,

              productNameSnapshot: item.productNameSnapshot,
              productImageUrlSnapshot: item.productImageUrlSnapshot,

              sizeNameSnapshot: item.sizeNameSnapshot,
              sizePriceCentsSnapshot: item.sizePriceCentsSnapshot,

              quantity: item.quantity,
              unitPriceCents: item.unitPriceCents,
              lineTotalCents: item.lineTotalCents,

              options: {
                create: item.options,
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
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        orderType: order.orderType,
        totalCents: order.totalCents,
        createdAt: order.createdAt,
      };
    });
  }

  private async resolveOrderItems(
    tx: Prisma.TransactionClient,
    items: CreateOrderDto['items'],
  ): Promise<ResolvedOrderItem[]> {
    const productIds = [...new Set(items.map((item) => item.productId))];

    const products = await tx.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      include: {
        category: true,
        optionGroups: {
          include: {
            options: true,
          },
        },
      },
    });

    const productsById = new Map(
      products.map((product) => [product.id, product]),
    );

    return items.map((item) => {
      const product = productsById.get(item.productId);

      if (!product) {
        throw new BadRequestException('One or more products no longer exist.');
      }

      this.validateProductAvailability(product);

      const selectedOptions = this.resolveSelectedOptions(
        product,
        item.selectedOptionIds,
      );

      this.validateOptionSelections(product, selectedOptions);

      const basePriceCents = moneyToCents(product.basePrice);

      const optionPriceCents = selectedOptions.reduce(
        (total, selected) => total + moneyToCents(selected.option.priceDelta),
        0,
      );

      const unitPriceCents = basePriceCents + optionPriceCents;

      if (unitPriceCents < 0) {
        throw new BadRequestException(
          `${product.name} has an invalid price configuration.`,
        );
      }

      const lineTotalCents = unitPriceCents * item.quantity;

      const selectedSizeOptions = selectedOptions.filter(
        ({ group }) => group.kind === ProductOptionGroupKind.SIZE,
      );

      if (selectedSizeOptions.length > 1) {
        throw new BadRequestException(
          `${product.name} has an invalid size configuration.`,
        );
      }

      const selectedSize = selectedSizeOptions[0];

      return {
        productId: product.id,

        productNameSnapshot: product.name,
        productImageUrlSnapshot: product.imageUrl,

        sizeNameSnapshot: selectedSize?.option.name ?? null,

        sizePriceCentsSnapshot: selectedSize
          ? moneyToCents(selectedSize.option.priceDelta)
          : null,

        quantity: item.quantity,
        unitPriceCents,
        lineTotalCents,

        options: selectedOptions
          .filter(({ group }) => group.kind !== ProductOptionGroupKind.SIZE)
          .map(({ group, option }) => ({
            optionId: option.id,

            optionGroupNameSnapshot: group.name,

            optionNameSnapshot: option.name,

            priceDeltaCentsSnapshot: moneyToCents(option.priceDelta),
          })),
      };
    });
  }

  private validateProductAvailability(product: OrderableProduct) {
    const isUnavailable =
      !product.isAvailable ||
      product.archivedAt !== null ||
      !product.category.isActive ||
      product.category.archivedAt !== null;

    if (isUnavailable) {
      throw new BadRequestException(`${product.name} is no longer available.`);
    }
  }

  private resolveSelectedOptions(
    product: OrderableProduct,
    selectedOptionIds: string[],
  ): SelectedDatabaseOption[] {
    const optionsById = new Map<string, SelectedDatabaseOption>();

    for (const group of product.optionGroups) {
      for (const option of group.options) {
        optionsById.set(option.id, {
          group,
          option,
        });
      }
    }

    return selectedOptionIds.map((optionId) => {
      const selected = optionsById.get(optionId);

      if (!selected) {
        throw new BadRequestException(
          `An invalid option was selected for ${product.name}.`,
        );
      }

      if (!selected.group.isActive || !selected.option.isAvailable) {
        throw new BadRequestException(
          `${selected.option.name} is no longer available for ${product.name}.`,
        );
      }

      return selected;
    });
  }

  private validateOptionSelections(
    product: OrderableProduct,
    selectedOptions: SelectedDatabaseOption[],
  ) {
    for (const group of product.optionGroups) {
      if (!group.isActive) {
        continue;
      }

      const selectedCount = selectedOptions.filter(
        (selected) => selected.group.id === group.id,
      ).length;

      const minimumRequired = Math.max(
        group.minSelect,
        group.isRequired ? 1 : 0,
      );

      const maximumAllowed =
        group.type === OptionGroupType.SINGLE ? 1 : group.maxSelect;

      if (selectedCount < minimumRequired) {
        throw new BadRequestException(
          `Please select at least ${minimumRequired} option${
            minimumRequired === 1 ? '' : 's'
          } from ${group.name} for ${product.name}.`,
        );
      }

      if (selectedCount > maximumAllowed) {
        throw new BadRequestException(
          `Please select no more than ${maximumAllowed} option${
            maximumAllowed === 1 ? '' : 's'
          } from ${group.name} for ${product.name}.`,
        );
      }
    }
  }

  private validateOrderFulfillment(dto: CreateOrderDto) {
    if (
      dto.fulfillmentType === CreateOrderFulfillmentType.DELIVERY &&
      !dto.address
    ) {
      throw new BadRequestException('Delivery orders require an address.');
    }
  }

  private validateStoreAvailability(
    storeSettings: StoreSettings,
    fulfillmentType: CreateOrderFulfillmentType,
  ) {
    if (!storeSettings.isAcceptingOrders) {
      throw new BadRequestException(
        'The store is not currently accepting orders.',
      );
    }

    if (
      fulfillmentType === CreateOrderFulfillmentType.PICKUP &&
      !storeSettings.pickupEnabled
    ) {
      throw new BadRequestException('Pickup is not currently available.');
    }

    if (
      fulfillmentType === CreateOrderFulfillmentType.DELIVERY &&
      !storeSettings.deliveryEnabled
    ) {
      throw new BadRequestException('Delivery is not currently available.');
    }
  }

  private normalizeCustomerPhone(phone: string): string {
    const normalizedPhone = phone.replace(/\D/g, '');

    if (!normalizedPhone) {
      throw new BadRequestException(
        'A valid customer phone number is required.',
      );
    }

    return normalizedPhone;
  }

  private getDeliveryFeeCents(
    subtotalCents: number,
    fulfillmentType: CreateOrderFulfillmentType,
    configuredDeliveryFeeCents: number,
  ) {
    if (fulfillmentType === CreateOrderFulfillmentType.PICKUP) {
      return 0;
    }

    if (subtotalCents >= FREE_DELIVERY_THRESHOLD_CENTS) {
      return 0;
    }

    return configuredDeliveryFeeCents;
  }

  private async generateOrderNumber(
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const latestOrder = await tx.order.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        orderNumber: true,
      },
    });

    const parsedLatestNumber = latestOrder?.orderNumber
      ? Number(latestOrder.orderNumber)
      : 10000;

    const latestNumber = Number.isFinite(parsedLatestNumber)
      ? parsedLatestNumber
      : 10000;

    return String(latestNumber + 1);
  }

  async findAll(query: ListOrdersQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const search = query.search?.trim();

    const searchConditions: Prisma.OrderWhereInput[] = search
      ? [
          {
            customerName: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            customerPhone: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            customerEmail: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            notes: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            items: {
              some: {
                productNameSnapshot: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            },
          },
        ]
      : [];

    const where: Prisma.OrderWhereInput = {
      ...(query.status
        ? {
            status: query.status,
          }
        : {}),

      ...(query.orderType
        ? {
            orderType: query.orderType,
          }
        : {}),

      ...(searchConditions.length > 0
        ? {
            OR: searchConditions,
          }
        : {}),
    };

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              options: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),

      this.prisma.order.count({
        where,
      }),
    ]);

    const summary = await this.getOrdersSummary();

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      data: orders,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      summary,
    };
  }

  private async getOrdersSummary() {
    const [total, pending, accepted, preparing, ready, completed, cancelled] =
      await Promise.all([
        this.prisma.order.count(),

        this.prisma.order.count({
          where: {
            status: OrderStatus.PENDING,
          },
        }),

        this.prisma.order.count({
          where: {
            status: OrderStatus.ACCEPTED,
          },
        }),

        this.prisma.order.count({
          where: {
            status: OrderStatus.PREPARING,
          },
        }),

        this.prisma.order.count({
          where: {
            status: OrderStatus.READY,
          },
        }),

        this.prisma.order.count({
          where: {
            status: OrderStatus.COMPLETED,
          },
        }),

        this.prisma.order.count({
          where: {
            status: OrderStatus.CANCELLED,
          },
        }),
      ]);

    return {
      total,
      pending,
      accepted,
      preparing,
      ready,
      completed,
      cancelled,
    };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: {
        id,
      },
      include: {
        items: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} was not found`);
    }

    return order;
  }

  async performAction(
    id: string,
    performOrderActionDto: PerformOrderActionDto,
  ) {
    const existingOrder = await this.findOne(id);

    const nextStatus = resolveOrderAction(
      existingOrder.status,
      performOrderActionDto.action,
    );

    if (!nextStatus) {
      throw new BadRequestException(
        `Cannot perform ${performOrderActionDto.action} while order is ${existingOrder.status}.`,
      );
    }

    if (existingOrder.status === nextStatus) {
      return existingOrder;
    }

    return this.prisma.order.update({
      where: {
        id,
      },
      data: {
        status: nextStatus,
      },
      include: {
        items: true,
      },
    });
  }

  async lookupGuestOrder(dto: GuestOrderLookupDto) {
    const orderNumber = dto.orderNumber.trim().replace(/^#/, '');

    const email = dto.email?.trim().toLowerCase();

    const phone = dto.phone ? dto.phone.replace(/\D/g, '') : undefined;

    if (!email && !phone) {
      throw new BadRequestException(
        'Please provide the email or phone number used at checkout.',
      );
    }

    const order = await this.prisma.order.findFirst({
      where: {
        orderNumber,

        OR: [
          ...(email
            ? [
                {
                  customerEmail: {
                    equals: email,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              ]
            : []),

          ...(phone
            ? [
                {
                  customerPhone: phone,
                },
              ]
            : []),
        ],
      },

      include: {
        items: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(
        'Order not found. Please check your order number and contact detail.',
      );
    }

    return mapOrderToTrackingResponse(order);
  }
}
