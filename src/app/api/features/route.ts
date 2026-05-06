import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAndSave } from "@/lib/markdown";

export async function GET() {
  const features = await prisma.feature.findMany({
    include: {
      specs: { orderBy: { order: "asc" } },
      screens: { include: { screen: true } },
    },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(features);
}

export async function POST(req: Request) {
  const { name, description } = await req.json();
  const last = await prisma.feature.findFirst({ orderBy: { order: "desc" } });
  const feature = await prisma.feature.create({
    data: { name, description: description ?? "", order: (last?.order ?? 0) + 1 },
    include: { specs: true, screens: { include: { screen: true } } },
  });
  await generateAndSave();
  return NextResponse.json(feature, { status: 201 });
}
