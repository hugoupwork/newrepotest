export interface OnboardingField {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "url";
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

export interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  fields: OnboardingField[];
}

export const onboardingSteps: OnboardingStep[] = [
  {
    id: 1,
    title: "Brand Info",
    description: "Tell us about your brand and business.",
    fields: [
      {
        name: "companyName",
        label: "Company / Brand Name",
        type: "text",
        placeholder: "e.g. Acme Corp",
        required: true,
      },
      {
        name: "website",
        label: "Website",
        type: "url",
        placeholder: "https://example.com",
      },
      {
        name: "industry",
        label: "Industry",
        type: "select",
        required: true,
        options: [
          "E-commerce / DTC",
          "SaaS / Software",
          "Health & Wellness",
          "Beauty & Skincare",
          "Food & Beverage",
          "Fashion & Apparel",
          "Home & Garden",
          "Fitness & Sports",
          "Pet Products",
          "Electronics",
          "Education",
          "Financial Services",
          "Other",
        ],
      },
      {
        name: "productLine",
        label: "Products or Services",
        type: "textarea",
        placeholder:
          "Describe your main products or services, what makes them unique...",
        required: true,
      },
      {
        name: "brandStory",
        label: "Brand Story (optional)",
        type: "textarea",
        placeholder: "How did the brand start? What's the mission?",
      },
      {
        name: "yearFounded",
        label: "Year Founded",
        type: "text",
        placeholder: "e.g. 2020",
      },
      {
        name: "teamSize",
        label: "Team Size",
        type: "select",
        options: ["Solo / Founder", "2-5", "6-15", "16-50", "50+"],
      },
    ],
  },
  {
    id: 2,
    title: "Goals & Objectives",
    description: "What are you trying to achieve?",
    fields: [
      {
        name: "primaryGoal",
        label: "Primary Growth Goal",
        type: "select",
        required: true,
        options: [
          "Scale revenue",
          "Improve ROAS / profitability",
          "Launch new product",
          "Enter new market",
          "Build brand awareness",
          "Increase customer retention",
          "Reduce CAC",
          "Other",
        ],
      },
      {
        name: "growthTargets",
        label: "Specific Growth Targets",
        type: "textarea",
        placeholder:
          "e.g. Reach $500K/month in revenue, 3x ROAS on paid ads, 10K email subscribers...",
        required: true,
      },
      {
        name: "timeline",
        label: "Timeline",
        type: "select",
        required: true,
        options: [
          "1-3 months",
          "3-6 months",
          "6-12 months",
          "12+ months",
        ],
      },
      {
        name: "kpis",
        label: "Key Performance Indicators (KPIs)",
        type: "textarea",
        placeholder:
          "What metrics matter most? e.g. Revenue, ROAS, CTR, CPA, LTV, Repeat Purchase Rate...",
        required: true,
      },
      {
        name: "budgetRange",
        label: "Monthly Marketing Budget (optional)",
        type: "select",
        options: [
          "Under $5K",
          "$5K - $15K",
          "$15K - $50K",
          "$50K - $150K",
          "$150K+",
          "Prefer not to say",
        ],
      },
    ],
  },
  {
    id: 3,
    title: "Target Audience",
    description: "Who are your customers?",
    fields: [
      {
        name: "demographics",
        label: "Demographics",
        type: "textarea",
        placeholder:
          "Age range, gender, income level, location, education...",
        required: true,
      },
      {
        name: "psychographics",
        label: "Psychographics (optional)",
        type: "textarea",
        placeholder:
          "Values, interests, lifestyle, attitudes... What do they care about?",
      },
      {
        name: "onlineHangouts",
        label: "Where They Hang Out Online",
        type: "textarea",
        placeholder:
          "Reddit subreddits, Instagram accounts they follow, Amazon categories they browse, YouTube channels, TikTok...",
        required: true,
      },
      {
        name: "purchaseBehavior",
        label: "Purchase Behavior (optional)",
        type: "textarea",
        placeholder:
          "How do they discover and buy products? Impulse vs. research-driven? Price sensitive?",
      },
      {
        name: "painPoints",
        label: "Main Pain Points",
        type: "textarea",
        placeholder:
          "What problems are they trying to solve? What frustrates them about existing solutions?",
        required: true,
      },
    ],
  },
  {
    id: 4,
    title: "Current Marketing",
    description: "Where are you now with your marketing efforts?",
    fields: [
      {
        name: "currentChannels",
        label: "Current Marketing Channels",
        type: "textarea",
        placeholder:
          "e.g. Meta Ads, Google Ads, TikTok, Email, SEO, Influencer marketing, Amazon PPC...",
        required: true,
      },
      {
        name: "monthlyAdSpend",
        label: "Current Monthly Ad Spend (optional)",
        type: "select",
        options: [
          "Not running ads",
          "Under $5K",
          "$5K - $15K",
          "$15K - $50K",
          "$50K - $150K",
          "$150K+",
        ],
      },
      {
        name: "whatsWorking",
        label: "What's Working (optional)",
        type: "textarea",
        placeholder:
          "What channels, creatives, or strategies are performing well?",
      },
      {
        name: "whatsNotWorking",
        label: "What's NOT Working (optional)",
        type: "textarea",
        placeholder:
          "What have you tried that didn't work? What's frustrating you?",
      },
      {
        name: "pastCampaigns",
        label: "Notable Past Campaigns (optional)",
        type: "textarea",
        placeholder:
          "Any campaigns worth mentioning — successful or unsuccessful?",
      },
    ],
  },
  {
    id: 5,
    title: "Competitors",
    description: "Who else is in the space?",
    fields: [
      {
        name: "keyCompetitors",
        label: "Key Competitors (optional)",
        type: "textarea",
        placeholder:
          "List 3-5 competitors. Include their websites if possible.",
      },
      {
        name: "differentiators",
        label: "What Makes You Different (optional)",
        type: "textarea",
        placeholder:
          "Why should customers choose you over competitors?",
      },
      {
        name: "marketPositioning",
        label: "Market Positioning (optional)",
        type: "textarea",
        placeholder:
          "Are you premium, value, niche, mass-market? How do you see yourself?",
      },
    ],
  },
];
