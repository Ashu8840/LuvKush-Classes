"use client";

import { ParentChild } from "@/lib/api";
import { cn } from "@/lib/utils";

type ChildSelectorProps = {
  children: ParentChild[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function ChildSelector({ children, selectedId, onSelect }: ChildSelectorProps) {
  if (!children.length) {
    return (
      <p className="rounded-xl border border-default bg-card p-4 text-sm text-muted">
        No linked children found. Contact the institute admin.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {children.map((child) => (
        <button
          key={child.student._id}
          onClick={() => onSelect(child.student._id)}
          className={cn(
            "rounded-xl border px-4 py-2.5 text-sm font-medium transition",
            selectedId === child.student._id
              ? "border-primary bg-primary text-primary-foreground"
              : "border-default bg-card text-foreground hover:bg-primary-light"
          )}
        >
          {child.student.name}
        </button>
      ))}
    </div>
  );
}