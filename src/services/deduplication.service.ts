import { prisma } from "@/lib/prisma";
import { hammingDistance } from "./media-download.service";

const SIMILARITY_THRESHOLD = 5; // Hamming distance <= 5 = likely duplicate (out of 64 bits)

export async function findDuplicates(boardId: string) {
  // Get all creatives for this board that have media with perceptual hashes
  const layers = await prisma.inspirationLayer.findMany({
    where: { boardId },
    select: { id: true },
  });
  const layerIds = layers.map((l) => l.id);

  const brands = await prisma.inspirationBrand.findMany({
    where: { layerId: { in: layerIds } },
    select: { id: true },
  });
  const brandIds = brands.map((b) => b.id);

  const creatives = await prisma.adCreative.findMany({
    where: { brandId: { in: brandIds } },
    include: {
      mediaAssets: {
        where: { perceptualHash: { not: null } },
        select: { perceptualHash: true, mimeType: true },
      },
      brand: { select: { name: true } },
    },
  });

  // Build pairs of similar creatives
  const pairs: {
    idA: string;
    idB: string;
    similarity: number;
  }[] = [];

  for (let i = 0; i < creatives.length; i++) {
    for (let j = i + 1; j < creatives.length; j++) {
      const a = creatives[i];
      const b = creatives[j];

      // Compare image hashes
      for (const assetA of a.mediaAssets) {
        for (const assetB of b.mediaAssets) {
          if (
            assetA.perceptualHash &&
            assetB.perceptualHash &&
            assetA.mimeType.startsWith("image/") &&
            assetB.mimeType.startsWith("image/")
          ) {
            const dist = hammingDistance(
              assetA.perceptualHash,
              assetB.perceptualHash
            );
            if (dist <= SIMILARITY_THRESHOLD) {
              // Convert hamming distance to similarity score (0-1)
              const similarity = 1 - dist / 64;
              pairs.push({ idA: a.id, idB: b.id, similarity });
            }
          }
        }
      }
    }
  }

  if (pairs.length === 0) return [];

  // Group into clusters using union-find
  const parent = new Map<string, string>();
  function find(x: string): string {
    if (!parent.has(x)) parent.set(x, x);
    if (parent.get(x) !== x) parent.set(x, find(parent.get(x)!));
    return parent.get(x)!;
  }
  function union(a: string, b: string) {
    parent.set(find(a), find(b));
  }

  for (const pair of pairs) {
    union(pair.idA, pair.idB);
  }

  // Build groups
  const groups = new Map<string, Set<string>>();
  for (const pair of pairs) {
    const root = find(pair.idA);
    if (!groups.has(root)) groups.set(root, new Set());
    groups.get(root)!.add(pair.idA);
    groups.get(root)!.add(pair.idB);
  }

  // Create DuplicateGroup records
  const created = [];
  for (const [, memberIds] of groups) {
    const memberArray = Array.from(memberIds);
    const group = await prisma.duplicateGroup.create({
      data: {
        boardId,
        name: `Duplicate group (${memberArray.length} creatives)`,
        members: {
          create: memberArray.map((id, idx) => {
            // Find best similarity for this creative
            const bestSim = pairs
              .filter((p) => p.idA === id || p.idB === id)
              .reduce((max, p) => Math.max(max, p.similarity), 0);
            return {
              creativeId: id,
              similarityScore: bestSim,
              isPrimary: idx === 0,
            };
          }),
        },
      },
      include: { members: { include: { creative: true } } },
    });
    created.push(group);
  }

  return created;
}

export async function getDuplicateGroups(boardId: string) {
  return prisma.duplicateGroup.findMany({
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
}

export async function updateDuplicateGroup(
  groupId: string,
  status: "CONFIRMED" | "DISMISSED"
) {
  return prisma.duplicateGroup.update({
    where: { id: groupId },
    data: { status },
  });
}
