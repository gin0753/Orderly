"use client";

import { useEffect, useId, useRef, type MouseEvent } from "react";

import { Button } from "@/components/ui/button";

interface AdminCategoryArchiveDialogProps {
  categoryName: string;
  isArchiving: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export function AdminCategoryArchiveDialog({
  categoryName,
  isArchiving,
  errorMessage,
  onCancel,
  onConfirm,
}: AdminCategoryArchiveDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    dialog.showModal();

    return () => {
      if (dialog.open) {
        dialog.close();
      }
    };
  }, []);

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget && !isArchiving) {
      onCancel();
    }
  }

  async function handleConfirm() {
    try {
      await onConfirm();
    } catch {
      // Mutation error is rendered through errorMessage.
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();

        if (!isArchiving) {
          onCancel();
        }
      }}
      onClick={handleBackdropClick}
      className={[
        "m-auto w-[calc(100%-2rem)] max-w-md p-0",
        "rounded-xl",
        "bg-transparent",
        "backdrop:bg-[var(--color-overlay)]",
      ].join(" ")}
    >
      <div
        className={[
          "rounded-xl p-6",
          "border border-[var(--color-border)]",
          "bg-[var(--color-surface)]",
        ].join(" ")}
      >
        <h2
          id={titleId}
          className="text-lg font-semibold text-[var(--color-text-primary)]"
        >
          Archive “{categoryName}”?
        </h2>

        <div
          id={descriptionId}
          className="mt-2 space-y-3 text-sm leading-6 text-[var(--color-text-secondary)]"
        >
          <p>
            This category will be removed from removed from the main category
            list and hidden from customers.
          </p>

          <p>
            Its products and existing associations will remain saved. You can
            restore the category later; restored categories return as inactive.
          </p>
        </div>

        {errorMessage ? (
          <div
            role="alert"
            className={[
              "mt-4 rounded-lg px-4 py-3",
              "border border-[var(--color-danger-border)]",
              "bg-[var(--color-danger-surface)]",
            ].join(" ")}
          >
            <p className="text-sm text-[var(--color-danger-strong)]">
              {errorMessage}
            </p>
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={isArchiving}
            onClick={onCancel}
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={isArchiving}
            onClick={() => {
              void handleConfirm();
            }}
          >
            {isArchiving ? "Archiving…" : "Archive category"}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
