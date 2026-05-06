import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string; featureId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { featureId } = await params;
  const { title, description, acceptanceCriteria, priority, status } = await req.json();
  const last = await prisma.specification.findFirst({
    where: { featureId },
    orderBy: { order: "desc" },
  });
  const spec = await prisma.specification.create({
    data: {
      featureId,
      title,
      description: description ?? "",
      acceptanceCriteria: acceptanceCriteria ?? "",
      priority: priority ?? "MEDIUM",
      status: status ?? "DRAFT",
      order: (last?.order ?? 0) + 1,
    },
  });
  return NextResponse.json(spec, { status: 201 });
}
