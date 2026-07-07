"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, Mail, User } from "lucide-react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

import {
  AuthFormDivider,
  AuthFormError,
  AuthGitHubButton,
  AuthInputField,
} from "@/components/auth/auth-form-fields";
import { Button } from "@/components/ui/button";

const MIN_PASSWORD_LENGTH = 8;

export const RegisterForm = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleGithubSignIn = async () => {
    setIsSubmitting(true);
    setError("");
    await signIn("github", { callbackUrl: "/dashboard" });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      setError("Name, email, password, and confirmation are required.");
      return;
    }

    if (!trimmedEmail.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: trimmedName,
        email: trimmedEmail,
        password,
        confirmPassword,
      }),
    });

    const result = (await response.json()) as { error?: string };

    setIsSubmitting(false);

    if (!response.ok) {
      const message = result.error ?? "Unable to register user.";
      setError(message);

      if (response.status === 429) {
        toast.error(message);
      }

      return;
    }

    setError("");
    router.push(
      `/sign-in?registered=1&email=${encodeURIComponent(trimmedEmail)}`,
    );
  };

  return (
    <>
      <AuthFormError message={error} />

      <AuthGitHubButton onClick={handleGithubSignIn} disabled={isSubmitting} />

      <AuthFormDivider />

      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthInputField
          id="name"
          label="Name"
          type="text"
          value={name}
          onChange={setName}
          autoComplete="name"
          placeholder="Your name"
          icon={User}
        />

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

        <AuthInputField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          icon={LockKeyhole}
        />

        <AuthInputField
          id="confirmPassword"
          label="Confirm password"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          placeholder="Re-enter your password"
          icon={ArrowRight}
        />

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-foreground hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
};
