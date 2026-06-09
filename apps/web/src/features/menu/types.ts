export type MenuProduct = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  priceCents: number;
};

export type MenuCategory = {
  id: string;
  name: string;
  slug: string;
  products: MenuProduct[];
};

export type MenuResponse = {
  categories: MenuCategory[];
};
