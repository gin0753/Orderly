import { moneyToCents } from '../../../../utils/moneyToCents';

type AdminProductListMapperInput = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  basePrice: Parameters<typeof moneyToCents>[0];
  isAvailable: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
  };
  _count: {
    optionGroups: number;
  };
};

type AdminProductDetailMapperInput = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  basePrice: Parameters<typeof moneyToCents>[0];
  isAvailable: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
  };
  optionGroups: Array<{
    id: string;
    name: string;
    kind: string;
    type: string;
    isRequired: boolean;
    minSelect: number;
    maxSelect: number;
    sortOrder: number;
    isActive: boolean;
    options: Array<{
      id: string;
      name: string;
      priceDelta: Parameters<typeof moneyToCents>[0];
      isAvailable: boolean;
      isDefault: boolean;
      sortOrder: number;
    }>;
  }>;
};

export function mapAdminProductListItem(product: AdminProductListMapperInput) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    imageUrl: product.imageUrl,
    basePriceCents: moneyToCents(product.basePrice),
    isAvailable: product.isAvailable,
    sortOrder: product.sortOrder,
    category: product.category,
    optionGroupCount: product._count.optionGroups,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export function mapAdminProductDetail(product: AdminProductDetailMapperInput) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    imageUrl: product.imageUrl,
    basePriceCents: moneyToCents(product.basePrice),
    isAvailable: product.isAvailable,
    sortOrder: product.sortOrder,
    category: product.category,

    optionGroups: product.optionGroups.map((group) => ({
      id: group.id,
      name: group.name,
      kind: group.kind,
      type: group.type,
      isRequired: group.isRequired,
      minSelect: group.minSelect,
      maxSelect: group.maxSelect,
      sortOrder: group.sortOrder,
      isActive: group.isActive,

      options: group.options.map((option) => ({
        id: option.id,
        name: option.name,
        priceDeltaCents: moneyToCents(option.priceDelta),
        isAvailable: option.isAvailable,
        isDefault: option.isDefault,
        sortOrder: option.sortOrder,
      })),
    })),

    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}
