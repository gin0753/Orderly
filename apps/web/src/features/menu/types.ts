export type MenuProduct = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  isAvailable: boolean;
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
