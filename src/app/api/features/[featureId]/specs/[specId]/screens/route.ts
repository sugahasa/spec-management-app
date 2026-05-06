import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ featureId: string; specId: string }> };

// Link a screen to a spec
export async function POST(req: Request, { params }: Params) {
  const { specId } = await params;
  const { screenId } = await req.json();
  const link = await prisma.specificationScreen.create({
    data: { specificationId: specId, screenId },
    include: { screen: true },
  });
  return NextResponse.json(link, { status: 201 });
}

// Unlink a screen from a spec
export async function DELETE(req: Request, { params }: Params) {
  const { specId } = await params;
  const { screenId } = await req.json();
  await prisma.specificationScreen.delete({
    where: { specificationId_screenId: { specificationId: specId, screenId } },
  });
  return NextResponse.json({ ok: true });
}
