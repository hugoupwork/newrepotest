import { apifyClient, APIFY_ACTORS } from "@/lib/apify";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { AdCreativeInput } from "@/types/inspiration";

interface ScrapeConfig {
  pageId?: string;
  searchTerm?: string;
  country?: string;
  adType?: "all" | "active";
  maxResults?: number;
}

/**
 * Launch an Apify Meta Ad Library scrape for a competitor brand.
 * Returns the Apify run ID for status polling.
 */
export async function scrapeAdLibrary(
  inspirationBrandId: string,
  config: ScrapeConfig
) {
  const run = await apifyClient
    .actor(APIFY_ACTORS.META_AD_LIBRARY)
    .call({
      searchTerm: config.searchTerm,
      pageId: config.pageId,
      country: config.country ?? "US",
      adType: config.adType ?? "active",
      maxResults: config.maxResults ?? 50,
    });

  // Create a research job record to track this scrape
  // First, find the inspiration brand to get the layer → board → brand chain
  const inspBrand = await prisma.inspirationBrand.findUnique({
    where: { id: inspirationBrandId },
    include: {
      layer: {
        include: {
          board: { select: { brandId: true } },
        },
      },
    },
  });

  if (!inspBrand) throw new Error("Inspiration brand not found");

  const job = await prisma.researchJob.create({
    data: {
      brandId: inspBrand.layer.board.brandId,
      source: "META_AD_LIBRARY",
      status: "RUNNING",
      apifyRunId: run.id,
      config: {
        inspirationBrandId,
        pageId: config.pageId,
        searchTerm: config.searchTerm,
        country: config.country ?? "US",
      },
    },
  });

  // Link the job to the inspiration brand
  await prisma.inspirationBrand.update({
    where: { id: inspirationBrandId },
    data: { adLibraryScrapeJobId: job.id },
  });

  return { runId: run.id, jobId: job.id };
}

/**
 * Check the status of an Apify scrape run.
 */
export async function checkScrapeStatus(jobId: string) {
  const job = await prisma.researchJob.findUnique({
    where: { id: jobId },
  });

  if (!job) throw new Error("Job not found");
  if (!job.apifyRunId) throw new Error("No Apify run ID");

  // If already completed or failed, return current status
  if (job.status === "COMPLETED" || job.status === "FAILED") {
    return { status: job.status, itemCount: job.itemCount };
  }

  // Poll Apify for status
  const run = await apifyClient.run(job.apifyRunId).get();

  if (!run) {
    await prisma.researchJob.update({
      where: { id: jobId },
      data: { status: "FAILED", errorMessage: "Apify run not found" },
    });
    return { status: "FAILED", itemCount: 0 };
  }

  if (run.status === "SUCCEEDED") {
    // Fetch results and process them
    const dataset = await apifyClient
      .dataset(run.defaultDatasetId)
      .listItems();

    const creatives = processAdLibraryResults(dataset.items);

    // Find which inspiration brand this job belongs to
    const inspBrand = await prisma.inspirationBrand.findFirst({
      where: { adLibraryScrapeJobId: jobId },
    });

    if (inspBrand) {
      // Save creatives
      for (const creative of creatives) {
        if (creative.metaAdId) {
          const existing = await prisma.adCreative.findUnique({
            where: { metaAdId: creative.metaAdId },
          });
          if (existing) continue;
        }

        await prisma.adCreative.create({
          data: {
            brandId: inspBrand.id,
            metaAdId: creative.metaAdId,
            adLibraryUrl: creative.adLibraryUrl,
            screenshotUrl: creative.screenshotUrl,
            primaryText: creative.primaryText,
            headline: creative.headline,
            linkDescription: creative.linkDescription,
            ctaType: creative.ctaType,
            landingPageUrl: creative.landingPageUrl,
            isActive: creative.isActive ?? true,
            adStartDate: creative.adStartDate
              ? new Date(creative.adStartDate)
              : undefined,
            rawData: creative as unknown as Prisma.InputJsonValue,
          },
        });
      }

      await prisma.inspirationBrand.update({
        where: { id: inspBrand.id },
        data: { lastScrapedAt: new Date() },
      });
    }

    await prisma.researchJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        itemCount: creatives.length,
      },
    });

    return { status: "COMPLETED", itemCount: creatives.length };
  }

  if (run.status === "FAILED" || run.status === "ABORTED" || run.status === "TIMED-OUT") {
    await prisma.researchJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorMessage: `Apify run ${run.status}`,
      },
    });
    return { status: "FAILED", itemCount: 0 };
  }

  // Still running
  return { status: "RUNNING", itemCount: 0 };
}

/**
 * Transform raw Apify Ad Library results into our AdCreative format.
 */
export function processAdLibraryResults(
  items: Record<string, unknown>[]
): AdCreativeInput[] {
  return items.map((item) => ({
    metaAdId: String(item.ad_archive_id ?? item.id ?? ""),
    adLibraryUrl: String(item.ad_library_url ?? item.url ?? ""),
    screenshotUrl: String(item.snapshot_url ?? item.image_url ?? ""),
    primaryText: String(item.ad_creative_body ?? item.body ?? ""),
    headline: String(item.ad_creative_link_title ?? item.title ?? ""),
    linkDescription: String(
      item.ad_creative_link_description ?? item.link_description ?? ""
    ),
    ctaType: String(item.ad_creative_link_caption ?? item.cta_type ?? ""),
    landingPageUrl: String(item.ad_creative_link_url ?? item.landing_page ?? ""),
    isActive: item.is_active !== false,
    adStartDate: item.start_date
      ? String(item.start_date)
      : undefined,
    adEndDate: item.end_date
      ? String(item.end_date)
      : undefined,
  }));
}
