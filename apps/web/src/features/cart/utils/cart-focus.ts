let cartOpener: HTMLElement | null = null;

export function setCartOpener(element: HTMLElement | null) {
  cartOpener = element;
}

export function getCartOpener() {
  return cartOpener;
}
