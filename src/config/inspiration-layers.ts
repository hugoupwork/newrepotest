export const LAYER_CONFIGS = [
  {
    type: "DIRECT_COMPETITORS" as const,
    number: 1,
    title: "Direct Competitors",
    slug: "direct-competitors",
    description:
      "Brands selling the exact same or very similar products. Include both the richest/largest competitors and brands at a similar revenue level.",
    icon: "Swords",
    placeholder: "e.g., Nike, Adidas, New Balance",
    guidance:
      "Focus on brands your customers are actively comparing you against. Find both the industry leaders and brands at your revenue level.",
  },
  {
    type: "SAME_NICHE" as const,
    number: 2,
    title: "Same Niche",
    slug: "same-niche",
    description:
      "Broader niche brands — not direct competitors, but operating in the same space. Think adjacent categories.",
    icon: "Layers",
    placeholder: "e.g., For a dupe perfume brand: all perfume brands",
    guidance:
      "Think about brands in your broader niche. Even if they don't sell the exact same product, their ad strategies can reveal patterns that work in your space.",
  },
  {
    type: "SAME_DESIRE_OUTCOME" as const,
    number: 3,
    title: "Same Desire / Outcome",
    slug: "same-desire",
    description:
      "Any brand in ANY category that serves the same underlying customer desire or outcome.",
    icon: "Heart",
    placeholder: 'e.g., If desire is "attractiveness": makeup, fashion, skincare, fitness brands',
    guidance:
      "Identify the core desire your product fulfills, then find brands across all categories that serve that same desire. This is where breakthrough creative ideas come from.",
  },
  {
    type: "SAME_DEMOGRAPHIC" as const,
    number: 4,
    title: "Same Demographic",
    slug: "same-demographic",
    description:
      "Any brand targeting the same age/gender/demographic, regardless of product category.",
    icon: "Users",
    placeholder: "e.g., For men 18-30: gaming, fitness, grooming, tech brands",
    guidance:
      "Find brands that speak to your exact demographic. Study their tone, creative formats, and hooks — this shows you what resonates with your audience regardless of product.",
  },
  {
    type: "TREND_SPOTTER" as const,
    number: 5,
    title: "Trend Spotter",
    slug: "trend-spotter",
    description:
      "Cultural trends, memes, viral moments, and jokes relevant to your demographic. Stay ahead of the curve.",
    icon: "TrendingUp",
    placeholder: "e.g., Trending TikTok sounds, viral memes, cultural moments",
    guidance:
      "Track what your demographic is talking about, laughing at, and sharing. The best ads ride cultural waves — be early, not late.",
  },
] as const;

export const AD_FORMAT_OPTIONS = [
  { value: "UGC", label: "UGC" },
  { value: "STUDIO", label: "Studio" },
  { value: "MEME", label: "Meme" },
  { value: "CAROUSEL", label: "Carousel" },
  { value: "STATIC_IMAGE", label: "Static Image" },
  { value: "VIDEO", label: "Video" },
  { value: "SLIDESHOW", label: "Slideshow" },
  { value: "COLLECTION", label: "Collection" },
  { value: "STORIES", label: "Stories" },
  { value: "REELS", label: "Reels" },
  { value: "OTHER", label: "Other" },
] as const;

export const HOOK_TYPE_OPTIONS = [
  { value: "question", label: "Question" },
  { value: "statistic", label: "Statistic" },
  { value: "testimonial", label: "Testimonial" },
  { value: "controversy", label: "Controversy" },
  { value: "pain_point", label: "Pain Point" },
  { value: "curiosity", label: "Curiosity" },
  { value: "bold_claim", label: "Bold Claim" },
  { value: "story", label: "Story" },
  { value: "social_proof", label: "Social Proof" },
  { value: "before_after", label: "Before/After" },
  { value: "other", label: "Other" },
] as const;

export const CTA_STYLE_OPTIONS = [
  { value: "urgency", label: "Urgency" },
  { value: "social_proof", label: "Social Proof" },
  { value: "benefit_driven", label: "Benefit Driven" },
  { value: "scarcity", label: "Scarcity" },
  { value: "direct", label: "Direct" },
  { value: "curiosity", label: "Curiosity" },
  { value: "free_trial", label: "Free Trial" },
  { value: "limited_time", label: "Limited Time" },
  { value: "other", label: "Other" },
] as const;

export const EMOTIONAL_APPEAL_OPTIONS = [
  { value: "fear", label: "Fear" },
  { value: "aspiration", label: "Aspiration" },
  { value: "humor", label: "Humor" },
  { value: "trust", label: "Trust" },
  { value: "exclusivity", label: "Exclusivity" },
  { value: "belonging", label: "Belonging" },
  { value: "anger", label: "Anger" },
  { value: "nostalgia", label: "Nostalgia" },
  { value: "curiosity", label: "Curiosity" },
  { value: "other", label: "Other" },
] as const;

export const TREND_CATEGORY_OPTIONS = [
  { value: "meme", label: "Meme" },
  { value: "cultural_moment", label: "Cultural Moment" },
  { value: "viral_audio", label: "Viral Audio" },
  { value: "hashtag", label: "Hashtag" },
  { value: "news", label: "News" },
  { value: "format", label: "Content Format" },
  { value: "slang", label: "Slang" },
  { value: "challenge", label: "Challenge" },
] as const;
