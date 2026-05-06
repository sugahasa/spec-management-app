import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAndSave } from "@/lib/markdown";

type Params = { params: Promise<{ screenId: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { screenId } = await params;
  const { name, description, path } = await req.json();
  const screen = await prisma.screen.update({
    where: { id: screenId },
    data: { name, description: description ?? "", path: path ?? "" },
    include: {
      images: { orderBy: { order: "asc" } },
      features: { include: { feature: true } },
    },
  });
  await generateAndSave();
  return NextResponse.json(screen);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { screenId } = await params;
  await prisma.screen.delete({ where: { id: screenId } });
  await generateAndSave();
  return NextResponse.json({ ok: true });
}
