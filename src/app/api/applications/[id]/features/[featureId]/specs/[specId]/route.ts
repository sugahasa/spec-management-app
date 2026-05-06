import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string; featureId: string; specId: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { specId } = await params;
  const { title, description, acceptanceCriteria, priority, status } = await req.json();
  const spec = await prisma.specification.update({
    where: { id: specId },
    data: {
      title,
      description: description ?? "",
      acceptanceCriteria: acceptanceCriteria ?? "",
      priority,
      status,
    },
  });
  return NextResponse.json(spec);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { specId } = await params;
  await prisma.specification.delete({ where: { id: specId } });
  return NextResponse.json({ ok: true });
}
