import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OptionGroupType,
  Prisma,
  ProductOptionGroupKind,
} from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';

import {
  mapAdminProductDetail,
  mapAdminProductListItem,
} from './admin-product.mapper';
import {
  AdminProductAvailabilityFilter,
  AdminProductsQueryDto,
} from './dto/admin-products-query.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductOptionGroupInputDto } from './dto/product-option-input.dto';

@Injectable()
export class AdminProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: AdminProductsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const search = query.search?.trim();

    const where: Prisma.ProductWhereInput = {
      archivedAt: null,

      ...(query.categoryId
        ? {
            categoryId: query.categoryId,
          }
        : {}),

      ...(query.availability === AdminProductAvailabilityFilter.AVAILABLE
        ? {
            isAvailable: true,
          }
        : {}),

      ...(query.availability === AdminProductAvailabilityFilter.UNAVAILABLE
        ? {
            isAvailable: false,
          }
        : {}),

      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                description: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                category: {
                  name: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [
      products,
      total,
      totalProducts,
      availableProducts,
      unavailableProducts,
    ] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              isActive: true,
            },
          },
          _count: {
            select: {
              optionGroups: true,
            },
          },
        },
        orderBy: [
          {
            category: {
              sortOrder: 'asc',
            },
          },
          {
            sortOrder: 'asc',
          },
          {
            name: 'asc',
          },
        ],
        skip,
        take: pageSize,
      }),

      this.prisma.product.count({
        where,
      }),

      this.prisma.product.count({
        where: {
          archivedAt: null,
        },
      }),

      this.prisma.product.count({
        where: {
          archivedAt: null,
          isAvailable: true,
        },
      }),

      this.prisma.product.count({
        where: {
          archivedAt: null,
          isAvailable: false,
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      data: products.map(mapAdminProductListItem),

      meta: {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },

      summary: {
        total: totalProducts,
        available: availableProducts,
        unavailable: unavailableProducts,
      },
    };
  }

  async findOne(productId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        archivedAt: null,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
          },
        },
        optionGroups: {
          orderBy: {
            sortOrder: 'asc',
          },
          include: {
            options: {
              orderBy: {
                sortOrder: 'asc',
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} was not found.`);
    }

    return mapAdminProductDetail(product);
  }

  async create(dto: CreateProductDto) {
    const name = this.normalizeRequiredText(dto.name);

    await this.assertCategoryExists(dto.categoryId);
    await this.assertProductNameAvailable(dto.categoryId, name);

    const optionGroups = dto.optionGroups ?? [];

    this.validateOptionGroups(optionGroups);

    const product = await this.prisma.$transaction(async (tx) => {
      const maximumSortOrder = await tx.product.aggregate({
        where: {
          categoryId: dto.categoryId,
          archivedAt: null,
        },
        _max: {
          sortOrder: true,
        },
      });

      return tx.product.create({
        data: {
          name,
          description: this.normalizeOptionalText(dto.description),
          imageUrl: this.normalizeOptionalText(dto.imageUrl),
          categoryId: dto.categoryId,
          basePrice: this.centsToDecimal(dto.basePriceCents),
          isAvailable: dto.isAvailable ?? true,
          sortOrder: (maximumSortOrder._max.sortOrder ?? 0) + 1,

          optionGroups: {
            create: optionGroups.map((group, groupIndex) => ({
              name: this.normalizeRequiredText(group.name),
              kind: group.kind,
              type: group.type,
              isRequired: group.isRequired,
              minSelect: group.minSelect,
              maxSelect: group.maxSelect,
              isActive: group.isActive ?? true,
              sortOrder: groupIndex + 1,

              options: {
                create: group.options.map((option, optionIndex) => ({
                  name: this.normalizeRequiredText(option.name),
                  priceDelta: this.centsToDecimal(option.priceDeltaCents),
                  isAvailable: option.isAvailable ?? true,
                  isDefault: option.isDefault ?? false,
                  sortOrder: optionIndex + 1,
                })),
              },
            })),
          },
        },
      });
    });

    return this.findOne(product.id);
  }

  private async assertCategoryExists(categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        archivedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!category) {
      throw new BadRequestException('The selected category does not exist.');
    }
  }

  private async assertProductNameAvailable(categoryId: string, name: string) {
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        categoryId,
        name: {
          equals: name,
          mode: Prisma.QueryMode.insensitive,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingProduct) {
      throw new ConflictException(
        `A product named "${name}" already exists in this category.`,
      );
    }
  }

  private validateOptionGroups(groups: ProductOptionGroupInputDto[]) {
    const normalizedGroupNames = groups.map((group) =>
      this.normalizeRequiredText(group.name).toLowerCase(),
    );

    if (new Set(normalizedGroupNames).size !== normalizedGroupNames.length) {
      throw new BadRequestException(
        'Option group names must be unique within a product.',
      );
    }

    const sizeGroups = groups.filter(
      (group) =>
        group.kind === ProductOptionGroupKind.SIZE && (group.isActive ?? true),
    );

    if (sizeGroups.length > 1) {
      throw new BadRequestException(
        'A product can only have one active size group.',
      );
    }

    for (const group of groups) {
      this.validateOptionGroup(group);
    }
  }

  private validateOptionGroup(group: ProductOptionGroupInputDto) {
    if (
      group.kind === ProductOptionGroupKind.SIZE &&
      group.type !== OptionGroupType.SINGLE
    ) {
      throw new BadRequestException(
        `${group.name} must use SINGLE selection because it is a size group.`,
      );
    }

    if (
      group.kind === ProductOptionGroupKind.ADD_ON &&
      group.type !== OptionGroupType.MULTIPLE
    ) {
      throw new BadRequestException(
        `${group.name} must use MULTIPLE selection because it is an add-on group.`,
      );
    }

    if (group.type === OptionGroupType.SINGLE && group.maxSelect !== 1) {
      throw new BadRequestException(
        `${group.name} must have maxSelect set to 1.`,
      );
    }

    const minimumRequired = Math.max(group.minSelect, group.isRequired ? 1 : 0);

    if (minimumRequired > group.maxSelect) {
      throw new BadRequestException(
        `${group.name} has invalid minimum and maximum selection values.`,
      );
    }

    const normalizedOptionNames = group.options.map((option) =>
      this.normalizeRequiredText(option.name).toLowerCase(),
    );

    if (new Set(normalizedOptionNames).size !== normalizedOptionNames.length) {
      throw new BadRequestException(
        `Option names must be unique within ${group.name}.`,
      );
    }

    const availableOptions = group.options.filter(
      (option) => option.isAvailable ?? true,
    );

    if (availableOptions.length < minimumRequired) {
      throw new BadRequestException(
        `${group.name} does not have enough available options to satisfy its minimum selection.`,
      );
    }

    const defaultOptions = group.options.filter((option) => option.isDefault);

    if (group.type === OptionGroupType.MULTIPLE && defaultOptions.length > 0) {
      throw new BadRequestException(
        `${group.name} cannot have default options because it allows multiple selections.`,
      );
    }

    if (group.type === OptionGroupType.SINGLE && defaultOptions.length > 1) {
      throw new BadRequestException(
        `${group.name} can only have one default option.`,
      );
    }

    if (
      minimumRequired > 0 &&
      group.type === OptionGroupType.SINGLE &&
      defaultOptions.length !== 1
    ) {
      throw new BadRequestException(
        `${group.name} requires exactly one default option.`,
      );
    }

    const unavailableDefault = defaultOptions.some(
      (option) => option.isAvailable === false,
    );

    if (unavailableDefault) {
      throw new BadRequestException(
        `The default option in ${group.name} must be available.`,
      );
    }
  }

  private normalizeRequiredText(value: string) {
    return value.trim().replace(/\s+/g, ' ');
  }

  private normalizeOptionalText(value: string | null | undefined) {
    if (value === null || value === undefined) {
      return null;
    }

    const normalized = value.trim();

    return normalized || null;
  }

  private centsToDecimal(cents: number) {
    return new Prisma.Decimal((cents / 100).toFixed(2));
  }
}
