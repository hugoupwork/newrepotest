import { z } from "zod";

export const brandInfoSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  website: z.string().url("Must be a valid URL").or(z.literal("")),
  industry: z.string().min(1, "Industry is required"),
  productLine: z.string().min(1, "Describe your products or services"),
  brandStory: z.string().optional(),
  yearFounded: z.string().optional(),
  teamSize: z.string().optional(),
});

export const goalsSchema = z.object({
  primaryGoal: z.string().min(1, "Primary goal is required"),
  growthTargets: z.string().min(1, "Growth targets are required"),
  timeline: z.string().min(1, "Timeline is required"),
  kpis: z.string().min(1, "Key KPIs are required"),
  budgetRange: z.string().optional(),
});

export const targetAudienceSchema = z.object({
  demographics: z.string().min(1, "Demographics are required"),
  psychographics: z.string().optional(),
  onlineHangouts: z.string().min(1, "Where does your audience hang out online?"),
  purchaseBehavior: z.string().optional(),
  painPoints: z.string().min(1, "What are their main pain points?"),
});

export const currentStateSchema = z.object({
  currentChannels: z.string().min(1, "Describe your current marketing channels"),
  monthlyAdSpend: z.string().optional(),
  whatsWorking: z.string().optional(),
  whatsNotWorking: z.string().optional(),
  pastCampaigns: z.string().optional(),
});

export const competitorsSchema = z.object({
  keyCompetitors: z.string().optional(),
  differentiators: z.string().optional(),
  marketPositioning: z.string().optional(),
});

export type BrandInfo = z.infer<typeof brandInfoSchema>;
export type Goals = z.infer<typeof goalsSchema>;
export type TargetAudience = z.infer<typeof targetAudienceSchema>;
export type CurrentState = z.infer<typeof currentStateSchema>;
export type Competitors = z.infer<typeof competitorsSchema>;

export interface OnboardingFormData {
  brandInfo: BrandInfo;
  goals: Goals;
  targetAudience: TargetAudience;
  currentState: CurrentState;
  competitors: Competitors;
  additionalNotes?: string;
}

export const ONBOARDING_STEPS = [
  { id: 1, title: "Brand Info", description: "Tell us about your brand" },
  { id: 2, title: "Goals", description: "What are you trying to achieve?" },
  { id: 3, title: "Audience", description: "Who are your customers?" },
  { id: 4, title: "Current State", description: "Where are you now?" },
  { id: 5, title: "Competitors", description: "Who else is in the space?" },
  { id: 6, title: "Review", description: "Review and submit" },
] as const;
