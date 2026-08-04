import {
  OPTION_GROUP_TYPE,
  PRODUCT_OPTION_GROUP_KIND,
  type AdminProductDetail,
  type CreateAdminProductOptionGroupRequest,
  type CreateAdminProductRequest,
  type OptionGroupType,
  type ProductOptionGroupKind,
  type UpdateAdminProductOptionGroupRequest,
  type UpdateAdminProductRequest,
} from "../types/admin-product.types";
import type {
  AdminProductFormValues,
  AdminProductOptionFormValues,
  AdminProductOptionGroupFormValues,
} from "../types/admin-product-form.types";

export const EMPTY_ADMIN_PRODUCT_FORM_VALUES: AdminProductFormValues = {
  name: "",
  description: "",
  categoryId: "",
  basePrice: "",
  imageUrl: "",
  optionGroups: [],
};

function assertNever(value: never): never {
  throw new Error(`Unsupported option group kind: ${String(value)}`);
}

function parseCurrencyStringToCents(value: string, allowNegative: boolean) {
  const normalizedValue = value.trim();

  const currencyPattern = allowNegative
    ? /^-?\d+(?:\.\d{1,2})?$/
    : /^\d+(?:\.\d{1,2})?$/;

  if (!currencyPattern.test(normalizedValue)) {
    return null;
  }

  const isNegative = normalizedValue.startsWith("-");

  const unsignedValue = isNegative ? normalizedValue.slice(1) : normalizedValue;

  const [wholePart, decimalPart = ""] = unsignedValue.split(".");

  const wholeCents = Number.parseInt(wholePart, 10) * 100;

  const fractionalCents = Number.parseInt(
    decimalPart.padEnd(2, "0") || "0",
    10,
  );

  const unsignedTotalCents = wholeCents + fractionalCents;

  if (!Number.isSafeInteger(unsignedTotalCents)) {
    return null;
  }

  return isNegative ? -unsignedTotalCents : unsignedTotalCents;
}

/**
 * Parses a non-negative product base price.
 *
 * Examples:
 * "14"    -> 1400
 * "14.9"  -> 1490
 * "14.90" -> 1490
 * "-1.00" -> null
 */
export function parsePriceToCents(value: string) {
  return parseCurrencyStringToCents(value, false);
}

/**
 * Parses a signed option price adjustment.
 *
 * Examples:
 * "-1.00" -> -100
 * "0.00"  -> 0
 * "2.50"  -> 250
 */
export function parsePriceAdjustmentToCents(value: string) {
  return parseCurrencyStringToCents(value, true);
}

export function formatCentsForPriceInput(cents: number) {
  return (cents / 100).toFixed(2);
}

/**
 * Returns the recommended initial selection type for a newly
 * created option group.
 *
 * This is a creation default, not a permanent kind/type mapping.
 *
 * SIZE     -> SINGLE
 * MODIFIER -> SINGLE
 * ADD_ON   -> MULTIPLE
 */
export function getDefaultOptionGroupType(
  kind: ProductOptionGroupKind,
): OptionGroupType {
  switch (kind) {
    case PRODUCT_OPTION_GROUP_KIND.SIZE:
    case PRODUCT_OPTION_GROUP_KIND.MODIFIER:
      return OPTION_GROUP_TYPE.SINGLE;

    case PRODUCT_OPTION_GROUP_KIND.ADD_ON:
      return OPTION_GROUP_TYPE.MULTIPLE;

    default:
      return assertNever(kind);
  }
}

export function createEmptyAdminProductOption(
  isDefault = false,
): AdminProductOptionFormValues {
  return {
    name: "",
    priceDelta: "0.00",
    isAvailable: true,
    isDefault,
  };
}

export function createEmptyAdminProductOptionGroup(
  kind: ProductOptionGroupKind,
): AdminProductOptionGroupFormValues {
  switch (kind) {
    case PRODUCT_OPTION_GROUP_KIND.SIZE:
      return {
        name: "Size",
        kind: PRODUCT_OPTION_GROUP_KIND.SIZE,
        type: OPTION_GROUP_TYPE.SINGLE,
        isRequired: true,
        minSelect: 1,
        maxSelect: 1,
        isActive: true,
        options: [createEmptyAdminProductOption(true)],
      };

    case PRODUCT_OPTION_GROUP_KIND.MODIFIER:
      return {
        name: "Modifiers",
        kind: PRODUCT_OPTION_GROUP_KIND.MODIFIER,
        type: OPTION_GROUP_TYPE.SINGLE,
        isRequired: false,
        minSelect: 0,
        maxSelect: 1,
        isActive: true,
        options: [createEmptyAdminProductOption()],
      };

    case PRODUCT_OPTION_GROUP_KIND.ADD_ON:
      return {
        name: "Add-ons",
        kind: PRODUCT_OPTION_GROUP_KIND.ADD_ON,
        type: OPTION_GROUP_TYPE.MULTIPLE,
        isRequired: false,
        minSelect: 0,
        maxSelect: 1,
        isActive: true,
        options: [createEmptyAdminProductOption()],
      };

    default:
      return assertNever(kind);
  }
}

