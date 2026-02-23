export const BRAND_DISCOVERY_PROMPT = `You are an expert media buyer and competitive intelligence analyst working within the Evolve Method framework.

BRAND CONTEXT:
{brandContext}

LAYER: {layerType}
LAYER DESCRIPTION: {layerDescription}
{layerSpecificContext}

EXISTING BRANDS IN THIS LAYER:
{existingBrands}

Suggest 8-12 brands for this layer. For each brand provide:
- name: Brand name
- rationale: Why this brand belongs in this layer (1-2 sentences)
- metaPageUrl: Their likely Facebook page URL (best guess)
- website: Their website URL
- estimatedRevenue: "high" | "medium" | "similar" relative to the client
- revenueCategory: "top_performer" | "similar_level"
- socialFollowing: Estimated Instagram/Facebook following as a string
- relevanceScore: 0.0-1.0 how relevant to this layer

Return JSON:
{
  "suggestions": [...],
  "layerInsight": "Brief insight about what to look for in this layer's ad creatives"
}`;

export const LAYER_SPECIFIC_CONTEXT: Record<string, string> = {
  DIRECT_COMPETITORS:
    "Focus on brands selling the exact same or very similar products. Include both the richest/largest competitors and brands at a similar revenue level to the client.\n\nProduct: {productLine}\nIndustry: {industry}\nKnown Competitors: {existingCompetitors}",
  SAME_NICHE:
    "Focus on brands in the same broader niche — adjacent categories, not direct competitors.\n\nClient Product: {productLine}\nIndustry: {industry}\nThink about what other products sit alongside this in the same store, same aisle, same shopping trip.",
  SAME_DESIRE_OUTCOME:
    "The underlying customer desire is: {desireKeyword}\n\nFind brands in ANY category that serve this same desire. This means going far beyond the product category — if the desire is 'attractiveness', think makeup, fashion, fitness, skincare, fragrances, etc.\n\nClient Product: {productLine}\nClient Audience Psychographics: {psychographics}\nClient Audience Pain Points: {painPoints}",
  SAME_DEMOGRAPHIC:
    "The core demographic is: {demographic}\n\nFind ANY brand targeting this demographic, regardless of product category. Think about what this demographic buys, follows, and engages with.\n\nClient Product: {productLine}\nDemographic Details: {demographics}",
};

export const AD_CREATIVE_ANALYSIS_PROMPT = `You are an expert performance marketing creative analyst. Analyze this ad creative and explain what makes it effective or ineffective.

BRAND CONTEXT (the brand we are finding inspiration for):
{brandContext}

AD CREATIVE:
Brand: {adBrandName}
Primary Text: {primaryText}
Headline: {headline}
CTA: {ctaType}
Format: {format}
Landing Page: {landingPageUrl}
Active since: {adStartDate}

Analyze and return JSON:
{
  "hookAnalysis": {
    "hookType": "question|statistic|testimonial|controversy|pain_point|curiosity|bold_claim|story|social_proof|before_after|other",
    "hookEffectiveness": 0.0,
    "hookExplanation": "What specifically about the hook works?"
  },
  "copyAnalysis": {
    "readabilityLevel": "simple|moderate|complex",
    "emotionalAppeal": "fear|aspiration|humor|trust|exclusivity|belonging|anger|nostalgia|curiosity|other",
    "persuasionTechniques": ["..."],
    "copyStrengths": ["..."],
    "copyWeaknesses": ["..."]
  },
  "ctaAnalysis": {
    "ctaStyle": "urgency|social_proof|benefit_driven|scarcity|direct|curiosity|free_trial|limited_time|other",
    "ctaEffectiveness": 0.0,
    "ctaSuggestions": ["..."]
  },
  "formatInsights": "Observations about the ad format choice",
  "overallScore": 0.0,
  "keyTakeaways": ["Top 3-5 actionable insights"],
  "adaptationIdeas": ["How the client brand could adapt this approach"],
  "tags": ["suggested_tag_1", "suggested_tag_2"]
}`;

