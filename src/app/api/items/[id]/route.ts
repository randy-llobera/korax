import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getItemDrawerDetail } from "@/lib/db/items";

interface ItemRouteContext {
  params: Promise<{
    id: string;
  }>;
}

export const GET = async (_request: Request, context: ItemRouteContext) => {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "You must be signed in to view items." },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  const item = await getItemDrawerDetail(id, session.user.id);

  if (!item) {
    return NextResponse.json({ error: "Item not found." }, { status: 404 });
  }

  return NextResponse.json({ item });
};
