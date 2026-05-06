import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const app = await prisma.application.findUnique({
    where: { id },
    include: {
      features: {
        orderBy: { order: "asc" },
        include: { specs: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(app);
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const { name, description } = await req.json();
  const app = await prisma.application.update({
    where: { id },
    data: { name, description: description ?? "" },
    include: {
      features: {
        orderBy: { order: "asc" },
        include: { specs: { orderBy: { order: "asc" } } },
      },
    },
  });
  return NextResponse.json(app);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  await prisma.application.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
