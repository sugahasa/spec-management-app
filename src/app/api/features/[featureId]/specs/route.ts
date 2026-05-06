import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ featureId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { featureId } = await params;
  const { title, given, when, then, priority, status } = await req.json();
  const last = await prisma.specification.findFirst({
    where: { featureId },
    orderBy: { order: "desc" },
  });
  const spec = await prisma.specification.create({
    data: {
      featureId,
      title,
      given: given ?? "",
      when: when ?? "",
      then: then ?? "",
      priority: priority ?? "MEDIUM",
      status: status ?? "DRAFT",
      order: (last?.order ?? 0) + 1,
    },
    include: {},
  });
  return NextResponse.json(spec, { status: 201 });
}
