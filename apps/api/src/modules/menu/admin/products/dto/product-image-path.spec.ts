import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateProductDto } from './create-product.dto';
import { UpdateProductDto } from './update-product.dto';

describe.each([CreateProductDto, UpdateProductDto])(
  '%p image validation',
  (Dto) => {
    const values = {
      name: 'Margherita',
      categoryId: 'dfebf290-0f43-47aa-aecd-a7cba4b5e5dd',
      basePriceCents: 1490,
    };
    it.each([
      undefined,
      null,
      '/images/menu/margherita-pizza-v1.webp',
      '/images/menu/cola-330-v12.webp',
    ])('accepts %s', async (imageUrl) => {
      expect(
        await validate(
          plainToInstance<
            CreateProductDto | UpdateProductDto,
            typeof values & { imageUrl?: string | null }
          >(Dto, { ...values, imageUrl }),
        ),
      ).toEqual([]);
    });
    it.each([
      '',
      'https://example.com/image.webp',
      'http://example.com/image.webp',
      '//example.com/image.webp',
      '/images/menu/../image-v1.webp',
      '/images/menu/%2e%2e/image-v1.webp',
      '/images/menu/item-v1.jpg',
      '/images/menu/item.webp',
      '/images/menu/item-v0.webp',
      '/images/menu/Item-v1.webp',
      '/images/menu/item-v1.webp?x=1',
      '/images/menu/item-v1.webp\n',
    ])('rejects %s', async (imageUrl) => {
      const errors = await validate(
        plainToInstance<
          CreateProductDto | UpdateProductDto,
          typeof values & { imageUrl?: string | null }
        >(Dto, { ...values, imageUrl }),
      );
      expect(errors.some((error) => error.property === 'imageUrl')).toBe(true);
    });
  },
);
