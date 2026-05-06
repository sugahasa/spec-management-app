import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const screens = await prisma.screen.findMany({
    include: {
      specs: {
        include: {
          specification: {
            include: { feature: true },
          },
        },
      },
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
    include: { specs: true },
  });
  return NextResponse.json(screen, { status: 201 });
}
