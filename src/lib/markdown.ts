import { writeFile } from "fs/promises";
import path from "path";
import { prisma } from "./prisma";
import { PRIORITY_LABEL, STATUS_LABEL } from "./types";

export async function generateMarkdown(): Promise<string> {
  const [features, screens] = await Promise.all([
    prisma.feature.findMany({
      include: {
        specs: { orderBy: { order: "asc" } },
        screens: { include: { screen: true } },
      },
      orderBy: { order: "asc" },
    }),
    prisma.screen.findMany({
      include: {
        images: { orderBy: { order: "asc" } },
        features: { include: { feature: true } },
      },
      orderBy: { order: "asc" },
    }),
  ]);

  const now = new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
  const lines: string[] = [];

  lines.push("# 仕様ナレッジベース");
  lines.push("");
  lines.push(`> 最終更新: ${now}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Screens
  lines.push("## 画面一覧");
  lines.push("");
  if (screens.length === 0) {
    lines.push("_画面が登録されていません_");
    lines.push("");
  } else {
    for (const screen of screens) {
      lines.push(`### ${screen.name}`);
      lines.push("");
      if (screen.path) lines.push(`- **パス**: \`${screen.path}\``);
      if (screen.description) lines.push(`- **説明**: ${screen.description}`);
      if (screen.features.length > 0) {
        lines.push(`- **紐づき機能**: ${screen.features.map((f) => f.feature.name).join(", ")}`);
      }
      if (screen.images.length > 0) {
        lines.push(`- **キャプチャ画像** (${screen.images.length}枚):`);
        for (const img of screen.images) {
          lines.push(`  - ![${screen.name}](${img.path})`);
        }
      }
      lines.push("");
    }
  }

  lines.push("---");
  lines.push("");

  // Features / Scenarios
  lines.push("## 機能・シナリオ");
  lines.push("");
  if (features.length === 0) {
    lines.push("_機能が登録されていません_");
    lines.push("");
  } else {
    for (const feature of features) {
      lines.push(`### Feature: ${feature.name}`);
      lines.push("");
      if (feature.description) {
        lines.push(feature.description);
        lines.push("");
      }
      if (feature.screens.length > 0) {
        lines.push(`**紐づき画面**: ${feature.screens.map((l) => l.screen.name).join(", ")}`);
        lines.push("");
      }

      if (feature.specs.length === 0) {
        lines.push("_シナリオがありません_");
        lines.push("");
      } else {
        for (const spec of feature.specs) {
          lines.push(`#### Scenario: ${spec.title}`);
          lines.push("");
          lines.push(`- **優先度**: ${PRIORITY_LABEL[spec.priority as keyof typeof PRIORITY_LABEL]}`);
          lines.push(`- **ステータス**: ${STATUS_LABEL[spec.status as keyof typeof STATUS_LABEL]}`);
          lines.push("");
          if (spec.given || spec.when || spec.then) {
            lines.push("| ステップ | 内容 |");
            lines.push("|:--------|:-----|");
            if (spec.given) lines.push(`| **Given** | ${spec.given.replace(/\n/g, "<br>")} |`);
            if (spec.when) lines.push(`| **When** | ${spec.when.replace(/\n/g, "<br>")} |`);
            if (spec.then) lines.push(`| **Then** | ${spec.then.replace(/\n/g, "<br>")} |`);
            lines.push("");
          }
        }
      }
    }
  }

  return lines.join("\n");
}

export async function generateAndSave(): Promise<void> {
  try {
    const md = await generateMarkdown();
    const filePath = path.join(process.cwd(), "public", "knowledge-base.md");
    await writeFile(filePath, md, "utf-8");
  } catch (e) {
    console.error("[markdown] Failed to save knowledge-base.md:", e);
  }
}
