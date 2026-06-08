"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, EyeOff, KeyRound } from "lucide-react";

type UserInfo = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  recoverablePassword?: string;
};

function getInitials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function UserManagementCard({
  user,
  children,
  actions,
}: {
  user: UserInfo;
  children: React.ReactNode;
  actions: React.ReactNode;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="rounded-2xl border border-default bg-card p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary/30 bg-primary-light">
          {user.avatar ? (
            <Image src={user.avatar} alt="" width={56} height={56} className="h-full w-full object-cover" unoptimized />
          ) : (
            <span className="text-sm font-bold text-primary">{getInitials(user.name)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-foreground">{user.name}</h4>
              <p className="text-sm text-muted">{user.email}</p>
              {user.phone && <p className="text-xs text-muted">{user.phone}</p>}
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${user.isActive ? "badge-success" : "badge-danger"}`}>
              {user.isActive ? "Active" : "Blocked"}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-default bg-surface/60 px-3 py-2">
            <KeyRound className="h-3.5 w-3.5 shrink-0 text-muted" />
            <span className="text-xs font-medium text-muted">Login Password:</span>
            <span className="flex-1 font-mono text-sm text-foreground">
              {user.recoverablePassword
                ? showPassword
                  ? user.recoverablePassword
                  : "••••••••"
                : "Not recorded"}
            </span>
            {user.recoverablePassword && (
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="rounded p-1 text-muted hover:bg-primary-light hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-sm">{children}</div>
      <div className="mt-4 flex flex-wrap gap-2">{actions}</div>
    </div>
  );
}