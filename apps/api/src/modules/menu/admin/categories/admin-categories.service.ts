import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../prisma/prisma.service';

import { mapAdminCategory } from './admin-category.mapper';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';
import { UpdateCategoryAvailabilityDto } from './dto/update-category-availability.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  AdminCategoryStatus,
  GetAdminCategoriesQueryDto,
} from './dto/get-admin-categories-query.dto';

@Injectable()
export class AdminCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: GetAdminCategoriesQueryDto = {}) {
    const search = query.search?.trim();

    const isActive =
      query.status === AdminCategoryStatus.ACTIVE
        ? true
        : query.status === AdminCategoryStatus.INACTIVE
          ? false
          : undefined;

    const where: Prisma.CategoryWhereInput = {
      archivedAt: null,

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
            ],
          }
        : {}),

      ...(isActive !== undefined
        ? {
            isActive,
          }
        : {}),
    };

    const [categories, total, active, inactive] =
      await this.prisma.$transaction([
        this.prisma.category.findMany({
          where,
          orderBy: [
            {
              sortOrder: 'asc',
            },
            {
              createdAt: 'asc',
            },
          ],
          include: {
            _count: {
              select: {
                products: {
                  where: {
                    archivedAt: null,
                  },
                },
              },
            },
          },
        }),

        this.prisma.category.count({
          where: {
            archivedAt: null,
          },
        }),

        this.prisma.category.count({
          where: {
            archivedAt: null,
            isActive: true,
          },
        }),

        this.prisma.category.count({
          where: {
            archivedAt: null,
            isActive: false,
          },
        }),
      ]);

    return {
      data: categories.map((category) =>
        mapAdminCategory(category, category._count.products),
      ),
      summary: {
        total,
        active,
        inactive,
      },
    };
  }

  async create(dto: CreateCategoryDto) {
    const name = this.normalizeName(dto.name);
    const slug = this.slugify(name);

    if (!slug) {
      throw new BadRequestException(
        'Category name must contain at least one letter or number.',
      );
    }

    await this.assertNameAvailable(name);
    await this.assertSlugAvailable(slug);

    const currentMaximum = await this.prisma.category.aggregate({
      where: {
        archivedAt: null,
      },
      _max: {
        sortOrder: true,
      },
    });

    const category = await this.prisma.category.create({
      data: {
        name,
        slug,
        description: this.normalizeDescription(dto.description),
        isActive: dto.isActive ?? true,
        sortOrder: (currentMaximum._max.sortOrder ?? 0) + 1,
      },
    });

    return mapAdminCategory(category, 0);
  }

  async update(categoryId: string, dto: UpdateCategoryDto) {
    const existingCategory = await this.getActiveManagementCategory(categoryId);

    if (dto.name === undefined && dto.description === undefined) {
      throw new BadRequestException(
        'Provide at least one category field to update.',
      );
    }

    const data: Prisma.CategoryUpdateInput = {};

    if (dto.name !== undefined) {
      const name = this.normalizeName(dto.name);

      await this.assertNameAvailable(name, existingCategory.id);

      data.name = name;

      // Slug intentionally remains stable after category creation.
    }

    if (dto.description !== undefined) {
      data.description = this.normalizeDescription(dto.description);
    }

    await this.prisma.category.update({
      where: {
        id: existingCategory.id,
      },
      data,
    });

    return this.getCategoryResponse(existingCategory.id);
  }

  async updateAvailability(
    categoryId: string,
    dto: UpdateCategoryAvailabilityDto,
  ) {
    const category = await this.getActiveManagementCategory(categoryId);

    if (category.isActive === dto.isActive) {
      return this.getCategoryResponse(category.id);
    }

    await this.prisma.category.update({
      where: {
        id: category.id,
      },
      data: {
        isActive: dto.isActive,
      },
    });

    return this.getCategoryResponse(category.id);
  }

  async reorder(dto: ReorderCategoriesDto) {
    const categories = await this.prisma.category.findMany({
      where: {
        archivedAt: null,
      },
      select: {
        id: true,
      },
    });

    const existingIds = new Set(categories.map((category) => category.id));

    const submittedIds = new Set(dto.categoryIds);

    const containsAllCategories =
      submittedIds.size === existingIds.size &&
      [...existingIds].every((id) => submittedIds.has(id));

    if (!containsAllCategories) {
      throw new BadRequestException(
        'Category reorder must include every non-archived category exactly once.',
      );
    }

    await this.prisma.$transaction(
      dto.categoryIds.map((categoryId, index) =>
        this.prisma.category.update({
          where: {
            id: categoryId,
          },
          data: {
            sortOrder: index + 1,
          },
        }),
      ),
    );

    return this.findAll();
  }

  async archive(categoryId: string) {
    const category = await this.getActiveManagementCategory(categoryId);

    await this.prisma.category.update({
      where: {
        id: category.id,
      },
      data: {
        isActive: false,
        archivedAt: new Date(),
      },
    });

    return {
      id: category.id,
      archived: true,
    };
  }

  private async getActiveManagementCategory(categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        archivedAt: null,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category ${categoryId} was not found.`);
    }

    return category;
  }

  private async getCategoryResponse(categoryId: string) {
    const [category, productCount] = await Promise.all([
      this.prisma.category.findFirst({
        where: {
          id: categoryId,
          archivedAt: null,
        },
      }),

      this.prisma.product.count({
        where: {
          categoryId,
          archivedAt: null,
        },
      }),
    ]);

    if (!category) {
      throw new NotFoundException(`Category ${categoryId} was not found.`);
    }

    return mapAdminCategory(category, productCount);
  }

  private async assertNameAvailable(name: string, excludedCategoryId?: string) {
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        name: {
          equals: name,
          mode: Prisma.QueryMode.insensitive,
        },
        ...(excludedCategoryId
          ? {
              id: {
                not: excludedCategoryId,
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (existingCategory) {
      throw new ConflictException(`A category named "${name}" already exists.`);
    }
  }

  private async assertSlugAvailable(slug: string) {
    const existingCategory = await this.prisma.category.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (existingCategory) {
      throw new ConflictException(
        `The category slug "${slug}" is already in use.`,
      );
    }
  }

  private normalizeName(value: string) {
    return value.trim().replace(/\s+/g, ' ');
  }

  private normalizeDescription(value: string | null | undefined) {
    if (value === null || value === undefined) {
      return null;
    }

    const normalized = value.trim();

    return normalized || null;
  }

  private slugify(value: string) {
    return value
      .normalize('NFKD')
      .toLowerCase()
      .trim()
      .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
      .replace(/^-+|-+$/g, '');
  }
}
