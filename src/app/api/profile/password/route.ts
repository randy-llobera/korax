import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getPasswordResetIdentifier } from "@/lib/auth/token-identifiers";
import { prisma } from "@/lib/prisma";

interface ChangePasswordRequestBody {
  confirmPassword?: string;
  currentPassword?: string;
  newPassword?: string;
}

const BAD_REQUEST_STATUS = 400;
const MIN_PASSWORD_LENGTH = 8;

export const POST = async (request: Request) => {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json(
      { error: "You must be signed in to change your password." },
      { status: 401 },
    );
  }

  let body: ChangePasswordRequestBody;

  try {
    body = (await request.json()) as ChangePasswordRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: BAD_REQUEST_STATUS },
    );
  }

  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
  const confirmPassword =
    typeof body.confirmPassword === "string" ? body.confirmPassword : "";

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json(
      { error: "Current password, new password, and confirmation are required." },
      { status: BAD_REQUEST_STATUS },
    );
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: BAD_REQUEST_STATUS },
    );
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { error: "New password and confirmation must match." },
      { status: BAD_REQUEST_STATUS },
    );
  }

  if (currentPassword === newPassword) {
    return NextResponse.json(
      { error: "Choose a different password from your current one." },
      { status: BAD_REQUEST_STATUS },
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      password: true,
    },
  });

  if (!user?.password) {
    return NextResponse.json(
      { error: "Password changes are only available for email accounts." },
      { status: BAD_REQUEST_STATUS },
    );
  }

  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isCurrentPasswordValid) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: BAD_REQUEST_STATUS },
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: {
      id: session.user.id,
    },
    data: {
      password: hashedPassword,
    },
  });

  await prisma.verificationToken.deleteMany({
    where: {
      identifier: getPasswordResetIdentifier(session.user.email),
    },
  });

  return NextResponse.json({ success: true });
};
