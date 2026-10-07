/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";

import { MenuHero } from "@/features/menu/components/menu-hero";

const product = {
  name: "Roasted Mushroom",
  imageUrl: "/images/menu/roasted-mushroom-pizza-v1.webp",
  priceCents: 1790,
};

const store = {
  name: "Orderly Kitchen",
  isAcceptingOrders: true,
  pickupEnabled: true,
  deliveryEnabled: true,
  estimatedPreparationMinutes: 20,
};

describe("homepage hero", () => {
  it("renders the approved copy, actions, and product image", () => {
    render(<MenuHero store={store} product={product} />);

    expect(
      screen.getByRole("heading", {
        name: "Fresh comfort food, ready when you are.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Orderly Kitchen")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse menu" })).toHaveAttribute(
      "href",
      "#menu",
    );
    expect(screen.getByRole("link", { name: "Track order" })).toHaveAttribute(
      "href",
      "/track-order",
    );

    const image = screen.getByRole("img", { name: product.name });
    expect(image.getAttribute("src")).toContain(
      encodeURIComponent(product.imageUrl),
    );
    expect(image).toHaveAttribute(
      "sizes",
      "(min-width: 1152px) 474px, (min-width: 768px) 320px, calc(100vw - 68px)",
    );
  });

  it.each([
    [true, true, "Pickup + delivery"],
    [true, false, "Pickup available"],
    [false, true, "Delivery available"],
  ])(
    "renders the supported fulfillment mode for pickup=%s delivery=%s",
    (pickupEnabled, deliveryEnabled, label) => {
      render(
        <MenuHero
          store={{ ...store, pickupEnabled, deliveryEnabled }}
          product={product}
        />,
      );

      expect(screen.getByText(label)).toBeInTheDocument();
    },
  );

  it("omits fulfillment when neither mode is available", () => {
    render(
      <MenuHero
        store={{ ...store, pickupEnabled: false, deliveryEnabled: false }}
        product={product}
      />,
    );

    expect(screen.queryByText(/Pickup|Delivery/)).not.toBeInTheDocument();
  });

  it("renders valid preparation minutes", () => {
    render(<MenuHero store={store} product={product} />);

    expect(screen.getByText("Estimated prep · 20 min")).toBeInTheDocument();
  });

  it.each([undefined, 0, -1, 1.5, Number.NaN])(
    "omits invalid preparation minutes: %s",
    (estimatedPreparationMinutes) => {
      render(
        <MenuHero
          store={{ ...store, estimatedPreparationMinutes }}
          product={product}
        />,
      );

      expect(screen.queryByText(/Estimated prep/)).not.toBeInTheDocument();
    },
  );

  it.each([
    [true, "Accepting orders"],
    [false, "Ordering paused"],
  ])("renders availability=%s as %s", (isAcceptingOrders, label) => {
    render(
      <MenuHero
        store={{ ...store, isAcceptingOrders }}
        product={product}
      />,
    );

    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("omits unsupported claims", () => {
    render(<MenuHero store={store} product={product} />);

    for (const unsupported of [
      /Rating/i,
      /Open now/i,
      /20–30 min/i,
      /30–45 min/i,
      /Fresh ingredients/i,
    ]) {
      expect(screen.queryByText(unsupported)).not.toBeInTheDocument();
    }
  });
});
