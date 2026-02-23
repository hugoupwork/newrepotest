export interface AstroturfingSignal {
  id: string;
  name: string;
  weight: number;
  description: string;
}

export const ASTROTURFING_SIGNALS: AstroturfingSignal[] = [
  {
    id: "author_profile",
    name: "Author Profile Analysis",
    weight: 0.15,
    description:
      "Flags accounts with no history, generic/auto-generated usernames, or new accounts posting reviews.",
  },
  {
    id: "linguistic_similarity",
    name: "Linguistic Similarity",
    weight: 0.25,
    description:
      "Compares review texts pairwise. Flags clusters with >0.7 similarity score (copy-paste or template-based).",
  },
  {
    id: "temporal_burst",
    name: "Temporal Burst Detection",
    weight: 0.2,
    description:
      "Flags statistical outliers where reviews-per-day exceeds 3x the rolling average.",
  },
  {
    id: "sentiment_outlier",
    name: "Sentiment Outlier Detection",
    weight: 0.15,
    description:
      "Flags reviews that are extreme positive outliers (score >0.95) with no specific product details.",
  },
  {
    id: "content_quality",
    name: "Content Quality Analysis",
    weight: 0.25,
    description:
      "Flags reviews lacking specifics, using excessive superlatives without substance, or very short positive reviews.",
  },
];

export const SUSPICION_THRESHOLDS = {
  LOW: 0.3,
  MEDIUM: 0.5,
  HIGH: 0.7,
} as const;

export const GENERIC_USERNAME_PATTERNS = [
  /^user\d+$/i,
  /^[a-z]+\d{4,}$/i,
  /^customer\d*/i,
  /^buyer\d*/i,
  /^reviewer\d*/i,
  /^amazon[_-]?customer/i,
];

export const SUPERLATIVE_KEYWORDS = [
  "best ever",
  "amazing",
  "life-changing",
  "incredible",
  "perfect",
  "absolutely love",
  "must buy",
  "must have",
  "game changer",
  "game-changer",
  "changed my life",
  "cannot recommend enough",
  "buy this now",
  "5 stars",
  "five stars",
  "exceeded expectations",
];
