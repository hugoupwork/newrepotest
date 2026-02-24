import { z } from "zod";

// ──────────────────────────────────────────────
// Zod Schemas
// ──────────────────────────────────────────────

export const performanceInputSchema = z.object({
  spend: z.number().optional(),
  impressions: z.number().int().optional(),
  clicks: z.number().int().optional(),
  conversions: z.number().int().optional(),
  roas: z.number().optional(),
  revenue: z.number().optional(),
  ctr: z.number().optional(),
  cpc: z.number().optional(),
  cpm: z.number().optional(),
  conversionRate: z.number().optional(),
  performanceTier: z
    .enum(["WINNER", "STRONG", "AVERAGE", "WEAK", "NON_SPENDER", "UNKNOWN"])
    .optional(),
  dateRangeStart: z.string().optional(),
  dateRangeEnd: z.string().optional(),
});

export const atomFilterSchema = z.object({
  category: z.string().optional(),
  minConfidence: z.number().min(0).max(1).optional(),
  performanceTier: z.string().optional(),
  search: z.string().optional(),
});

export type PerformanceInput = z.infer<typeof performanceInputSchema>;
export type AtomFilter = z.infer<typeof atomFilterSchema>;

// ──────────────────────────────────────────────
// TypeScript Interfaces
// ──────────────────────────────────────────────

export interface AtomExtractionResult {
  atoms: {
    category: string;
    name: string;
    description: string;
    confidence: number;
    timestampStart?: number;
    timestampEnd?: number;
    boundingBox?: { x: number; y: number; w: number; h: number };
    attributes: Record<string, unknown>;
  }[];
  overallAssessment?: string;
}

export interface CorrelationInsightReport {
  winningPatterns: {
    pattern: string;
    strength: number;
    examples: string[];
  }[];
  losingPatterns: {
    pattern: string;
    strength: number;
    examples: string[];
  }[];
  recommendations: string[];
  summary: string;
}

export interface PerformanceSummary {
  totalCreatives: number;
  byTier: Record<string, number>;
  avgRoas: number | null;
  totalSpend: number | null;
  topAtoms: { name: string; category: string; winRate: number }[];
}

export interface SimilarityPair {
  creativeIdA: string;
  creativeIdB: string;
  similarityScore: number;
  reasoning?: string;
}
