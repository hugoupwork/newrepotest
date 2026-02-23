import { analyzeWithClaude } from "@/lib/claude";
import { SYSTEM_PROMPT } from "@/config/prompts";
import {
  BRAND_DISCOVERY_PROMPT,
  LAYER_SPECIFIC_CONTEXT,
  AD_CREATIVE_ANALYSIS_PROMPT,
  AD_PATTERN_ANALYSIS_PROMPT,
  TREND_RELEVANCE_PROMPT,
  TREND_ADAPTATION_PROMPT,
  TREND_DISCOVERY_PROMPT,
  LAYER_SUMMARY_PROMPT,
} from "@/config/inspiration-prompts";
import type {
  BrandDiscoveryResponse,
  AdCreativeAnalysis,
  AdPatternAnalysis,
  TrendRelevanceAssessment,
  TrendAdaptationBrief,
} from "@/types/inspiration";

interface BrandContext {
  companyName: string;
  industry: string;
  productLine: string;
  demographics?: string;
  psychographics?: string;
  painPoints?: string;
  existingCompetitors?: string;
  monthlyAdSpend?: string;
  marketPositioning?: string;
}

function buildBrandContextString(ctx: BrandContext): string {
  return [
    `Company: ${ctx.companyName}`,
    `Industry: ${ctx.industry}`,
    `Products: ${ctx.productLine}`,
    ctx.demographics ? `Demographics: ${ctx.demographics}` : null,
    ctx.psychographics ? `Psychographics: ${ctx.psychographics}` : null,
    ctx.painPoints ? `Customer Pain Points: ${ctx.painPoints}` : null,
    ctx.monthlyAdSpend ? `Monthly Ad Spend: ${ctx.monthlyAdSpend}` : null,
    ctx.marketPositioning ? `Market Positioning: ${ctx.marketPositioning}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

async function callClaude(prompt: string): Promise<string> {
  const result = await analyzeWithClaude({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: prompt,
  });
  return result.text;
}

/**
 * Extract brand context from onboarding data.
 */
export function extractBrandContext(onboarding: {
  brandInfo: unknown;
  targetAudience: unknown;
  competitors: unknown;
  currentState: unknown;
}): BrandContext {
  const brandInfo = (onboarding.brandInfo ?? {}) as Record<string, string>;
  const audience = (onboarding.targetAudience ?? {}) as Record<string, string>;
  const competitors = (onboarding.competitors ?? {}) as Record<string, string>;
  const currentState = (onboarding.currentState ?? {}) as Record<string, string>;

  return {
    companyName: brandInfo.companyName ?? "Unknown",
    industry: brandInfo.industry ?? "Unknown",
    productLine: brandInfo.productLine ?? "Unknown",
    demographics: audience.demographics,
    psychographics: audience.psychographics,
    painPoints: audience.painPoints,
    existingCompetitors: competitors.keyCompetitors,
    monthlyAdSpend: currentState.monthlyAdSpend,
    marketPositioning: competitors.marketPositioning,
  };
}

/**
 * Suggest brands for a given layer using AI.
 */
export async function suggestBrandsForLayer(
  brandContext: BrandContext,
  layerType: string,
  existingBrands: string[],
  layerConfig?: { desireKeyword?: string; demographic?: string }
): Promise<BrandDiscoveryResponse> {
  const contextString = buildBrandContextString(brandContext);

  let layerSpecificContext =
    LAYER_SPECIFIC_CONTEXT[layerType] ?? "";

  layerSpecificContext = layerSpecificContext
    .replace("{productLine}", brandContext.productLine)
    .replace("{industry}", brandContext.industry)
    .replace("{existingCompetitors}", brandContext.existingCompetitors ?? "None listed")
    .replace("{desireKeyword}", layerConfig?.desireKeyword ?? "not specified")
    .replace("{psychographics}", brandContext.psychographics ?? "not specified")
    .replace("{painPoints}", brandContext.painPoints ?? "not specified")
    .replace("{demographic}", layerConfig?.demographic ?? brandContext.demographics ?? "not specified")
    .replace("{demographics}", brandContext.demographics ?? "not specified");

  const layerDescriptions: Record<string, string> = {
    DIRECT_COMPETITORS: "Direct competitors selling the exact same product",
    SAME_NICHE: "Brands in the same broader niche",
    SAME_DESIRE_OUTCOME: "Brands serving the same customer desire/outcome",
    SAME_DEMOGRAPHIC: "Brands targeting the same demographic",
  };

  const prompt = BRAND_DISCOVERY_PROMPT
    .replace("{brandContext}", contextString)
    .replace("{layerType}", layerType)
    .replace("{layerDescription}", layerDescriptions[layerType] ?? layerType)
    .replace("{layerSpecificContext}", layerSpecificContext)
    .replace("{existingBrands}", existingBrands.length > 0 ? existingBrands.join(", ") : "None yet");

  const text = await callClaude(prompt);

  try {
    return JSON.parse(text) as BrandDiscoveryResponse;
  } catch {
    return { suggestions: [], layerInsight: text };
  }
}

/**
 * Analyze a single ad creative using AI.
 */
export async function analyzeAdCreative(
  creative: {
    primaryText?: string | null;
    headline?: string | null;
    ctaType?: string | null;
    format?: string | null;
    landingPageUrl?: string | null;
    adStartDate?: Date | null;
  },
  adBrandName: string,
  brandContext: BrandContext
): Promise<AdCreativeAnalysis> {
  const contextString = buildBrandContextString(brandContext);

  const prompt = AD_CREATIVE_ANALYSIS_PROMPT
    .replace("{brandContext}", contextString)
    .replace("{adBrandName}", adBrandName)
    .replace("{primaryText}", creative.primaryText ?? "N/A")
    .replace("{headline}", creative.headline ?? "N/A")
    .replace("{ctaType}", creative.ctaType ?? "N/A")
    .replace("{format}", creative.format ?? "Unknown")
    .replace("{landingPageUrl}", creative.landingPageUrl ?? "N/A")
    .replace("{adStartDate}", creative.adStartDate?.toISOString() ?? "Unknown");

  const text = await callClaude(prompt);

  try {
    return JSON.parse(text) as AdCreativeAnalysis;
  } catch {
    return {
      hookAnalysis: { hookType: "other", hookEffectiveness: 0, hookExplanation: text },
      copyAnalysis: {
        readabilityLevel: "unknown",
        emotionalAppeal: "other",
        persuasionTechniques: [],
        copyStrengths: [],
        copyWeaknesses: [],
      },
      ctaAnalysis: { ctaStyle: "other", ctaEffectiveness: 0, ctaSuggestions: [] },
      formatInsights: "",
      overallScore: 0,
      keyTakeaways: [text],
      adaptationIdeas: [],
      tags: [],
    };
  }
}

/**
 * Analyze patterns across multiple ad creatives in a layer.
 */
export async function analyzeAdPatterns(
  creatives: {
    primaryText?: string | null;
    headline?: string | null;
    ctaType?: string | null;
    format?: string | null;
    hookType?: string | null;
    brand: { name: string };
  }[],
  layerType: string,
  brandContext: BrandContext
): Promise<AdPatternAnalysis> {
  const contextString = buildBrandContextString(brandContext);

  const summaries = creatives
    .map(
      (c, i) =>
        `[${i + 1}] Brand: ${c.brand.name} | Format: ${c.format ?? "?"} | Hook: ${c.hookType ?? "?"} | CTA: ${c.ctaType ?? "?"} | Headline: ${c.headline ?? "N/A"} | Copy: ${(c.primaryText ?? "").slice(0, 200)}`
    )
    .join("\n");

  const prompt = AD_PATTERN_ANALYSIS_PROMPT
    .replace("{layerType}", layerType)
    .replace("{brandContext}", contextString)
    .replace("{count}", String(creatives.length))
    .replace("{creativeSummaries}", summaries);

  const text = await callClaude(prompt);

  try {
    return JSON.parse(text) as AdPatternAnalysis;
  } catch {
    return {
      dominantFormats: [],
      commonHookTypes: [],
      ctaPatterns: [],
      emotionalAppealDistribution: [],
      copyLengthTrends: text,
      winningFormulas: [],
      gapOpportunities: [],
      topInsights: [text],
      creativeDirections: [],
    };
  }
}

/**
 * Assess trend relevance to a brand.
 */
export async function assessTrendRelevance(
  trends: { title: string; description?: string | null; category?: string | null }[],
  brandContext: BrandContext,
  demographic: string
): Promise<{ assessments: TrendRelevanceAssessment[]; overallTrendInsight: string }> {
  const contextString = buildBrandContextString(brandContext);

  const trendList = trends
    .map(
      (t) =>
        `- ${t.title}: ${t.description ?? "No description"} (Category: ${t.category ?? "unknown"})`
    )
    .join("\n");

  const prompt = TREND_RELEVANCE_PROMPT
    .replace("{brandContext}", contextString)
    .replace("{demographic}", demographic)
    .replace("{productCategory}", brandContext.productLine)
    .replace("{trends}", trendList);

  const text = await callClaude(prompt);

  try {
    return JSON.parse(text);
  } catch {
    return { assessments: [], overallTrendInsight: text };
  }
}

/**
 * Generate a detailed adaptation brief for a trend.
 */
export async function suggestTrendAdaptation(
  trend: { title: string; description?: string | null; sourceName?: string | null; category?: string | null },
  brandContext: BrandContext
): Promise<TrendAdaptationBrief> {
  const contextString = buildBrandContextString(brandContext);

  const prompt = TREND_ADAPTATION_PROMPT
    .replace("{brandContext}", contextString)
    .replace("{trendTitle}", trend.title)
    .replace("{trendDescription}", trend.description ?? "No description")
    .replace("{trendSource}", trend.sourceName ?? "Unknown")
    .replace("{trendCategory}", trend.category ?? "Unknown");

  const text = await callClaude(prompt);

  try {
    return JSON.parse(text) as TrendAdaptationBrief;
  } catch {
    return {
      briefTitle: trend.title,
      concept: text,
      format: "OTHER",
      hookIdeas: [],
      copyDraft: "",
      headlineDraft: "",
      ctaSuggestion: "",
      visualDirection: "",
      toneNotes: "",
      doNot: [],
      timeline: "Unknown",
    };
  }
}

/**
 * Discover trends using AI for a brand's demographic.
 */
export async function discoverTrends(
  brandContext: BrandContext
): Promise<{
  trends: {
    title: string;
    description: string;
    category: string;
    sourceName: string;
    relevanceScore: number;
    relevanceExplanation: string;
    adaptationIdeas: string[];
    urgency: string;
    url?: string;
  }[];
}> {
  const contextString = buildBrandContextString(brandContext);

  const prompt = TREND_DISCOVERY_PROMPT
    .replace("{demographics}", brandContext.demographics ?? "Not specified")
    .replace("{psychographics}", brandContext.psychographics ?? "Not specified")
    .replace("{brandContext}", contextString);

  const text = await callClaude(prompt);

  try {
    return JSON.parse(text);
  } catch {
    return { trends: [] };
  }
}

/**
 * Generate a summary of insights for a layer.
 */
export async function generateLayerSummary(
  layerName: string,
  brandName: string,
  adsSummary: string
) {
  const prompt = LAYER_SUMMARY_PROMPT
    .replace("{layerName}", layerName)
    .replace("{brandName}", brandName)
    .replace("{adsSummary}", adsSummary);

  const text = await callClaude(prompt);

  try {
    return JSON.parse(text);
  } catch {
    return { rawInsight: text };
  }
}
