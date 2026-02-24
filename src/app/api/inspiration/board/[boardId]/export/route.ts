import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createGoogleDoc, shareWithUser } from "@/lib/google";
import { LAYER_CONFIGS } from "@/config/inspiration-layers";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { boardId } = await params;

  const board = await prisma.inspirationBoard.findUnique({
    where: { id: boardId },
    include: {
      brand: { include: { client: true } },
      layers: {
        include: {
          brands: { include: { adCreatives: true } },
          trends: true,
        },
        orderBy: { type: "asc" },
      },
    },
  });

  if (!board) return NextResponse.json({ error: "Board not found" }, { status: 404 });

  // Build document content
  const lines: string[] = [];
  lines.push(`Ad Inspiration Report — ${board.brand.name}`);
  lines.push("");
  lines.push(`Generated: ${new Date().toLocaleDateString()}`);
  lines.push("═".repeat(60));
  lines.push("");

  for (const layer of board.layers) {
    const config = LAYER_CONFIGS.find((c) => c.type === layer.type);
    lines.push(`Layer ${config?.number ?? "?"}: ${config?.title ?? layer.type}`);
    lines.push("-".repeat(40));

    if (layer.description) {
      lines.push(`Description: ${layer.description}`);
    }

    if (layer.brands.length > 0) {
      lines.push("");
      lines.push(`Brands (${layer.brands.length}):`);
      for (const brand of layer.brands) {
        lines.push(`  • ${brand.name}${brand.website ? ` — ${brand.website}` : ""}`);
        lines.push(`    Revenue: ${brand.revenueCategory ?? "Unknown"} | Creatives: ${brand.adCreatives.length}`);

        if (brand.adCreatives.length > 0) {
          lines.push(`    Top Creatives:`);
          for (const creative of brand.adCreatives.slice(0, 5)) {
            lines.push(`      - ${creative.headline ?? "No headline"}`);
            if (creative.primaryText) {
              lines.push(`        Copy: ${creative.primaryText.slice(0, 150)}...`);
            }
            if (creative.hookType) lines.push(`        Hook: ${creative.hookType}`);
            if (creative.aiScore) lines.push(`        AI Score: ${creative.aiScore.toFixed(2)}`);
          }
        }
      }
    }

    if (layer.trends.length > 0) {
      lines.push("");
      lines.push(`Trends (${layer.trends.length}):`);
      for (const trend of layer.trends) {
        lines.push(`  • ${trend.title} (Relevance: ${trend.relevanceScore?.toFixed(2) ?? "N/A"})`);
        if (trend.description) lines.push(`    ${trend.description.slice(0, 200)}`);
        if (trend.aiAdaptation) lines.push(`    Adaptation: ${trend.aiAdaptation.slice(0, 200)}`);
      }
    }

    lines.push("");
    lines.push("");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const content = lines.join("\n");

  try {
    // TODO: Use content to populate the Google Doc body
    const doc = await createGoogleDoc(
      `Ad Inspiration — ${board.brand.name}`
    );

    // Share with client if they have an email
    if (board.brand.client.email) {
      await shareWithUser(doc.docId, board.brand.client.email);
    }

    // Save document reference
    await prisma.generatedDocument.create({
      data: {
        brandId: board.brand.id,
        type: "MASTER_DOCUMENT",
        title: `Ad Inspiration — ${board.brand.name}`,
        googleDocId: doc.docId,
        googleDriveUrl: doc.url,
        status: "COMPLETED",
      },
    });

    return NextResponse.json({ docId: doc.docId, url: doc.url });
  } catch {
    return NextResponse.json(
      { error: "Failed to create Google Doc. Check API credentials." },
      { status: 500 }
    );
  }
}
