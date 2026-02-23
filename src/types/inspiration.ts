import { z } from "zod";

// ──────────────────────────────────────────────
// Zod Schemas
// ──────────────────────────────────────────────

export const inspirationBrandSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
  metaPageId: z.string().optional(),
  metaPageUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  website: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  estimatedRevenue: z.string().optional(),
  revenueCategory: z.enum(["top_performer", "similar_level"]).optional(),
  socialFollowing: z.number().int().optional(),
  adSpendEstimate: z.string().optional(),
  notes: z.string().optional(),
});

export const adCreativeSchema = z.object({
  metaAdId: z.string().optional(),
  adLibraryUrl: z.string().optional(),
  screenshotUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  primaryText: z.string().optional(),
  headline: z.string().optional(),
  linkDescription: z.string().optional(),
  ctaType: z.string().optional(),
  landingPageUrl: z.string().optional(),
  format: z
    .enum([
      "UGC",
      "STUDIO",
      "MEME",
      "CAROUSEL",
      "STATIC_IMAGE",
      "VIDEO",
      "SLIDESHOW",
      "COLLECTION",
      "STORIES",
      "REELS",
      "OTHER",
    ])
    .optional(),
  hookType: z.string().optional(),
  ctaStyle: z.string().optional(),
  emotionalAppeal: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  adStartDate: z.string().optional(),
  adEndDate: z.string().optional(),
});

export const trendItemSchema = z.object({
  title: z.string().min(1, "Trend title is required"),
  description: z.string().optional(),
  sourceUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  sourceName: z.string().optional(),
  imageUrl: z.string().optional(),
  category: z.string().optional(),
  trendDate: z.string().optional(),
});

export const layerConfigSchema = z.object({
  label: z.string().optional(),
  description: z.string().optional(),
  desireKeyword: z.string().optional(),
  demographic: z.string().optional(),
});

// ──────────────────────────────────────────────
// TypeScript Interfaces
// ──────────────────────────────────────────────

export type InspirationBrandInput = z.infer<typeof inspirationBrandSchema>;
export type AdCreativeInput = z.infer<typeof adCreativeSchema>;
export type TrendItemInput = z.infer<typeof trendItemSchema>;
export type LayerConfigInput = z.infer<typeof layerConfigSchema>;

export interface BrandSuggestion {
  name: string;
  rationale: string;
  metaPageUrl?: string;
  website?: string;
  estimatedRevenue: string;
  revenueCategory: "top_performer" | "similar_level";
  socialFollowing?: string;
  relevanceScore: number;
}

export interface BrandDiscoveryResponse {
  suggestions: BrandSuggestion[];
  layerInsight: string;
}

export interface AdCreativeAnalysis {
  hookAnalysis: {
    hookType: string;
    hookEffectiveness: number;
    hookExplanation: string;
  };
  copyAnalysis: {
    readabilityLevel: string;
    emotionalAppeal: string;
    persuasionTechniques: string[];
    copyStrengths: string[];
    copyWeaknesses: string[];
  };
  ctaAnalysis: {
    ctaStyle: string;
    ctaEffectiveness: number;
    ctaSuggestions: string[];
  };
  formatInsights: string;
  overallScore: number;
  keyTakeaways: string[];
  adaptationIdeas: string[];
  tags: string[];
}

export interface AdPatternAnalysis {
  dominantFormats: { format: string; percentage: number; examples: string[] }[];
  commonHookTypes: { type: string; frequency: string; bestExample: string }[];
  ctaPatterns: { pattern: string; frequency: string }[];
  emotionalAppealDistribution: { appeal: string; percentage: number }[];
  copyLengthTrends: string;
  winningFormulas: string[];
  gapOpportunities: string[];
  topInsights: string[];
  creativeDirections: {
    direction: string;
    inspiredBy: string;
    rationale: string;
  }[];
}

export interface TrendRelevanceAssessment {
  trendTitle: string;
  relevanceScore: number;
  relevanceReason: string;
  adAdaptation: string;
  format: string;
  urgency: "high" | "medium" | "low";
  risk: "low" | "medium" | "high";
}

export interface TrendAdaptationBrief {
  briefTitle: string;
  concept: string;
  format: string;
  hookIdeas: string[];
  copyDraft: string;
  headlineDraft: string;
  ctaSuggestion: string;
  visualDirection: string;
  toneNotes: string;
  doNot: string[];
  timeline: string;
}

export type InspirationLayerSlug =
  | "direct-competitors"
  | "same-niche"
  | "same-desire"
  | "same-demographic"
  | "trend-spotter";

export const LAYER_SLUG_TO_TYPE: Record<InspirationLayerSlug, string> = {
  "direct-competitors": "DIRECT_COMPETITORS",
  "same-niche": "SAME_NICHE",
  "same-desire": "SAME_DESIRE_OUTCOME",
  "same-demographic": "SAME_DEMOGRAPHIC",
  "trend-spotter": "TREND_SPOTTER",
};

export const LAYER_TYPE_TO_SLUG: Record<string, InspirationLayerSlug> = {
  DIRECT_COMPETITORS: "direct-competitors",
  SAME_NICHE: "same-niche",
  SAME_DESIRE_OUTCOME: "same-desire",
  SAME_DEMOGRAPHIC: "same-demographic",
  TREND_SPOTTER: "trend-spotter",
};
