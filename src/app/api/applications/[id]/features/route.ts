import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id: applicationId } = await params;
  const { name, description } = await req.json();
  const last = await prisma.feature.findFirst({
    where: { applicationId },
    orderBy: { order: "desc" },
  });
  const feature = await prisma.feature.create({
    data: {
      applicationId,
      name,
      description: description ?? "",
      order: (last?.order ?? 0) + 1,
    },
    include: { specs: true },
  });
  return NextResponse.json(feature, { status: 201 });
}
