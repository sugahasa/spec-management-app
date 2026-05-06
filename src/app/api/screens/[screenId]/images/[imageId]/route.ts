import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAndSave } from "@/lib/markdown";

type Params = { params: Promise<{ screenId: string; imageId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const { imageId } = await params;
  await prisma.screenImage.delete({ where: { id: imageId } });
  await generateAndSave();
  return NextResponse.json({ ok: true });
}
