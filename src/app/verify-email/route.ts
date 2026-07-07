import { NextResponse } from "next/server";

import { verifyEmailToken } from "@/lib/auth/token-flows";

const getRedirectUrl = (request: Request, search: string) => {
  const url = new URL("/sign-in", request.url);
  url.search = search;
  return url;
};

export const GET = async (request: Request) => {
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get("token") ?? "";

  const result = await verifyEmailToken(token);
  const search = result === "verified" ? "?verified=1" : "?verification=invalid";

  return NextResponse.redirect(getRedirectUrl(request, search));
};