export function mapProductToFormValues(
  product: AdminProductDetail,
): AdminProductFormValues {
  const orderedOptionGroups = [...product.optionGroups].sort(
    (firstGroup, secondGroup) => firstGroup.sortOrder - secondGroup.sortOrder,
  );

  return {
    name: product.name,
    description: product.description ?? "",
    categoryId: product.category.id,
    basePrice: formatCentsForPriceInput(product.basePriceCents),
    imageUrl: product.imageUrl ?? "",

    optionGroups: orderedOptionGroups.map((group) => {
      const orderedOptions = [...group.options].sort(
        (firstOption, secondOption) =>
          firstOption.sortOrder - secondOption.sortOrder,
      );

      return {
        id: group.id,
        name: group.name,
        kind: group.kind,
        type: group.type,
        isRequired: group.isRequired,
        minSelect: group.minSelect,
        maxSelect: group.maxSelect,
        isActive: group.isActive,

        options: orderedOptions.map((option) => ({
          id: option.id,
          name: option.name,
          priceDelta: formatCentsForPriceInput(option.priceDeltaCents),
          isAvailable: option.isAvailable,
          isDefault: option.isDefault,
        })),
      };
    }),
  };
}

function getOptionPriceDeltaCents(value: string) {
  const priceDeltaCents = parsePriceAdjustmentToCents(value);

  if (priceDeltaCents === null) {
    throw new Error("An option price adjustment is invalid.");
  }

  return priceDeltaCents;
}

/**
 * SIZE is the only kind with a mandatory selection type.
 *
 * MODIFIER and ADD_ON retain the type selected in the form.
 */
function normalizeOptionGroupType(
  group: AdminProductOptionGroupFormValues,
): OptionGroupType {
  if (group.kind === PRODUCT_OPTION_GROUP_KIND.SIZE) {
    return OPTION_GROUP_TYPE.SINGLE;
  }

  return group.type;
}

function normalizeOptionGroupMaxSelect(
  selectionType: OptionGroupType,
  maxSelect: number,
) {
  return selectionType === OPTION_GROUP_TYPE.SINGLE ? 1 : maxSelect;
}

function normalizeOptionDefault(
  selectionType: OptionGroupType,
  isDefault: boolean,
) {
  return selectionType === OPTION_GROUP_TYPE.SINGLE ? isDefault : false;
}

function mapOptionGroupToCreateRequest(
  group: AdminProductOptionGroupFormValues,
): CreateAdminProductOptionGroupRequest {
  const selectionType = normalizeOptionGroupType(group);

  return {
    name: group.name.trim(),
    kind: group.kind,
    type: selectionType,
    isRequired: group.isRequired,
    minSelect: group.minSelect,
    maxSelect: normalizeOptionGroupMaxSelect(selectionType, group.maxSelect),
    isActive: group.isActive,

    options: group.options.map((option) => ({
      name: option.name.trim(),
      priceDeltaCents: getOptionPriceDeltaCents(option.priceDelta),
      isAvailable: option.isAvailable,
      isDefault: normalizeOptionDefault(selectionType, option.isDefault),
    })),
  };
}

function mapOptionGroupToUpdateRequest(
  group: AdminProductOptionGroupFormValues,
): UpdateAdminProductOptionGroupRequest {
  const selectionType = normalizeOptionGroupType(group);

  return {
    ...(group.id
      ? {
          id: group.id,
        }
      : {}),

    name: group.name.trim(),
    kind: group.kind,
    type: selectionType,
    isRequired: group.isRequired,
    minSelect: group.minSelect,
    maxSelect: normalizeOptionGroupMaxSelect(selectionType, group.maxSelect),
    isActive: group.isActive,

    options: group.options.map((option) => ({
      ...(option.id
        ? {
            id: option.id,
          }
        : {}),

      name: option.name.trim(),
      priceDeltaCents: getOptionPriceDeltaCents(option.priceDelta),
      isAvailable: option.isAvailable,
      isDefault: normalizeOptionDefault(selectionType, option.isDefault),
    })),
  };
}

