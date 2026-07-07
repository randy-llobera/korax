import NextAuth from "next-auth";

import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

export const proxy = auth((request) => {
  if (request.auth) {
    return;
  }

  const signInUrl = new URL("/sign-in", request.url);
  signInUrl.searchParams.set("callbackUrl", request.nextUrl.href);

  return Response.redirect(signInUrl);
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/items/:path*",
    "/upgrade/:path*",
  ],
};
