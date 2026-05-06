import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const apps = await prisma.application.findMany({
    include: {
      features: {
        orderBy: { order: "asc" },
        include: { specs: { orderBy: { order: "asc" } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(apps);
}

export async function POST(req: Request) {
  const { name, description } = await req.json();
  const app = await prisma.application.create({
    data: { name, description: description ?? "" },
    include: { features: true },
  });
  return NextResponse.json(app, { status: 201 });
}
