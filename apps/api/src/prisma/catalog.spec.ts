import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  catalogCategories,
  createCatalogCategories,
  pizzaOptionGroups,
} from '../../prisma/catalog-data';

describe('fresh catalog', () => {
  it('keeps the approved category/product ordering, names and integer prices', () => {
    expect(catalogCategories.map((category) => category.name)).toEqual([
      'Pizza',
      'Pasta',
      'Sides',
      'Drinks',
      'Desserts',
    ]);
    const products = catalogCategories.flatMap((category) => [
      ...category.products,
    ]);
    expect(
      products.map((product) => [product.name, product.basePriceCents]),
    ).toEqual([
      ['Margherita', 1490],
      ['Pepperoni', 1690],
      ['BBQ Chicken', 1890],
      ['Roasted Mushroom', 1790],
      ['Creamy Carbonara', 1590],
      ['Beef Bolognese', 1690],
      ['Garlic Bread', 590],
      ['Chicken Wings', 990],
      ['Classic Cola', 350],
      ['Lemon Lime Soda', 350],
      ['Tiramisu', 790],
      ['Chocolate Fudge Brownie', 850],
    ]);
    expect(new Set(products.map((product) => product.name)).size).toBe(12);
    expect(new Set(products.map((product) => product.imageUrl)).size).toBe(12);
    for (const product of products) {
      expect(Number.isInteger(product.basePriceCents)).toBe(true);
      const image = readFileSync(
        resolve(__dirname, '../../../web/public', product.imageUrl.slice(1)),
      );
      expect(image.toString('ascii', 0, 4)).toBe('RIFF');
      expect(image.toString('ascii', 8, 12)).toBe('WEBP');
      expect(image.readUInt32LE(4) + 8).toBe(image.length);
    }
  });

  it('creates deterministic nested data with decimal conversion only at the database boundary', () => {
    const first = createCatalogCategories();
    expect(first).toEqual(createCatalogCategories());
    expect(first.map((category) => category.sortOrder)).toEqual([
      1, 2, 3, 4, 5,
    ]);
    for (const category of first) {
      const products = category.products!.create as Array<{
        basePrice: { toString(): string };
        sortOrder: number;
        optionGroups?: { create: unknown[] };
      }>;
      expect(products.map((product) => product.sortOrder)).toEqual(
        products.map((_, index) => index + 1),
      );
      for (const product of products) {
        expect(product.optionGroups?.create.length ?? 0).toBe(
          category.slug === 'pizza' ? 3 : 0,
        );
      }
    }
    const pizzas = first[0].products!.create as Array<{
      basePrice: { toString(): string };
    }>;
    expect(pizzas[0].basePrice.toString()).toBe('14.9');
  });

  it('provides the approved pizza selections and valid defaults', () => {
    expect(
      pizzaOptionGroups.map((group) => [
        group.name,
        group.kind,
        group.type,
        group.minSelect,
        group.maxSelect,
      ]),
    ).toEqual([
      ['Size', 'SIZE', 'SINGLE', 1, 1],
      ['Crust', 'MODIFIER', 'SINGLE', 1, 1],
      ['Extras', 'ADD_ON', 'MULTIPLE', 0, 4],
    ]);
    expect(
      pizzaOptionGroups.map((group) =>
        group.options.map((option) => [
          option.name,
          option.priceDeltaCents,
          option.isDefault,
        ]),
      ),
    ).toEqual([
      [
        ['Small (9")', 0, true],
        ['Medium (12")', 300, false],
        ['Large (15")', 600, false],
      ],
      [
        ['Classic', 0, true],
        ['Thin', 0, false],
        ['Cheese-filled', 300, false],
      ],
      [
        ['Extra Mozzarella', 200, false],
        ['Roasted Mushrooms', 200, false],
        ['Pepperoni', 300, false],
        ['Kalamata Olives', 150, false],
      ],
    ]);
    for (const group of pizzaOptionGroups) {
      expect(group.isRequired).toBe(group.minSelect > 0);
      expect(group.options.filter((option) => option.isDefault)).toHaveLength(
        group.isRequired ? 1 : 0,
      );
      expect(
        group.options.every((option) =>
          Number.isInteger(option.priceDeltaCents),
        ),
      ).toBe(true);
    }
  });
});
