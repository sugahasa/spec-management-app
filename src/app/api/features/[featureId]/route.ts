import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAndSave } from "@/lib/markdown";

type Params = { params: Promise<{ featureId: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { featureId } = await params;
  const { name, description } = await req.json();
  const feature = await prisma.feature.update({
    where: { id: featureId },
    data: { name, description: description ?? "" },
    include: {
      specs: { orderBy: { order: "asc" } },
      screens: { include: { screen: true } },
    },
  });
  await generateAndSave();
  return NextResponse.json(feature);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { featureId } = await params;
  await prisma.feature.delete({ where: { id: featureId } });
  await generateAndSave();
  return NextResponse.json({ ok: true });
}
