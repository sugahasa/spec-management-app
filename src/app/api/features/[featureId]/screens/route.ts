import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ featureId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { featureId } = await params;
  const { screenId } = await req.json();
  const link = await prisma.featureScreen.create({
    data: { featureId, screenId },
    include: { screen: true },
  });
  return NextResponse.json(link, { status: 201 });
}

export async function DELETE(req: Request, { params }: Params) {
  const { featureId } = await params;
  const { screenId } = await req.json();
  await prisma.featureScreen.delete({
    where: { featureId_screenId: { featureId, screenId } },
  });
  return NextResponse.json({ ok: true });
}
