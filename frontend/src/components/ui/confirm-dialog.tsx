"use client";

import { Modal } from "./modal";
import { Button } from "./input";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="whitespace-pre-wrap text-sm text-muted">{message}</p>
      <div className="mt-6 flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
          {cancelLabel}
        </Button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`flex-1 rounded-xl py-2.5 text-sm font-medium text-white hover:opacity-90 ${
            variant === "danger" ? "bg-danger" : "bg-primary text-primary-foreground"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}