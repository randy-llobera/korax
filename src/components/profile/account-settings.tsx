"use client";

import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";

import { ChangePasswordModal } from "@/components/profile/change-password-modal";
import { DeleteAccountModal } from "@/components/profile/delete-account-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AccountSettingsProps {
  email: string;
  hasPassword: boolean;
}

export const AccountSettings = ({ email, hasPassword }: AccountSettingsProps) => {
  const resetHref = `/reset-password?email=${encodeURIComponent(email)}`;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,0.9fr)]">
      <div className="grid gap-6">
        {hasPassword ? (
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                Forgot password
              </CardTitle>
              <CardDescription>
                Send yourself a password reset link by email.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                Use this if you want to reset your password from an email link instead of
                changing it in place.
              </div>
              <Button asChild variant="outline">
                <Link href={resetHref}>
                  Request reset link
                  <ArrowUpRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <ChangePasswordModal enabled={hasPassword} />
      </div>

      <DeleteAccountModal />
    </div>
  );
};
