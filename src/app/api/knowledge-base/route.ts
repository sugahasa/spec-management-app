import { NextResponse } from "next/server";
import { generateMarkdown } from "@/lib/markdown";

export async function GET() {
  const md = await generateMarkdown();
  return new NextResponse(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="knowledge-base.md"',
    },
  });
}
