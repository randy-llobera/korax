import bcrypt from "bcryptjs";

import {
  getPasswordResetEmail,
  hashVerificationToken,
  isEmailVerificationIdentifier,
} from "@/lib/auth/email-verification";
import { prisma } from "@/lib/prisma";

export type VerifyEmailTokenResult = "invalid" | "verified";
export type ResetPasswordWithTokenResult =
  | { status: "invalid" }
  | { email: string; status: "reset" };

const findValidVerificationToken = async (
  token: string,
  isValidIdentifier: (identifier: string) => boolean,
) => {
  if (!token) {
    return null;
  }

  const hashedToken = hashVerificationToken(token);
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token: hashedToken },
  });

  if (!verificationToken) {
    return null;
  }

  if (!isValidIdentifier(verificationToken.identifier)) {
    return null;
  }

  if (verificationToken.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { token: verificationToken.token },
    });

    return null;
  }

  return verificationToken;
};

export const verifyEmailToken = async (token: string): Promise<VerifyEmailTokenResult> => {
  const verificationToken = await findValidVerificationToken(
    token,
    isEmailVerificationIdentifier,
  );

  if (!verificationToken) {
    return "invalid";
  }

  const result = await prisma.user.updateMany({
    where: { email: verificationToken.identifier },
    data: {
      emailVerified: new Date(),
    },
  });

  if (result.count === 0) {
    await prisma.verificationToken.deleteMany({
      where: { identifier: verificationToken.identifier },
    });

    return "invalid";
  }

  await prisma.verificationToken.deleteMany({
    where: { identifier: verificationToken.identifier },
  });

  return "verified";
};

export const resetPasswordWithToken = async ({
  password,
  token,
}: {
  password: string;
  token: string;
}): Promise<ResetPasswordWithTokenResult> => {
  const resetToken = await findValidVerificationToken(
    token,
    (identifier) => getPasswordResetEmail(identifier) !== null,
  );

  if (!resetToken) {
    return { status: "invalid" };
  }

  const email = getPasswordResetEmail(resetToken.identifier);

  if (!email) {
    return { status: "invalid" };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      password: true,
    },
  });

  if (!user?.password) {
    await prisma.verificationToken.deleteMany({
      where: { identifier: resetToken.identifier },
    });

    return { status: "invalid" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  await prisma.verificationToken.deleteMany({
    where: { identifier: resetToken.identifier },
  });

  return { email, status: "reset" };
};
