import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DuplicatesDashboard } from "@/components/inspiration/duplicates-dashboard";

export default async function DuplicatesPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { clientId } = await params;

  const brand = await prisma.brand.findUnique({
    where: { id: clientId },
    include: {
      inspirationBoard: { select: { id: true } },
    },
  });

  if (!brand) redirect("/clients");

  const boardId = brand.inspirationBoard?.id;

  let groups: {
    id: string;
    name: string | null;
    status: string;
    members: {
      id: string;
      similarityScore: number;
      isPrimary: boolean;
      creative: {
        id: string;
        headline: string | null;
        screenshotUrl: string | null;
        thumbnailUrl: string | null;
        format: string | null;
        brandName: string;
      };
    }[];
  }[] = [];

  if (boardId) {
    const raw = await prisma.duplicateGroup.findMany({
      where: { boardId },
      include: {
        members: {
          include: {
            creative: {
              select: {
                id: true,
                headline: true,
                screenshotUrl: true,
                thumbnailUrl: true,
                format: true,
                brand: { select: { name: true } },
              },
            },
          },
          orderBy: { isPrimary: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    groups = raw.map((g) => ({
      id: g.id,
      name: g.name,
      status: g.status,
      members: g.members.map((m) => ({
        id: m.id,
        similarityScore: m.similarityScore,
        isPrimary: m.isPrimary,
        creative: {
          id: m.creative.id,
          headline: m.creative.headline,
          screenshotUrl: m.creative.screenshotUrl,
          thumbnailUrl: m.creative.thumbnailUrl,
          format: m.creative.format,
          brandName: m.creative.brand.name,
        },
      })),
    }));
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Duplicate Detection</h1>
        <p className="text-muted-foreground">
          Find and group duplicate or near-duplicate ad creatives
        </p>
      </div>

      <DuplicatesDashboard boardId={boardId ?? ""} groups={groups} />
    </div>
  );
}
