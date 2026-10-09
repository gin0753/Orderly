/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductOptionGroup } from "@/features/menu/components/product-modal/product-option-group";
import { useProductConfigurator } from "@/features/menu/components/product-modal/hooks/use-product-configurator";
import type { MenuProduct, MenuProductOptionGroup } from "@/features/menu/types";

function group(required = true): MenuProductOptionGroup {
  return {
    id: "size", name: "Size", kind: "SIZE", type: "SINGLE",
    isRequired: required, minSelect: required ? 1 : 0, maxSelect: 1,
    options: [
      { id: "small", name: "Small", priceDelta: "0.00", priceDeltaCents: 0, isDefault: false, isAvailable: true },
      { id: "medium", name: "Medium", priceDelta: "2.00", priceDeltaCents: 200, isDefault: false, isAvailable: false },
      { id: "large", name: "Large", priceDelta: "4.00", priceDeltaCents: 400, isDefault: false, isAvailable: true },
    ],
  };
}

function Configurator({ optionGroup }: { optionGroup: MenuProductOptionGroup }) {
  const product: MenuProduct = { id: "pizza", name: "Pizza", priceCents: 1500, isAvailable: true, optionGroups: [optionGroup] };
  const configuration = useProductConfigurator(product);
  return <>
    <button>Before</button>
    <ProductOptionGroup group={optionGroup} selectedOptionIds={configuration.selectedOptionIdsByGroup.size} onSelect={(id) => configuration.selectOption(optionGroup, id)} />
    <output aria-label="Item total">{configuration.itemTotalCents}</output>
    <button>After</button>
  </>;
}

it("uses one Tab stop, skips unavailable choices, wraps arrows, and preserves totals", async () => {
  const user = userEvent.setup();
  render(<Configurator optionGroup={group()} />);
  const small = screen.getByRole("radio", { name: /Small/ });
  const large = screen.getByRole("radio", { name: /Large/ });
  expect(screen.getByRole("radiogroup", { name: "Size" })).toHaveAccessibleDescription("Choose 1");
  await user.tab();
  await user.tab();
  expect(small).toHaveFocus();
  await user.keyboard(" {Enter}");
  expect(small).toHaveAttribute("aria-checked", "true");
  await user.keyboard("{ArrowRight}");
  expect(large).toHaveFocus();
  expect(large).toHaveAttribute("aria-checked", "true");
  expect(screen.getByLabelText("Item total")).toHaveTextContent("1900");
  expect(screen.getByRole("radio", { name: /Medium/ })).toBeDisabled();
  await user.keyboard("{ArrowDown}");
  expect(small).toHaveFocus();
  await user.keyboard("{ArrowLeft}");
  expect(large).toHaveFocus();
  await user.keyboard("{Home}");
  expect(small).toHaveFocus();
  await user.keyboard("{End}");
  expect(large).toHaveFocus();
  await user.tab();
  expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
  await user.tab({ shift: true });
  expect(large).toHaveFocus();
});

it("preserves optional Space/Enter/click clearing while arrow navigation selects", async () => {
  const user = userEvent.setup();
  render(<Configurator optionGroup={group(false)} />);
  const small = screen.getByRole("radio", { name: /Small/ });
  const large = screen.getByRole("radio", { name: /Large/ });
  await user.click(large);
  await user.keyboard(" ");
  expect(large).toHaveAttribute("aria-checked", "false");
  await user.keyboard("{ArrowLeft}");
  expect(small).toHaveAttribute("aria-checked", "true");
  await user.keyboard("{Enter}");
  expect(small).toHaveAttribute("aria-checked", "false");
  await user.click(large);
  await user.click(large);
  expect(large).toHaveAttribute("aria-checked", "false");
});

it("does not clear an optional choice when it is the only available arrow destination", async () => {
  const user = userEvent.setup();
  const only = group(false);
  only.options = only.options.slice(0, 1);
  render(<Configurator optionGroup={only} />);
  const small = screen.getByRole("radio", { name: /Small/ });
  await user.click(small);
  await user.keyboard("{ArrowRight}{ArrowLeft}{Home}{End}");
  expect(small).toHaveAttribute("aria-checked", "true");
});

it("handles groups with no available choices without creating an enabled Tab stop", () => {
  const unavailable = group();
  unavailable.options = unavailable.options.map((option) => ({ ...option, isAvailable: false }));
  render(<Configurator optionGroup={unavailable} />);
  for (const radio of screen.getAllByRole("radio")) {
    expect(radio).toBeDisabled();
    expect(radio).toHaveAttribute("tabindex", "-1");
  }
});

it("preserves multiple-choice limits and allows removing a selected choice", async () => {
  const user = userEvent.setup();
  const multiple: MenuProductOptionGroup = { ...group(false), type: "MULTIPLE", kind: "ADD_ON" };
  render(<Configurator optionGroup={multiple} />);
  const small = screen.getByRole("checkbox", { name: /Small/ });
  const large = screen.getByRole("checkbox", { name: /Large/ });
  await user.click(small);
  expect(small).toHaveAttribute("aria-checked", "true");
  expect(small).toBeEnabled();
  expect(large).toBeDisabled();
  await user.click(small);
  expect(small).toHaveAttribute("aria-checked", "false");
  expect(large).toBeEnabled();
});
