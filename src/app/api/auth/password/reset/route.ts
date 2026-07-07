import { NextResponse } from "next/server";

import { resetPasswordWithToken } from "@/lib/auth/token-flows";
import {
  checkAuthRateLimit,
  createRateLimitErrorResponse,
  createRateLimitUnavailableResponse,
  isRateLimitUnavailable,
} from "@/lib/rate-limit";

interface ResetPasswordRequestBody {
  confirmPassword?: string;
  password?: string;
  token?: string;
}

const BAD_REQUEST_STATUS = 400;
const MIN_PASSWORD_LENGTH = 8;

export const POST = async (request: Request) => {
  let body: ResetPasswordRequestBody;

  try {
    body = (await request.json()) as ResetPasswordRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: BAD_REQUEST_STATUS },
    );
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const confirmPassword =
    typeof body.confirmPassword === "string" ? body.confirmPassword : "";

  if (!token || !password || !confirmPassword) {
    return NextResponse.json(
      { error: "Token, password, and confirmPassword are required." },
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
    type: "passwordReset",
  });

  if (!rateLimitResult.success) {
    if (isRateLimitUnavailable(rateLimitResult)) {
      return createRateLimitUnavailableResponse();
    }

    return createRateLimitErrorResponse(rateLimitResult);
  }

  const result = await resetPasswordWithToken({ password, token });

  if (result.status === "invalid") {
    return NextResponse.json(
      { error: "That reset link is invalid or has expired." },
      { status: BAD_REQUEST_STATUS },
    );
  }

  return NextResponse.json({ success: true, email: result.email });
};
