import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAndSave } from "@/lib/markdown";

type Params = { params: Promise<{ featureId: string; specId: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { specId } = await params;
  const { title, given, when, then, priority, status } = await req.json();
  const spec = await prisma.specification.update({
    where: { id: specId },
    data: { title, given: given ?? "", when: when ?? "", then: then ?? "", priority, status },
  });
  await generateAndSave();
  return NextResponse.json(spec);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { specId } = await params;
  await prisma.specification.delete({ where: { id: specId } });
  await generateAndSave();
  return NextResponse.json({ ok: true });
}