export function mapFormValuesToCreateRequest(
  values: AdminProductFormValues,
): CreateAdminProductRequest {
  const basePriceCents = parsePriceToCents(values.basePrice);

  if (basePriceCents === null) {
    throw new Error("Product price is invalid.");
  }

  const description = values.description.trim();
  const imageUrl = values.imageUrl.trim();

  return {
    name: values.name.trim(),
    categoryId: values.categoryId,
    basePriceCents,

    ...(description
      ? {
          description,
        }
      : {}),

    ...(imageUrl
      ? {
          imageUrl,
        }
      : {}),

    optionGroups: values.optionGroups.map(mapOptionGroupToCreateRequest),
  };
}

export function mapFormValuesToUpdateRequest(
  values: AdminProductFormValues,
): UpdateAdminProductRequest {
  const basePriceCents = parsePriceToCents(values.basePrice);

  if (basePriceCents === null) {
    throw new Error("Product price is invalid.");
  }

  return {
    name: values.name.trim(),
    categoryId: values.categoryId,
    basePriceCents,
    description: values.description.trim() || null,
    imageUrl: values.imageUrl.trim() || null,

    optionGroups: values.optionGroups.map(mapOptionGroupToUpdateRequest),
  };
}

export function getAdminProductOptionGroupsValidationError(
  groups: AdminProductOptionGroupFormValues[],
) {
  const activeSizeGroupCount = groups.filter(
    (group) => group.kind === PRODUCT_OPTION_GROUP_KIND.SIZE && group.isActive,
  ).length;

  if (activeSizeGroupCount > 1) {
    return "A product can only have one active size group.";
  }

  const normalizedGroupNames = new Set<string>();

  for (const group of groups) {
    const groupName = group.name.trim();

    if (!groupName) {
      return "Every option group requires a name.";
    }

    const normalizedGroupName = groupName.toLowerCase();

    if (normalizedGroupNames.has(normalizedGroupName)) {
      return "Option group names must be unique within the product.";
    }

    normalizedGroupNames.add(normalizedGroupName);

    if (
      group.kind === PRODUCT_OPTION_GROUP_KIND.SIZE &&
      group.type !== OPTION_GROUP_TYPE.SINGLE
    ) {
      return `${groupName} must use single selection.`;
    }

    if (!Number.isInteger(group.minSelect) || group.minSelect < 0) {
      return `${groupName} has an invalid minimum selection value.`;
    }

    if (!Number.isInteger(group.maxSelect) || group.maxSelect < 1) {
      return `${groupName} has an invalid maximum selection value.`;
    }

    if (group.type === OPTION_GROUP_TYPE.SINGLE && group.maxSelect !== 1) {
      return `${groupName} must have a maximum selection of 1 when single selection is enabled.`;
    }

    if (group.isRequired && group.minSelect < 1) {
      return `${groupName} must require at least one selection.`;
    }

    if (group.minSelect > group.maxSelect) {
      return `${groupName} has a minimum selection greater than its maximum.`;
    }

    if (group.options.length === 0) {
      return `${groupName} must contain at least one option.`;
    }

    const normalizedOptionNames = new Set<string>();

    for (const option of group.options) {
      const optionName = option.name.trim();

      if (!optionName) {
        return `Every option in ${groupName} requires a name.`;
      }

      const normalizedOptionName = optionName.toLowerCase();

      if (normalizedOptionNames.has(normalizedOptionName)) {
        return `Option names must be unique within ${groupName}.`;
      }

      normalizedOptionNames.add(normalizedOptionName);

      if (parsePriceAdjustmentToCents(option.priceDelta) === null) {
        return `${optionName} in ${groupName} has an invalid price adjustment.`;
      }

      if (option.isDefault && !option.isAvailable) {
        return `The default option in ${groupName} must be available.`;
      }
    }

    const availableOptions = group.options.filter(
      (option) => option.isAvailable,
    );

    if (group.isActive && availableOptions.length < group.minSelect) {
      return `${groupName} does not have enough available options to satisfy its minimum selection.`;
    }

    const defaultOptions = group.options.filter((option) => option.isDefault);

    if (
      group.type === OPTION_GROUP_TYPE.MULTIPLE &&
      defaultOptions.length > 0
    ) {
      return `${groupName} cannot have default options when multiple selection is enabled.`;
    }

    if (group.type === OPTION_GROUP_TYPE.SINGLE && defaultOptions.length > 1) {
      return `${groupName} can only have one default option.`;
    }
  }

  return null;
}

export function validateAdminProductImageUrl(value: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return true;
  }

  if (normalizedValue.startsWith("/")) {
    return true;
  }

  try {
    const url = new URL(normalizedValue);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
