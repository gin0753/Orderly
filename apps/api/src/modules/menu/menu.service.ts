import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { moneyToCents } from '../../utils/moneyToCents';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async getMenu() {
    const [storeSettings, categories] = await Promise.all([
      this.prisma.storeSettings.findUnique({
        where: {
          id: 'default',
        },
      }),
      this.prisma.category.findMany({
        where: {
          isActive: true,
          archivedAt: null,
          products: {
            some: {
              isAvailable: true,
              archivedAt: null,
            },
          },
        },
        orderBy: {
          sortOrder: 'asc',
        },
        include: {
          products: {
            where: {
              isAvailable: true,
              archivedAt: null,
            },
            orderBy: {
              sortOrder: 'asc',
            },
            include: {
              optionGroups: {
                where: {
                  isActive: true,
                },
                orderBy: {
                  sortOrder: 'asc',
                },
                include: {
                  options: {
                    where: {
                      isAvailable: true,
                    },
                    orderBy: {
                      sortOrder: 'asc',
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      store: storeSettings
        ? {
            name: storeSettings.storeName,
            isAcceptingOrders: storeSettings.isAcceptingOrders,
            pickupEnabled: storeSettings.pickupEnabled,
            deliveryEnabled: storeSettings.deliveryEnabled,
            estimatedPreparationMinutes:
              storeSettings.estimatedPreparationMinutes,
            deliveryFee: storeSettings.deliveryFee.toString(),
            minimumOrderAmount: storeSettings.minimumOrderAmount.toString(),
          }
        : null,

      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        sortOrder: category.sortOrder,
        products: category.products.map((product) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          priceCents: moneyToCents(product.basePrice),
          imageUrl: product.imageUrl,
          isAvailable: product.isAvailable,
          optionGroups: product.optionGroups.map((group) => ({
            id: group.id,
            name: group.name,
            kind: group.kind,
            type: group.type,
            isRequired: group.isRequired,
            minSelect: group.minSelect,
            maxSelect: group.maxSelect,
            options: group.options.map((option) => ({
              id: option.id,
              name: option.name,
              priceDelta: option.priceDelta.toString(),
              priceDeltaCents: moneyToCents(option.priceDelta),
              isAvailable: option.isAvailable,
              isDefault: option.isDefault,
            })),
          })),
        })),
      })),
    };
  }
}
