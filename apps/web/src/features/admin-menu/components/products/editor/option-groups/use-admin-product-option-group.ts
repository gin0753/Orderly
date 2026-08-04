"use client";

import { useCallback } from "react";
import { useController, useFormContext, useWatch } from "react-hook-form";

import type { AdminProductFormValues } from "../../../../types/admin-product-form.types";
import {
  OPTION_GROUP_TYPE,
  PRODUCT_OPTION_GROUP_KIND,
  type OptionGroupType,
  type ProductOptionGroupKind,
} from "../../../../types/admin-product.types";

export function useAdminProductOptionGroup(groupIndex: number) {
  const { control, getValues, setValue } =
    useFormContext<AdminProductFormValues>();

  const groupName =
    useWatch({
      control,
      name: `optionGroups.${groupIndex}.name`,
    }) ?? "";

  const minSelect =
    useWatch({
      control,
      name: `optionGroups.${groupIndex}.minSelect`,
    }) ?? 0;

  const maxSelect =
    useWatch({
      control,
      name: `optionGroups.${groupIndex}.maxSelect`,
    }) ?? 1;

  const { field: kindField } = useController({
    control,
    name: `optionGroups.${groupIndex}.kind`,
  });

  const { field: typeField } = useController({
    control,
    name: `optionGroups.${groupIndex}.type`,
  });

  const { field: requiredField } = useController({
    control,
    name: `optionGroups.${groupIndex}.isRequired`,
  });

  const { field: activeField } = useController({
    control,
    name: `optionGroups.${groupIndex}.isActive`,
  });

  const kind = kindField.value as ProductOptionGroupKind;

  const selectionType = typeField.value as OptionGroupType;

  const isRequired = Boolean(requiredField.value);

  const isActive = Boolean(activeField.value);

  const minimumRequired = isRequired ? Math.max(minSelect, 1) : 0;

  const clearDefaults = useCallback(() => {
    const options = getValues(`optionGroups.${groupIndex}.options`) ?? [];

    options.forEach((option, optionIndex) => {
      if (!option.isDefault) {
        return;
      }

      setValue(
        `optionGroups.${groupIndex}.options.${optionIndex}.isDefault`,
        false,
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );
    });
  }, [getValues, groupIndex, setValue]);

  const changeKind = useCallback(
    (nextKind: ProductOptionGroupKind) => {
      kindField.onChange(nextKind);

      if (nextKind !== PRODUCT_OPTION_GROUP_KIND.SIZE) {
        return;
      }

      typeField.onChange(OPTION_GROUP_TYPE.SINGLE);

      setValue(`optionGroups.${groupIndex}.maxSelect`, 1, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [groupIndex, kindField, setValue, typeField],
  );

  const changeSelectionType = useCallback(
    (nextType: OptionGroupType) => {
      if (
        kind === PRODUCT_OPTION_GROUP_KIND.SIZE &&
        nextType !== OPTION_GROUP_TYPE.SINGLE
      ) {
        return;
      }

      typeField.onChange(nextType);

      if (nextType === OPTION_GROUP_TYPE.SINGLE) {
        setValue(`optionGroups.${groupIndex}.maxSelect`, 1, {
          shouldDirty: true,
          shouldValidate: true,
        });

        return;
      }

      clearDefaults();
    },
    [clearDefaults, groupIndex, kind, setValue, typeField],
  );

  const setIsRequired = useCallback(
    (nextIsRequired: boolean) => {
      requiredField.onChange(nextIsRequired);

      const currentMinimum = getValues(`optionGroups.${groupIndex}.minSelect`);

      if (nextIsRequired && currentMinimum < 1) {
        setValue(`optionGroups.${groupIndex}.minSelect`, 1, {
          shouldDirty: true,
          shouldValidate: true,
        });

        return;
      }

      if (!nextIsRequired && currentMinimum > 0) {
        setValue(`optionGroups.${groupIndex}.minSelect`, 0, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    },
    [getValues, groupIndex, requiredField, setValue],
  );

  const setIsActive = useCallback(
    (nextIsActive: boolean) => {
      activeField.onChange(nextIsActive);
    },
    [activeField],
  );

  const setDefaultOption = useCallback(
    (targetOptionIndex: number, isDefault: boolean) => {
      if (selectionType !== OPTION_GROUP_TYPE.SINGLE) {
        return;
      }

      const options = getValues(`optionGroups.${groupIndex}.options`) ?? [];

      options.forEach((_, optionIndex) => {
        setValue(
          `optionGroups.${groupIndex}.options.${optionIndex}.isDefault`,
          isDefault && optionIndex === targetOptionIndex,
          {
            shouldDirty: true,
            shouldValidate: true,
          },
        );
      });
    },
    [getValues, groupIndex, selectionType, setValue],
  );

  return {
    groupName,
    kind,
    selectionType,
    isRequired,
    isActive,
    minSelect,
    maxSelect,
    minimumRequired,

    changeKind,
    changeSelectionType,
    setIsRequired,
    setIsActive,
    setDefaultOption,
  };
}

export type AdminProductOptionGroupController = ReturnType<
  typeof useAdminProductOptionGroup
>;
