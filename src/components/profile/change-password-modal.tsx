"use client";

import { FormEvent, useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ChangePasswordModalProps {
  enabled: boolean;
}

export const ChangePasswordModal = ({
  enabled,
}: ChangePasswordModalProps) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);

    if (!open) {
      resetForm();
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Current password, new password, and confirmation are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation must match.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const response = await fetch("/api/profile/password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword,
      }),
    });

    setIsSubmitting(false);

    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(result.error ?? "Unable to update your password.");
      return;
    }

    toast.success("Password updated.");
    handleOpenChange(false);
  };

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-4 text-muted-foreground" />
          Password
        </CardTitle>
        <CardDescription>
          {enabled
            ? "Update the password tied to your email sign-in."
            : "Password changes are only available for email accounts."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {enabled ? (
          <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
            <AlertDialogTrigger asChild>
              <Button>Change password</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Change password</AlertDialogTitle>
                <AlertDialogDescription>
                  Enter your current password, then choose a new one.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <form className="space-y-4" onSubmit={handleSubmit}>
                {error ? (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label htmlFor="currentPassword" className="text-sm font-medium">
                    Current password
                  </label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    autoComplete="current-password"
                    placeholder="Enter your current password"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="newPassword" className="text-sm font-medium">
                      New password
                    </label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium">
                      Confirm new password
                    </label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      autoComplete="new-password"
                      placeholder="Repeat the new password"
                    />
                  </div>
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Updating password..." : "Update password"}
                  </Button>
                </AlertDialogFooter>
              </form>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <div className="rounded-xl border border-border/70 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            This account uses GitHub sign-in, so there is no local password to change.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
