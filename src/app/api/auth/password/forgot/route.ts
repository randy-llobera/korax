import { NextResponse } from "next/server";

import { issuePasswordReset } from "@/lib/auth/email-verification";
import { prisma } from "@/lib/prisma";
import {
  checkAuthRateLimit,
  createRateLimitErrorResponse,
  createRateLimitUnavailableResponse,
  isRateLimitUnavailable,
} from "@/lib/rate-limit";

interface ForgotPasswordRequestBody {
  email?: string;
}

const BAD_REQUEST_STATUS = 400;

const isValidEmail = (email: string) => email.includes("@");

export const POST = async (request: Request) => {
  let body: ForgotPasswordRequestBody;

  try {
    body = (await request.json()) as ForgotPasswordRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: BAD_REQUEST_STATUS },
    );
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "A valid email address is required." },
      { status: BAD_REQUEST_STATUS },
    );
  }

  const rateLimitResult = await checkAuthRateLimit({
    keyBy: "ip",
    request,
    type: "passwordForgot",
  });

  if (!rateLimitResult.success) {
    if (isRateLimitUnavailable(rateLimitResult)) {
      return createRateLimitUnavailableResponse();
    }

    return createRateLimitErrorResponse(rateLimitResult);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      email: true,
      name: true,
      password: true,
    },
  });

  if (user?.password) {
    try {
      await issuePasswordReset({
        email: user.email,
        name: user.name,
      });
    } catch (error) {
      console.error("Password reset email failed", error);
    }
  }

  return NextResponse.json({ success: true });
};
