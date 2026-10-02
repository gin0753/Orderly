export const PRODUCT_IMAGE_PATH =
  /^\/images\/menu\/[a-z0-9]+(?:-[a-z0-9]+)*-v[1-9]\d*\.webp$(?![\s\S])/;

export const PRODUCT_IMAGE_PATH_MESSAGE =
  "Use a versioned path such as /images/menu/margherita-pizza-v1.webp.";

export function isProductImagePath(value: string): boolean {
  return value.length <= 2048 && PRODUCT_IMAGE_PATH.test(value);
}
