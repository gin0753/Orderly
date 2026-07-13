"use client";

import { useMemo, useState } from "react";

import type { CartSelectedOption } from "@/features/cart/cart-types";
import { getUnitPriceCents } from "@/features/cart/cart-utils";
import type {
  MenuProduct,
  MenuProductOptionGroup,
} from "@/features/menu/types";

export type SelectedOptionIdsByGroup = Record<string, string[]>;

function getMinimumRequired(group: MenuProductOptionGroup) {
  return Math.max(group.minSelect, group.isRequired ? 1 : 0);
}

function getMaximumAllowed(group: MenuProductOptionGroup) {
  return group.type === "SINGLE" ? 1 : group.maxSelect;
}

export function createInitialSelections(
  product: MenuProduct,
): SelectedOptionIdsByGroup {
  const selections: SelectedOptionIdsByGroup = {};

  for (const group of product.optionGroups) {
    if (group.type === "MULTIPLE") {
      selections[group.id] = [];
      continue;
    }

    const defaultOption = group.options.find(
      (option) => option.isDefault && option.isAvailable,
    );

    const fallbackOption =
      getMinimumRequired(group) > 0
        ? group.options.find((option) => option.isAvailable)
        : undefined;

    const initialOption = defaultOption ?? fallbackOption;

    selections[group.id] = initialOption ? [initialOption.id] : [];
  }

  return selections;
}

function isGroupSelectionValid(
  group: MenuProductOptionGroup,
  selectedOptionIds: string[],
) {
  const availableOptionIds = new Set(
    group.options
      .filter((option) => option.isAvailable)
      .map((option) => option.id),
  );

  const containsInvalidOption = selectedOptionIds.some(
    (optionId) => !availableOptionIds.has(optionId),
  );

  if (containsInvalidOption) {
    return false;
  }

  const selectedCount = selectedOptionIds.length;
  const minimumRequired = getMinimumRequired(group);
  const maximumAllowed = getMaximumAllowed(group);

  return selectedCount >= minimumRequired && selectedCount <= maximumAllowed;
}

export function useProductConfigurator(product: MenuProduct) {
  const [selectedOptionIdsByGroup, setSelectedOptionIdsByGroup] =
    useState<SelectedOptionIdsByGroup>(() => createInitialSelections(product));

  const [quantity, setQuantity] = useState(1);

  const selectedOptions = useMemo<CartSelectedOption[]>(() => {
    return product.optionGroups.flatMap((group) => {
      const selectedIds = selectedOptionIdsByGroup[group.id] ?? [];

      return group.options
        .filter(
          (option) => option.isAvailable && selectedIds.includes(option.id),
        )
        .map((option) => ({
          id: option.id,
          optionGroupId: group.id,
          optionGroupName: group.name,
          kind: group.kind,
          name: option.name,
          priceDeltaCents: option.priceDeltaCents,
        }));
    });
  }, [product.optionGroups, selectedOptionIdsByGroup]);

  const unitPriceCents = useMemo(() => {
    return getUnitPriceCents({
      product,
      selectedOptions,
    });
  }, [product, selectedOptions]);

  const itemTotalCents = unitPriceCents * quantity;

  const hasValidOptionSelections = useMemo(() => {
    return product.optionGroups.every((group) =>
      isGroupSelectionValid(group, selectedOptionIdsByGroup[group.id] ?? []),
    );
  }, [product.optionGroups, selectedOptionIdsByGroup]);

  function selectOption(group: MenuProductOptionGroup, optionId: string) {
    const option = group.options.find(
      (candidate) => candidate.id === optionId && candidate.isAvailable,
    );

    if (!option) {
      return;
    }

    setSelectedOptionIdsByGroup((currentSelections) => {
      const currentIds = currentSelections[group.id] ?? [];

      if (group.type === "SINGLE") {
        const isAlreadySelected =
          currentIds.length === 1 && currentIds[0] === optionId;

        const mayClearSelection = getMinimumRequired(group) === 0;

        return {
          ...currentSelections,
          [group.id]: isAlreadySelected && mayClearSelection ? [] : [optionId],
        };
      }

      if (currentIds.includes(optionId)) {
        return {
          ...currentSelections,
          [group.id]: currentIds.filter((currentId) => currentId !== optionId),
        };
      }

      const maximumAllowed = getMaximumAllowed(group);

      if (currentIds.length >= maximumAllowed) {
        return currentSelections;
      }

      return {
        ...currentSelections,
        [group.id]: [...currentIds, optionId],
      };
    });
  }

  return {
    selectedOptionIdsByGroup,
    selectedOptions,
    quantity,
    setQuantity,
    unitPriceCents,
    itemTotalCents,
    hasValidOptionSelections,
    selectOption,
  };
}
