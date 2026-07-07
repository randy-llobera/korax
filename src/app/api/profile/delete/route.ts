import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getPasswordResetIdentifier } from "@/lib/auth/token-identifiers";
import { prisma } from "@/lib/prisma";

interface DeleteAccountRequestBody {
  confirmation?: string;
}

const BAD_REQUEST_STATUS = 400;

export const POST = async (request: Request) => {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json(
      { error: "You must be signed in to delete your account." },
      { status: 401 },
    );
  }

  let body: DeleteAccountRequestBody;

  try {
    body = (await request.json()) as DeleteAccountRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body." },
      { status: BAD_REQUEST_STATUS },
    );
  }

  const confirmation = typeof body.confirmation === "string" ? body.confirmation.trim() : "";

  if (confirmation !== "DELETE") {
    return NextResponse.json(
      { error: 'Type "DELETE" to confirm account deletion.' },
      { status: BAD_REQUEST_STATUS },
    );
  }

  await prisma.verificationToken.deleteMany({
    where: {
      OR: [
        {
          identifier: session.user.email,
        },
        {
          identifier: getPasswordResetIdentifier(session.user.email),
        },
      ],
    },
  });

  await prisma.user.delete({
    where: {
      id: session.user.id,
    },
  });

  return NextResponse.json({ success: true });
};
