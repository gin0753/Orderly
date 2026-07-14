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
import { UpdateProductAvailabilityDto } from './dto/update-product-availability.dto';
import {
  UpdateProductOptionGroupInputDto,
  UpdateProductOptionInputDto,
} from './dto/update-product-option-input.dto';
import { UpdateProductDto } from './dto/update-product.dto';

type ProductForNestedUpdate = Prisma.ProductGetPayload<{
  include: {
    optionGroups: {
      include: {
        options: true;
      };
    };
  };
}>;

type ProductOptionGroupValidationInput =
  | ProductOptionGroupInputDto
  | UpdateProductOptionGroupInputDto;

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
              optionGroups: {
                where: {
                  isActive: true,
                },
              },
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

          ...(optionGroups.length > 0
            ? {
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
              }
            : {}),
        },
      });
    });

    return this.findOne(product.id);
  }

  async update(productId: string, dto: UpdateProductDto) {
    const existingProduct = await this.getManagementProduct(productId);

    const hasUpdate =
      dto.name !== undefined ||
      dto.description !== undefined ||
      dto.imageUrl !== undefined ||
      dto.categoryId !== undefined ||
      dto.basePriceCents !== undefined ||
      dto.optionGroups !== undefined;

    if (!hasUpdate) {
      throw new BadRequestException(
        'Provide at least one product field to update.',
      );
    }

    const nextName =
      dto.name !== undefined
        ? this.normalizeRequiredText(dto.name)
        : existingProduct.name;

    const nextCategoryId = dto.categoryId ?? existingProduct.categoryId;

    const categoryChanged = nextCategoryId !== existingProduct.categoryId;

    if (categoryChanged) {
      await this.assertCategoryExists(nextCategoryId);
    }

    if (nextName !== existingProduct.name || categoryChanged) {
      await this.assertProductNameAvailable(
        nextCategoryId,
        nextName,
        existingProduct.id,
      );
    }

    const submittedOptionGroups = dto.optionGroups;

    if (submittedOptionGroups !== undefined) {
      this.validateOptionGroups(submittedOptionGroups);

      this.validateNestedUpdateOwnership(
        existingProduct,
        submittedOptionGroups,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      let nextSortOrder = existingProduct.sortOrder;

      if (categoryChanged) {
        const maximumSortOrder = await tx.product.aggregate({
          where: {
            categoryId: nextCategoryId,
            archivedAt: null,
          },
          _max: {
            sortOrder: true,
          },
        });

        nextSortOrder = (maximumSortOrder._max.sortOrder ?? 0) + 1;
      }

      await tx.product.update({
        where: {
          id: existingProduct.id,
        },
        data: {
          ...(dto.name !== undefined
            ? {
                name: nextName,
              }
            : {}),

          ...(dto.description !== undefined
            ? {
                description: this.normalizeOptionalText(dto.description),
              }
            : {}),

          ...(dto.imageUrl !== undefined
            ? {
                imageUrl: this.normalizeOptionalText(dto.imageUrl),
              }
            : {}),

          ...(dto.basePriceCents !== undefined
            ? {
                basePrice: this.centsToDecimal(dto.basePriceCents),
              }
            : {}),

          ...(categoryChanged
            ? {
                category: {
                  connect: {
                    id: nextCategoryId,
                  },
                },
                sortOrder: nextSortOrder,
              }
            : {}),
        },
      });

      if (submittedOptionGroups !== undefined) {
        await this.syncOptionGroups(tx, existingProduct, submittedOptionGroups);
      }
    });

    return this.findOne(existingProduct.id);
  }

  async updateAvailability(
    productId: string,
    dto: UpdateProductAvailabilityDto,
  ) {
    const product = await this.getManagementProduct(productId);

    if (product.isAvailable === dto.isAvailable) {
      return this.findOne(product.id);
    }

    await this.prisma.product.update({
      where: {
        id: product.id,
      },
      data: {
        isAvailable: dto.isAvailable,
      },
    });

    return this.findOne(product.id);
  }

  async archive(productId: string) {
    const product = await this.getManagementProduct(productId);

    await this.prisma.product.update({
      where: {
        id: product.id,
      },
      data: {
        isAvailable: false,
        archivedAt: new Date(),
      },
    });

    return {
      id: product.id,
      archived: true,
    };
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

  private async assertProductNameAvailable(
    categoryId: string,
    name: string,
    excludedProductId?: string,
  ) {
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        categoryId,
        name: {
          equals: name,
          mode: Prisma.QueryMode.insensitive,
        },

        ...(excludedProductId
          ? {
              id: {
                not: excludedProductId,
              },
            }
          : {}),
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

  private validateOptionGroups(groups: ProductOptionGroupValidationInput[]) {
    const normalizedGroupNames = groups.map((group) =>
      this.normalizeRequiredText(group.name).toLowerCase(),
    );

    if (new Set(normalizedGroupNames).size !== normalizedGroupNames.length) {
      throw new BadRequestException(
        'Option group names must be unique within a product.',
      );
    }

    const activeSizeGroups = groups.filter(
      (group) =>
        group.kind === ProductOptionGroupKind.SIZE && (group.isActive ?? true),
    );

    if (activeSizeGroups.length > 1) {
      throw new BadRequestException(
        'A product can only have one active size group.',
      );
    }

    for (const group of groups) {
      this.validateOptionGroup(group);
    }
  }

  private validateOptionGroup(group: ProductOptionGroupValidationInput) {
    const isGroupActive = group.isActive ?? true;

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

    if (isGroupActive && availableOptions.length < minimumRequired) {
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
      isGroupActive &&
      minimumRequired > 0 &&
      group.type === OptionGroupType.SINGLE &&
      defaultOptions.length !== 1
    ) {
      throw new BadRequestException(
        `${group.name} requires exactly one default option.`,
      );
    }

    const hasUnavailableDefault = defaultOptions.some(
      (option) => option.isAvailable === false,
    );

    if (hasUnavailableDefault) {
      throw new BadRequestException(
        `The default option in ${group.name} must be available.`,
      );
    }
  }

  private validateNestedUpdateOwnership(
    product: ProductForNestedUpdate,
    submittedGroups: UpdateProductOptionGroupInputDto[],
  ) {
    const existingGroupsById = new Map(
      product.optionGroups.map((group) => [group.id, group]),
    );

    const submittedGroupIds = new Set<string>();
    const submittedOptionIds = new Set<string>();

    for (const submittedGroup of submittedGroups) {
      if (!submittedGroup.id) {
        const containsExistingOption = submittedGroup.options.some(
          (option) => option.id !== undefined,
        );

        if (containsExistingOption) {
          throw new BadRequestException(
            'A new option group cannot contain existing option IDs.',
          );
        }

        continue;
      }

      if (submittedGroupIds.has(submittedGroup.id)) {
        throw new BadRequestException(
          'Each option group can only appear once.',
        );
      }

      submittedGroupIds.add(submittedGroup.id);

      const existingGroup = existingGroupsById.get(submittedGroup.id);

      if (!existingGroup) {
        throw new BadRequestException(
          'An option group does not belong to this product.',
        );
      }

      const existingOptionsById = new Map(
        existingGroup.options.map((option) => [option.id, option]),
      );

      for (const submittedOption of submittedGroup.options) {
        if (!submittedOption.id) {
          continue;
        }

        if (submittedOptionIds.has(submittedOption.id)) {
          throw new BadRequestException(
            'Each product option can only appear once.',
          );
        }

        submittedOptionIds.add(submittedOption.id);

        if (!existingOptionsById.has(submittedOption.id)) {
          throw new BadRequestException(
            `An option does not belong to ${existingGroup.name}.`,
          );
        }
      }
    }
  }

  private async syncOptionGroups(
    tx: Prisma.TransactionClient,
    product: ProductForNestedUpdate,
    submittedGroups: UpdateProductOptionGroupInputDto[],
  ) {
    const submittedExistingGroupIds = new Set(
      submittedGroups.flatMap((group) => (group.id ? [group.id] : [])),
    );

    const removedGroupIds = product.optionGroups
      .filter((group) => !submittedExistingGroupIds.has(group.id))
      .map((group) => group.id);

    if (removedGroupIds.length > 0) {
      await tx.productOptionGroup.updateMany({
        where: {
          productId: product.id,
          id: {
            in: removedGroupIds,
          },
        },
        data: {
          isActive: false,
        },
      });
    }

    const existingGroupsById = new Map(
      product.optionGroups.map((group) => [group.id, group]),
    );

    for (
      let groupIndex = 0;
      groupIndex < submittedGroups.length;
      groupIndex += 1
    ) {
      const submittedGroup = submittedGroups[groupIndex];

      if (!submittedGroup.id) {
        await tx.productOptionGroup.create({
          data: {
            product: {
              connect: {
                id: product.id,
              },
            },

            name: this.normalizeRequiredText(submittedGroup.name),
            kind: submittedGroup.kind,
            type: submittedGroup.type,
            isRequired: submittedGroup.isRequired,
            minSelect: submittedGroup.minSelect,
            maxSelect: submittedGroup.maxSelect,
            isActive: submittedGroup.isActive,
            sortOrder: groupIndex + 1,

            ...(submittedGroup.options.length > 0
              ? {
                  options: {
                    create: submittedGroup.options.map((option, optionIndex) =>
                      this.mapNewOptionInput(option, optionIndex),
                    ),
                  },
                }
              : {}),
          },
        });

        continue;
      }

      const existingGroup = existingGroupsById.get(submittedGroup.id);

      if (!existingGroup) {
        throw new BadRequestException(
          'An option group does not belong to this product.',
        );
      }

      await tx.productOptionGroup.update({
        where: {
          id: existingGroup.id,
        },
        data: {
          name: this.normalizeRequiredText(submittedGroup.name),
          kind: submittedGroup.kind,
          type: submittedGroup.type,
          isRequired: submittedGroup.isRequired,
          minSelect: submittedGroup.minSelect,
          maxSelect: submittedGroup.maxSelect,
          isActive: submittedGroup.isActive,
          sortOrder: groupIndex + 1,
        },
      });

      await this.syncOptions(tx, existingGroup, submittedGroup.options);
    }
  }

  private async syncOptions(
    tx: Prisma.TransactionClient,
    existingGroup: ProductForNestedUpdate['optionGroups'][number],
    submittedOptions: UpdateProductOptionInputDto[],
  ) {
    const submittedExistingOptionIds = new Set(
      submittedOptions.flatMap((option) => (option.id ? [option.id] : [])),
    );

    const removedOptionIds = existingGroup.options
      .filter((option) => !submittedExistingOptionIds.has(option.id))
      .map((option) => option.id);

    if (removedOptionIds.length > 0) {
      await tx.productOption.updateMany({
        where: {
          optionGroupId: existingGroup.id,
          id: {
            in: removedOptionIds,
          },
        },
        data: {
          isAvailable: false,
          isDefault: false,
        },
      });
    }

    const existingOptionsById = new Map(
      existingGroup.options.map((option) => [option.id, option]),
    );

    for (
      let optionIndex = 0;
      optionIndex < submittedOptions.length;
      optionIndex += 1
    ) {
      const submittedOption = submittedOptions[optionIndex];

      if (!submittedOption.id) {
        await tx.productOption.create({
          data: {
            optionGroup: {
              connect: {
                id: existingGroup.id,
              },
            },
            ...this.mapNewOptionInput(submittedOption, optionIndex),
          },
        });

        continue;
      }

      const existingOption = existingOptionsById.get(submittedOption.id);

      if (!existingOption) {
        throw new BadRequestException(
          `An option does not belong to ${existingGroup.name}.`,
        );
      }

      await tx.productOption.update({
        where: {
          id: existingOption.id,
        },
        data: {
          name: this.normalizeRequiredText(submittedOption.name),
          priceDelta: this.centsToDecimal(submittedOption.priceDeltaCents),
          isAvailable: submittedOption.isAvailable,
          isDefault: submittedOption.isDefault,
          sortOrder: optionIndex + 1,
        },
      });
    }
  }

  private mapNewOptionInput(
    option: {
      name: string;
      priceDeltaCents: number;
      isAvailable: boolean;
      isDefault: boolean;
    },
    optionIndex: number,
  ) {
    return {
      name: this.normalizeRequiredText(option.name),
      priceDelta: this.centsToDecimal(option.priceDeltaCents),
      isAvailable: option.isAvailable,
      isDefault: option.isDefault,
      sortOrder: optionIndex + 1,
    };
  }

  private async getManagementProduct(productId: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        archivedAt: null,
      },
      include: {
        optionGroups: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} was not found.`);
    }

    return product;
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
