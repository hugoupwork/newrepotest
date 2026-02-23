import { ApifyClient } from "apify-client";

const globalForApify = globalThis as unknown as {
  apifyClient: ApifyClient | undefined;
};

export const apifyClient =
  globalForApify.apifyClient ??
  new ApifyClient({ token: process.env.APIFY_API_TOKEN });

if (process.env.NODE_ENV !== "production")
  globalForApify.apifyClient = apifyClient;

// Apify Actor IDs for each data source
export const APIFY_ACTORS = {
  AMAZON_REVIEWS: "junglee/amazon-reviews-scraper",
  REDDIT_POSTS: "trudax/reddit-scraper",
  REDDIT_COMMENTS: "trudax/reddit-scraper",
  INSTAGRAM_COMMENTS: "apify/instagram-comment-scraper",
} as const;
