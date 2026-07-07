"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole, Mail } from "lucide-react";
import { toast } from "sonner";

import { AuthFormError, AuthInputField } from "@/components/auth/auth-form-fields";
import { Button } from "@/components/ui/button";

export const ResetPasswordForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasToken = useMemo(() => token.length > 0, [token]);

  const handleForgotPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError("Email is required.");
      return;
    }

    if (!trimmedEmail.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const response = await fetch("/api/auth/password/forgot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: trimmedEmail }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      const message = result.error ?? "Unable to send a reset email.";
      setError(message);

      if (response.status === 429) {
        toast.error(message);
      }

      return;
    }

    toast.success("If that account exists, we sent a password reset link.");
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!password || !confirmPassword) {
      setError("Password and confirm password are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const response = await fetch("/api/auth/password/reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        password,
        confirmPassword,
      }),
    });

    setIsSubmitting(false);

    const result = (await response.json()) as { email?: string; error?: string };

    if (!response.ok) {
      const message = result.error ?? "Unable to reset your password.";
      setError(message);

      if (response.status === 429) {
        toast.error(message);
      }

      return;
    }

    router.push(
      `/sign-in?reset=1&email=${encodeURIComponent(result.email ?? "")}`,
    );
    router.refresh();
  };

  return (
    <>
      <AuthFormError message={error} />

      <form className="space-y-4" onSubmit={hasToken ? handleResetPassword : handleForgotPassword}>
        {!hasToken ? (
          <AuthInputField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            placeholder="you@example.com"
            icon={Mail}
          />
        ) : null}

        {hasToken ? (
          <>
            <AuthInputField
              id="password"
              label="New password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              placeholder="Enter a new password"
              icon={LockKeyhole}
            />

            <AuthInputField
              id="confirmPassword"
              label="Confirm new password"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
              placeholder="Confirm your new password"
              icon={LockKeyhole}
            />
          </>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting
            ? hasToken
              ? "Resetting password..."
              : "Sending reset link..."
            : hasToken
              ? "Reset password"
              : "Send reset link"}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        Remembered your password?{" "}
        <Link href="/sign-in" className="font-medium text-foreground hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
};
