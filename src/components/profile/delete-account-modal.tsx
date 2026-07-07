"use client";

import { FormEvent, useState } from "react";
import { signOut as clientSignOut } from "next-auth/react";
import { AlertTriangle, Trash2 } from "lucide-react";

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

export const DeleteAccountModal = () => {
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setConfirmation("");
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

    setIsSubmitting(true);
    setError("");

    const response = await fetch("/api/profile/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ confirmation }),
    });

    setIsSubmitting(false);

    const result = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(result.error ?? "Unable to delete your account.");
      return;
    }

    await clientSignOut({
      redirectTo: "/sign-in?deleted=1",
    });
  };

  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Trash2 className="size-4" />
          Delete account
        </CardTitle>
        <CardDescription>
          Permanently remove your account, collections, items, and auth access.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-destructive/20 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
          This action cannot be undone.
        </div>

        <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="size-4" />
              Delete account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                Type DELETE to confirm. This permanently removes your profile,
                collections, items, and saved account data.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {error ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <AlertTriangle className="size-4 text-destructive" />
                  Permanent deletion
                </div>
                <p className="mt-1">
                  Your account and related content will be deleted immediately.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="deleteConfirmation" className="text-sm font-medium">
                  Type DELETE
                </label>
                <Input
                  id="deleteConfirmation"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  autoComplete="off"
                  placeholder="DELETE"
                />
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                <Button type="submit" variant="destructive" disabled={isSubmitting}>
                  {isSubmitting ? "Deleting account..." : "Delete account"}
                </Button>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
