import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAndSave } from "@/lib/markdown";

type Params = { params: Promise<{ screenId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { screenId } = await params;
  const { path } = await req.json();
  const last = await prisma.screenImage.findFirst({
    where: { screenId },
    orderBy: { order: "desc" },
  });
  const image = await prisma.screenImage.create({
    data: { screenId, path, order: (last?.order ?? 0) + 1 },
  });
  await generateAndSave();
  return NextResponse.json(image, { status: 201 });
}
