"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function PasswordInput({
  label,
  className,
  inputClassName,
  onFocus,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  inputClassName?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          className={cn(
            "input-field w-full rounded-xl border py-2.5 pl-4 pr-11 text-sm outline-none focus:border-primary",
            inputClassName
          )}
          onFocus={onFocus}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted transition hover:bg-surface hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}