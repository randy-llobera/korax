import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getObjectKeyFromFileUrl, isSvgFileName } from "@/lib/files/upload";
import { getItemDrawerDetail } from "@/lib/db/items";
import { getR2Object } from "@/lib/files/r2";

interface ItemDownloadRouteContext {
  params: Promise<{
    id: string;
  }>;
}

export const runtime = "nodejs";

const buildContentDisposition = (fileName: string, disposition: "attachment" | "inline") =>
  `${disposition}; filename="${fileName.replace(/"/g, "")}"`;

export const GET = async (request: Request, context: ItemDownloadRouteContext) => {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "You must be signed in to download files." },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const item = await getItemDrawerDetail(id, session.user.id);

  if (!item?.fileUrl) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  const objectKey = getObjectKeyFromFileUrl(item.fileUrl);

  if (!objectKey) {
    return NextResponse.json({ error: "Invalid file URL." }, { status: 400 });
  }

  try {
    const object = await getR2Object(objectKey);
    const body = object.Body;

    if (!body) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    const inlineRequested = new URL(request.url).searchParams.get("inline") === "1";
    const inline = inlineRequested && !isSvgFileName(item.fileName);
    const bytes = Buffer.from(await body.transformToByteArray());
    const contentType =
      isSvgFileName(item.fileName) && inlineRequested
        ? "application/octet-stream"
        : (object.ContentType ?? "application/octet-stream");

    return new Response(bytes, {
      headers: {
        "Content-Disposition": buildContentDisposition(
          item.fileName ?? `${item.title}.bin`,
          inline ? "inline" : "attachment"
        ),
        "Content-Length": String(bytes.byteLength),
        "Content-Type": contentType,
      },
    });
  } catch (error) {
    console.error("Failed to proxy file from R2.", error);

    return NextResponse.json({ error: "Unable to download file." }, { status: 500 });
  }
};
