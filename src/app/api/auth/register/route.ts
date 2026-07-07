import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { issueEmailVerification } from "@/lib/auth/email-verification";
import { isEmailVerificationEnabled } from "@/lib/auth/email-verification-settings";
import { prisma } from "@/lib/prisma";
import {
  checkAuthRateLimit,
  createRateLimitErrorResponse,
  createRateLimitUnavailableResponse,
  isRateLimitUnavailable,
} from "@/lib/rate-limit";

interface RegisterRequestBody {
  confirmPassword?: string;
  email?: string;
  name?: string;
  password?: string;
}

const BAD_REQUEST_STATUS = 400;
const CONFLICT_STATUS = 409;
const SERVER_ERROR_STATUS = 500;
const MIN_PASSWORD_LENGTH = 8;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const POST = async (request: Request) => {
  let body: RegisterRequestBody;

  try {
    body = (await request.json()) as RegisterRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: BAD_REQUEST_STATUS },
    );
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const confirmPassword =
    typeof body.confirmPassword === "string" ? body.confirmPassword : "";

  if (!isNonEmptyString(name) || !isNonEmptyString(email) || !password || !confirmPassword) {
    return NextResponse.json(
      { error: "Name, email, password, and confirmPassword are required." },
      { status: BAD_REQUEST_STATUS },
    );
  }

  if (!email.includes("@")) {
    return NextResponse.json(
      { error: "A valid email address is required." },
      { status: BAD_REQUEST_STATUS },
    );
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: BAD_REQUEST_STATUS },
    );
  }

  if (password !== confirmPassword) {
    return NextResponse.json(
      { error: "Passwords do not match." },
      { status: BAD_REQUEST_STATUS },
    );
  }

  const rateLimitResult = await checkAuthRateLimit({
    keyBy: "ip",
    request,
    type: "register",
  });

  if (!rateLimitResult.success) {
    if (isRateLimitUnavailable(rateLimitResult)) {
      return createRateLimitUnavailableResponse();
    }

    return createRateLimitErrorResponse(rateLimitResult);
  }

  try {
    const emailVerificationEnabled = isEmailVerificationEnabled();

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with that email already exists." },
        { status: CONFLICT_STATUS },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await prisma.user.create({
      data: {
        email,
        emailVerified: emailVerificationEnabled ? undefined : new Date(),
        name,
        password: hashedPassword,
      },
      select: {
        email: true,
        name: true,
      },
    });

    await issueEmailVerification({
      email: createdUser.email,
      name: createdUser.name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Registration failed", error);

    return NextResponse.json(
      { error: "Unable to register user." },
      { status: SERVER_ERROR_STATUS },
    );
  }
};