export const AD_PATTERN_ANALYSIS_PROMPT = `You are analyzing patterns across ad creatives from Layer: {layerType}.

BRAND CONTEXT (the brand we are finding inspiration for):
{brandContext}

CREATIVES SUMMARY ({count} total):
{creativeSummaries}

Identify patterns and return JSON:
{
  "dominantFormats": [{"format": "...", "percentage": 0, "examples": ["..."]}],
  "commonHookTypes": [{"type": "...", "frequency": "...", "bestExample": "..."}],
  "ctaPatterns": [{"pattern": "...", "frequency": "..."}],
  "emotionalAppealDistribution": [{"appeal": "...", "percentage": 0}],
  "copyLengthTrends": "short|medium|long with context",
  "winningFormulas": ["Pattern descriptions that appear in top-performing ads"],
  "gapOpportunities": ["Approaches NOT being used that could differentiate"],
  "topInsights": ["The 3-5 most actionable insights for the client brand"],
  "creativeDirections": [
    {
      "direction": "Specific creative direction suggestion",
      "inspiredBy": "Which ads/brands inspired this",
      "rationale": "Why this would work for the client brand"
    }
  ]
}`;

export const TREND_RELEVANCE_PROMPT = `You are a cultural trend analyst specializing in digital marketing and social media trends. Assess the relevance of these cultural trends for ad creative inspiration.

BRAND CONTEXT:
{brandContext}

TARGET DEMOGRAPHIC: {demographic}
PRODUCT CATEGORY: {productCategory}

TRENDS:
{trends}

For each trend, assess relevance and return JSON:
{
  "assessments": [
    {
      "trendTitle": "...",
      "relevanceScore": 0.0,
      "relevanceReason": "Why this trend matters (or doesn't) for this brand",
      "adAdaptation": "Specific idea for incorporating into ad creative",
      "format": "Best format for this adaptation (UGC, meme, video, etc.)",
      "urgency": "high|medium|low",
      "risk": "low|medium|high"
    }
  ],
  "overallTrendInsight": "What the current cultural moment means for this brand's advertising"
}`;

export const TREND_ADAPTATION_PROMPT = `Create a detailed ad creative brief adapting this cultural trend for the brand.

BRAND CONTEXT:
{brandContext}

TREND:
Title: {trendTitle}
Description: {trendDescription}
Source: {trendSource}
Category: {trendCategory}

Generate a detailed creative brief in JSON:
{
  "briefTitle": "...",
  "concept": "1-2 sentence concept summary",
  "format": "Recommended ad format",
  "hookIdeas": ["3 hook variations"],
  "copyDraft": "Draft ad copy (primary text)",
  "headlineDraft": "Draft headline",
  "ctaSuggestion": "Recommended CTA",
  "visualDirection": "Description of visual approach",
  "toneNotes": "How to adapt the trend's tone to the brand voice",
  "doNot": ["Things to avoid when adapting this trend"],
  "timeline": "How long this trend will likely remain relevant"
}`;

export const TREND_DISCOVERY_PROMPT = `You are a cultural trend analyst specializing in digital marketing and social media trends. Given this brand's target demographic, identify current cultural trends, memes, and moments that could be leveraged in ad creative.

TARGET DEMOGRAPHIC:
{demographics}
{psychographics}

BRAND CONTEXT:
{brandContext}

Consider:
- Viral memes and formats
- Cultural moments and events
- Trending audio/sounds
- Popular content formats
- Relevant hashtag movements
- News/current events relevant to this demo
- Humor trends and jokes popular with this audience

Return structured JSON:
{
  "trends": [
    {
      "title": "...",
      "description": "...",
      "category": "meme|cultural_moment|viral_audio|hashtag|news|format|slang|challenge",
      "sourceName": "tiktok|twitter|reddit|instagram|general",
      "relevanceScore": 0.0,
      "relevanceExplanation": "...",
      "adaptationIdeas": ["How to use this in an ad"],
      "urgency": "high|medium|low",
      "url": "if known"
    }
  ]
}`;

export const LAYER_SUMMARY_PROMPT = `You have analyzed ads across the "{layerName}" layer for {brandName}. Here are all the categorized ads:

{adsSummary}

Identify patterns and provide actionable insights:

Return structured JSON:
{
  "dominantFormats": [{"format": "...", "percentage": 0, "insight": "..."}],
  "topHookTypes": [{"hookType": "...", "frequency": 0, "effectiveness": "..."}],
  "ctaPatterns": ["..."],
  "emotionalThemes": ["..."],
  "creativeTrends": ["..."],
  "gapsAndOpportunities": ["..."],
  "recommendedApproaches": [
    {
      "approach": "...",
      "rationale": "...",
      "inspiredBy": "Which competitor/ad inspired this recommendation"
    }
  ]
}`;
