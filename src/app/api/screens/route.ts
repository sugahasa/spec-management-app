import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const screens = await prisma.screen.findMany({
    include: {
      features: { include: { feature: true } },
    },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(screens);
}

export async function POST(req: Request) {
  const { name, description, path, imagePath } = await req.json();
  const last = await prisma.screen.findFirst({ orderBy: { order: "desc" } });
  const screen = await prisma.screen.create({
    data: {
      name,
      description: description ?? "",
      path: path ?? "",
      imagePath: imagePath ?? "",
      order: (last?.order ?? 0) + 1,
    },
    include: { features: { include: { feature: true } } },
  });
  return NextResponse.json(screen, { status: 201 });
}
