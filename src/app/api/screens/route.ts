import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAndSave } from "@/lib/markdown";

export async function GET() {
  const screens = await prisma.screen.findMany({
    include: {
      images: { orderBy: { order: "asc" } },
      features: { include: { feature: true } },
    },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(screens);
}

export async function POST(req: Request) {
  const { name, description, path } = await req.json();
  const last = await prisma.screen.findFirst({ orderBy: { order: "desc" } });
  const screen = await prisma.screen.create({
    data: {
      name,
      description: description ?? "",
      path: path ?? "",
      order: (last?.order ?? 0) + 1,
    },
    include: {
      images: { orderBy: { order: "asc" } },
      features: { include: { feature: true } },
    },
  });
  await generateAndSave();
  return NextResponse.json(screen, { status: 201 });
}
