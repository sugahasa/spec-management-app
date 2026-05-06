import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ screenId: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { screenId } = await params;
  const { name, description, path, imagePath } = await req.json();
  const screen = await prisma.screen.update({
    where: { id: screenId },
    data: { name, description: description ?? "", path: path ?? "", imagePath: imagePath ?? "" },
    include: { features: { include: { feature: true } } },
  });
  return NextResponse.json(screen);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { screenId } = await params;
  await prisma.screen.delete({ where: { id: screenId } });
  return NextResponse.json({ ok: true });
}
