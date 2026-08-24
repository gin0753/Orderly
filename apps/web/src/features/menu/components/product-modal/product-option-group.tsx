import { Check } from "lucide-react";

import { formatMoneyFromCents } from "@/lib/format-money";
import { MenuProductOptionGroup } from "../../types";

type ProductOptionGroupProps = {
  group: MenuProductOptionGroup;
  selectedOptionIds: string[];
  onSelect: (optionId: string) => void;
};

export function ProductOptionGroup({
  group,
  selectedOptionIds,
  onSelect,
}: ProductOptionGroupProps) {
  const minimumRequired = Math.max(group.minSelect, group.isRequired ? 1 : 0);

  const maximumAllowed = group.type === "SINGLE" ? 1 : group.maxSelect;

  const hasReachedLimit =
    maximumAllowed > 0 && selectedOptionIds.length >= maximumAllowed;

  const requirementLabel =
    group.type === "SINGLE"
      ? minimumRequired > 0
        ? "Choose 1"
        : "Optional"
      : maximumAllowed > 0
        ? `Choose up to ${maximumAllowed}`
        : "Optional";

  return (
    <section className="mt-6 border-t border-[var(--color-border-soft)] pt-5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            {group.name}
          </h3>

          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {requirementLabel}
          </p>
        </div>

        {minimumRequired > 0 ? (
          <span className="rounded-full bg-[var(--color-surface-muted)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-secondary)]">
            Required
          </span>
        ) : null}
      </div>

      {group.type === "SINGLE" ? (
        <div
          role="radiogroup"
          aria-label={group.name}
          className="grid gap-3 sm:grid-cols-3"
        >
          {group.options.map((option) => {
            const isSelected = selectedOptionIds.includes(option.id);

            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={!option.isAvailable}
                onClick={() => onSelect(option.id)}
                className={[
                  "rounded-2xl border p-4 text-left transition",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  isSelected
                    ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-text-muted)]",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {option.name}
                  </span>

                  <span
                    className={[
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                      isSelected
                        ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                        : "border-[var(--color-border)]",
                    ].join(" ")}
                  >
                    {isSelected ? <Check className="h-3 w-3" /> : null}
                  </span>
                </div>

                <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                  {option.priceDeltaCents === 0
                    ? "Included"
                    : `+${formatMoneyFromCents(option.priceDeltaCents)}`}
                </p>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {group.options.map((option) => {
            const isSelected = selectedOptionIds.includes(option.id);

            const isDisabled =
              !option.isAvailable || (!isSelected && hasReachedLimit);

            return (
              <button
                key={option.id}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                disabled={isDisabled}
                onClick={() => onSelect(option.id)}
                className={[
                  "flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                  isSelected
                    ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
                    : "border-[var(--color-border-soft)] hover:border-[var(--color-border)]",
                ].join(" ")}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={[
                      "flex h-5 w-5 items-center justify-center rounded border",
                      isSelected
                        ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                        : "border-[var(--color-border)]",
                    ].join(" ")}
                  >
                    {isSelected ? <Check className="h-3.5 w-3.5" /> : null}
                  </span>

                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    {option.name}
                  </span>
                </span>

                <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {option.priceDeltaCents === 0
                    ? "Included"
                    : `+${formatMoneyFromCents(option.priceDeltaCents)}`}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
