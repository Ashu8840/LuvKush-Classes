"use client";

import { FormEvent, useRef, useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { useKeyboardInset } from "@/hooks/useKeyboardInset";

export function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const { inset, scrollAboveKeyboard } = useKeyboardInset();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFieldFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    scrollAboveKeyboard(e.currentTarget);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await api.changePassword({ currentPassword, newPassword, confirmPassword });
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="max-lg:pb-2"
      style={inset > 0 ? { paddingBottom: inset } : undefined}
    >
      <Card className="p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound className="h-5 w-5 shrink-0 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
        </div>
        <form ref={formRef} onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
          <PasswordInput
            label="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            onFocus={handleFieldFocus}
            required
            autoComplete="current-password"
          />
          <PasswordInput
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onFocus={handleFieldFocus}
            required
            minLength={6}
            autoComplete="new-password"
          />
          <PasswordInput
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onFocus={handleFieldFocus}
            required
            minLength={6}
            autoComplete="new-password"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60 sm:w-auto sm:self-start"
          >
            {loading ? "Updating…" : "Update Password"}
          </button>
        </form>
      </Card>
    </div>
  );
}