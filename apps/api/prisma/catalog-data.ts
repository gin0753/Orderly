import {
  Prisma,
  OptionGroupType,
  ProductOptionGroupKind,
} from '@prisma/client';

// Money stays in integer cents here; only the Prisma boundary converts to decimals.
export const pizzaOptionGroups: ReadonlyArray<{
  name: string;
  kind: ProductOptionGroupKind;
  type: OptionGroupType;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  options: ReadonlyArray<{
    name: string;
    priceDeltaCents: number;
    isDefault: boolean;
  }>;
}> = [
  {
    name: 'Size',
    kind: 'SIZE',
    type: 'SINGLE',
    isRequired: true,
    minSelect: 1,
    maxSelect: 1,
    options: [
      { name: 'Small (9")', priceDeltaCents: 0, isDefault: true },
      { name: 'Medium (12")', priceDeltaCents: 300, isDefault: false },
      { name: 'Large (15")', priceDeltaCents: 600, isDefault: false },
    ],
  },
  {
    name: 'Crust',
    kind: 'MODIFIER',
    type: 'SINGLE',
    isRequired: true,
    minSelect: 1,
    maxSelect: 1,
    options: [
      { name: 'Classic', priceDeltaCents: 0, isDefault: true },
      { name: 'Thin', priceDeltaCents: 0, isDefault: false },
      { name: 'Cheese-filled', priceDeltaCents: 300, isDefault: false },
    ],
  },
  {
    name: 'Extras',
    kind: 'ADD_ON',
    type: 'MULTIPLE',
    isRequired: false,
    minSelect: 0,
    maxSelect: 4,
    options: [
      { name: 'Extra Mozzarella', priceDeltaCents: 200, isDefault: false },
      { name: 'Roasted Mushrooms', priceDeltaCents: 200, isDefault: false },
      { name: 'Pepperoni', priceDeltaCents: 300, isDefault: false },
      { name: 'Kalamata Olives', priceDeltaCents: 150, isDefault: false },
    ],
  },
];

export const catalogCategories: ReadonlyArray<{
  name: string;
  slug: string;
  description: string;
  products: ReadonlyArray<{
    name: string;
    description: string;
    basePriceCents: number;
    imageUrl: string;
  }>;
}> = [
  {
    name: 'Pizza',
    slug: 'pizza',
    description: 'Classic and signature pizzas.',
    products: [
      {
        name: 'Margherita',
        description:
          'Italian tomato, fior di latte mozzarella, fresh basil and extra-virgin olive oil.',
        basePriceCents: 1490,
        imageUrl: '/images/menu/margherita-pizza-v1.webp',
      },
      {
        name: 'Pepperoni',
        description:
          'Italian tomato, mozzarella and crisp pepperoni on a hand-stretched base.',
        basePriceCents: 1690,
        imageUrl: '/images/menu/pepperoni-pizza-v1.webp',
      },
      {
        name: 'BBQ Chicken',
        description:
          'Smoky BBQ sauce, roasted chicken, red onion, mozzarella and parsley.',
        basePriceCents: 1890,
        imageUrl: '/images/menu/bbq-chicken-pizza-v1.webp',
      },
      {
        name: 'Roasted Mushroom',
        description:
          'Italian tomato, mozzarella, roasted mushrooms, thyme and olive oil.',
        basePriceCents: 1790,
        imageUrl: '/images/menu/roasted-mushroom-pizza-v1.webp',
      },
    ],
  },
  {
    name: 'Pasta',
    slug: 'pasta',
    description: 'Fresh pasta and Italian favourites.',
    products: [
      {
        name: 'Creamy Carbonara',
        description:
          'Spaghetti in a creamy parmesan sauce with crisp bacon and cracked black pepper.',
        basePriceCents: 1590,
        imageUrl: '/images/menu/creamy-carbonara-v1.webp',
      },
      {
        name: 'Beef Bolognese',
        description:
          'Rigatoni with slow-cooked beef and tomato ragu, finished with parmesan and parsley.',
        basePriceCents: 1690,
        imageUrl: '/images/menu/beef-bolognese-v1.webp',
      },
    ],
  },
  {
    name: 'Sides',
    slug: 'sides',
    description: 'Sides, snacks and shareable dishes.',
    products: [
      {
        name: 'Garlic Bread',
        description: 'Four toasted slices with garlic butter and parsley.',
        basePriceCents: 590,
        imageUrl: '/images/menu/garlic-bread-v1.webp',
      },
      {
        name: 'Chicken Wings',
        description:
          'Six roasted chicken wings glazed in smoky BBQ sauce, served with a dipping sauce.',
        basePriceCents: 990,
        imageUrl: '/images/menu/chicken-wings-v1.webp',
      },
    ],
  },
  {
    name: 'Drinks',
    slug: 'drinks',
    description: 'Cold drinks and refreshments.',
    products: [
      {
        name: 'Classic Cola',
        description: 'Chilled classic cola in a 330ml bottle.',
        basePriceCents: 350,
        imageUrl: '/images/menu/classic-cola-v1.webp',
      },
      {
        name: 'Lemon Lime Soda',
        description: 'Chilled lemon-lime soda in a 330ml bottle.',
        basePriceCents: 350,
        imageUrl: '/images/menu/lemon-lime-soda-v1.webp',
      },
    ],
  },
  {
    name: 'Desserts',
    slug: 'desserts',
    description: 'Sweet treats and desserts.',
    products: [
      {
        name: 'Tiramisu',
        description:
          'An individual slice layered with coffee-soaked ladyfingers, mascarpone and cocoa.',
        basePriceCents: 790,
        imageUrl: '/images/menu/tiramisu-v1.webp',
      },
      {
        name: 'Chocolate Fudge Brownie',
        description:
          'A single-serve dark chocolate fudge brownie with a crackled top and chocolate drizzle.',
        basePriceCents: 850,
        imageUrl: '/images/menu/chocolate-fudge-brownie-v1.webp',
      },
    ],
  },
];

export function createCatalogCategories(): Prisma.CategoryCreateInput[] {
  return catalogCategories.map(({ products, ...category }, categoryIndex) => ({
    ...category,
    sortOrder: categoryIndex + 1,
    products: {
      create: products.map(({ basePriceCents, ...product }, productIndex) => ({
        ...product,
        basePrice: new Prisma.Decimal(basePriceCents).div(100),
        sortOrder: productIndex + 1,
        ...(category.slug === 'pizza'
          ? {
              optionGroups: {
                create: pizzaOptionGroups.map(
                  ({ options, ...group }, groupIndex) => ({
                    ...group,
                    sortOrder: groupIndex + 1,
                    options: {
                      create: options.map(
                        ({ priceDeltaCents, ...option }, optionIndex) => ({
                          ...option,
                          priceDelta: new Prisma.Decimal(priceDeltaCents).div(
                            100,
                          ),
                          sortOrder: optionIndex + 1,
                        }),
                      ),
                    },
                  }),
                ),
              },
            }
          : {}),
      })),
    },
  }));
}
