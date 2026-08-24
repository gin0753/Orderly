type AdminCategoryMapperInput = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export function mapAdminCategory(
  category: AdminCategoryMapperInput,
  productCount: number,
) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    productCount,
    archivedAt: category.archivedAt?.toISOString() ?? null,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}
