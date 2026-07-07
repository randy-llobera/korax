import { createHash, randomBytes } from "node:crypto";

import { Resend } from "resend";

export {
  getAuthTokenIdentifiersForEmail,
  getPasswordResetEmail,
  getPasswordResetIdentifier,
  isEmailVerificationIdentifier,
} from "@/lib/auth/token-identifiers";
import { getPasswordResetIdentifier } from "@/lib/auth/token-identifiers";
import { isEmailVerificationEnabled } from "@/lib/auth/email-verification-settings";
import { prisma } from "@/lib/prisma";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const AUTH_APP_URL_ENV_KEYS = ["AUTH_URL", "NEXTAUTH_URL"] as const;

const getEmailVerificationSubject = () => "Verify your Korax email";
const getPasswordResetSubject = () => "Reset your Korax password";
const EMAIL_IDEMPOTENCY_KEY_PREFIX = "verify-email";
const PASSWORD_RESET_IDEMPOTENCY_KEY_PREFIX = "password-reset";

export const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const buildAuthEmailHtml = ({
  actionText,
  bodyText,
  ignoreText,
  name,
  url,
}: {
  actionText: string;
  bodyText: string;
  ignoreText: string;
  name: string | null;
  url: string;
}) => {
  const greeting = name ? `Hi ${escapeHtml(name)},` : "Hi,";
  const safeUrl = escapeHtml(url);

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;">
      <p>${greeting}</p>
      <p>${bodyText}</p>
      <p><a href="${safeUrl}">${actionText}</a></p>
      <p>${ignoreText}</p>
    </div>
  `;
};

const getEmailVerificationHtml = ({
  name,
  verificationUrl,
}: {
  name: string | null;
  verificationUrl: string;
}) =>
  buildAuthEmailHtml({
    actionText: "Verify your email",
    bodyText: "Click the link below to verify your email address for Korax.",
    ignoreText: "If you did not create this account, you can ignore this message.",
    name,
    url: verificationUrl,
  });

const getPasswordResetHtml = ({
  name,
  resetUrl,
}: {
  name: string | null;
  resetUrl: string;
}) =>
  buildAuthEmailHtml({
    actionText: "Reset your password",
    bodyText: "Click the link below to reset your Korax password.",
    ignoreText: "If you did not request this, you can ignore this message.",
    name,
    url: resetUrl,
  });

export const hashVerificationToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const getAuthEmailBaseUrl = () => {
  const configuredBaseUrl = AUTH_APP_URL_ENV_KEYS
    .map((key) => process.env[key])
    .find((value) => typeof value === "string" && value.trim().length > 0);

  if (!configuredBaseUrl) {
    throw new Error("AUTH_URL or NEXTAUTH_URL is required to send auth emails.");
  }

  return new URL(configuredBaseUrl).origin;
};

const createAuthUrl = ({
  baseUrl,
  pathname,
  token,
}: {
  baseUrl: string;
  pathname: string;
  token: string;
}) => {
  const url = new URL(pathname, baseUrl);
  url.searchParams.set("token", token);
  return url.toString();
};

const createVerificationUrl = (options: { baseUrl: string; token: string }) =>
  createAuthUrl({ ...options, pathname: "/verify-email" });

const createPasswordResetUrl = (options: { baseUrl: string; token: string }) =>
  createAuthUrl({ ...options, pathname: "/reset-password" });

const sendAuthEmail = async ({
  email,
  hashedToken,
  html,
  idempotencyKeyPrefix,
  subject,
}: {
  email: string;
  hashedToken: string;
  html: string;
  idempotencyKeyPrefix: string;
  subject: string;
}) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is required to send auth emails.");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send(
    {
      from: "onboarding@resend.dev",
      to: [email],
      subject,
      html,
    },
    {
      idempotencyKey: `${idempotencyKeyPrefix}/${hashedToken}`,
    },
  );

  if (error) {
    throw new Error(error.message);
  }
};

export const issueEmailVerification = async ({
  email,
  name,
}: {
  email: string;
  name: string | null;
}) => {
  if (!isEmailVerificationEnabled()) {
    return;
  }

  const rawToken = randomBytes(32).toString("hex");
  const hashedToken = hashVerificationToken(rawToken);
  const expires = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: hashedToken,
      expires,
    },
  });

  const verificationUrl = createVerificationUrl({
    baseUrl: getAuthEmailBaseUrl(),
    token: rawToken,
  });

  await sendAuthEmail({
    email,
    hashedToken,
    html: getEmailVerificationHtml({ name, verificationUrl }),
    idempotencyKeyPrefix: EMAIL_IDEMPOTENCY_KEY_PREFIX,
    subject: getEmailVerificationSubject(),
  });
};

export const issuePasswordReset = async ({
  email,
  name,
}: {
  email: string;
  name: string | null;
}) => {
  const rawToken = randomBytes(32).toString("hex");
  const hashedToken = hashVerificationToken(rawToken);
  const expires = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);
  const identifier = getPasswordResetIdentifier(email);

  await prisma.verificationToken.deleteMany({
    where: { identifier },
  });

  await prisma.verificationToken.create({
    data: {
      identifier,
      token: hashedToken,
      expires,
    },
  });

  const resetUrl = createPasswordResetUrl({
    baseUrl: getAuthEmailBaseUrl(),
    token: rawToken,
  });

  await sendAuthEmail({
    email,
    hashedToken,
    html: getPasswordResetHtml({ name, resetUrl }),
    idempotencyKeyPrefix: PASSWORD_RESET_IDEMPOTENCY_KEY_PREFIX,
    subject: getPasswordResetSubject(),
  });
};
