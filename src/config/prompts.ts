export const SYSTEM_PROMPT = `You are an expert brand strategist and consumer researcher working within the Evolve Method framework. Your role is to analyze consumer data (reviews, comments, discussions) and provide actionable insights for brand growth strategy.

Always:
- Be specific and data-driven
- Reference actual quotes and patterns from the data
- Flag conflicting signals
- Prioritize actionable insights over generic observations
- Distinguish between genuine consumer sentiment and potential astroturfing`;

export const CONSUMER_INSIGHTS_PROMPT = `Analyze the following consumer reviews and comments for this brand.

BRAND CONTEXT:
{brandContext}

DATA SOURCE: {source}
TOTAL ITEMS: {itemCount} (after filtering {flaggedCount} potentially fake reviews)

REVIEWS/COMMENTS:
{data}

Provide a structured analysis in JSON format:
{
  "keyThemes": [{"theme": "...", "frequency": "high|medium|low", "sentiment": "positive|negative|mixed", "exampleQuotes": ["..."]}],
  "painPoints": [{"issue": "...", "severity": "high|medium|low", "frequency": "...", "quotes": ["..."]}],
  "emotionalTriggers": [{"trigger": "...", "context": "..."}],
  "purchaseMotivations": [{"motivation": "...", "evidence": "..."}],
  "languagePatterns": {"commonPhrases": ["..."], "toneProfile": "..."},
  "competitiveMentions": [{"competitor": "...", "context": "...", "sentiment": "..."}],
  "unexpectedFindings": ["..."],
  "dataQualityNotes": "..."
}`;

export const SENTIMENT_OVERVIEW_PROMPT = `Perform a comprehensive sentiment analysis on the following consumer data.

BRAND CONTEXT:
{brandContext}

DATA:
{data}

Return structured JSON:
{
  "overallSentiment": {"score": 0.0, "label": "positive|negative|neutral|mixed"},
  "sentimentDistribution": {"positive": 0, "neutral": 0, "negative": 0},
  "sentimentByTopic": [{"topic": "...", "sentiment": 0.0, "sampleSize": 0}],
  "sentimentTrends": "...",
  "mostPositiveThemes": ["..."],
  "mostNegativeThemes": ["..."],
  "sentimentDrivers": {"positive": ["..."], "negative": ["..."]}
}`;

export const COMPETITIVE_ANALYSIS_PROMPT = `Analyze competitive mentions found in consumer reviews and discussions.

BRAND CONTEXT:
{brandContext}

DATA:
{data}

Return structured JSON:
{
  "competitorsFound": [{"name": "...", "mentionCount": 0, "overallSentiment": "..."}],
  "competitivePositioning": {"strengths": ["..."], "weaknesses": ["..."]},
  "switchingMotivations": [{"from": "...", "to": "...", "reason": "..."}],
  "featureComparisons": [{"feature": "...", "brandPerception": "...", "competitorPerception": "..."}],
  "opportunityGaps": ["..."]
}`;

export const GROWTH_OPPORTUNITIES_PROMPT = `Based on all the research data and brand context, identify growth opportunities.

BRAND CONTEXT:
{brandContext}

RESEARCH SUMMARY:
{researchSummary}

CONSUMER INSIGHTS:
{insights}

Return structured JSON:
{
  "opportunities": [
    {
      "title": "...",
      "description": "...",
      "category": "messaging|targeting|creative|channel|product|positioning",
      "evidence": ["..."],
      "estimatedImpact": "high|medium|low",
      "implementationDifficulty": "easy|moderate|hard",
      "priority": 1
    }
  ],
  "underservedNeeds": ["..."],
  "messagingGaps": ["..."],
  "audienceSegments": [{"segment": "...", "opportunity": "..."}],
  "channelRecommendations": [{"channel": "...", "rationale": "..."}],
  "creativeDirections": [{"direction": "...", "evidence": "..."}]
}`;

export const FULL_STRATEGY_PROMPT = `You are producing a comprehensive growth strategy for this brand based on all available data.

BRAND CONTEXT:
{brandContext}

ONBOARDING DATA:
{onboardingData}

RESEARCH INSIGHTS:
{researchInsights}

AD PERFORMANCE (if available):
{adPerformance}

PREVIOUS STRATEGIES & DECISIONS:
{previousStrategies}

Produce a comprehensive strategy document in JSON format:
{
  "executiveSummary": "...",
  "priorityActions": [
    {
      "action": "...",
      "rationale": "...",
      "category": "...",
      "expectedImpact": "...",
      "resources": "...",
      "timeline": "...",
      "confidence": 0.0
    }
  ],
  "whatsWorking": [{"item": "...", "evidence": "..."}],
  "whatsNotWorking": [{"item": "...", "evidence": "...", "suggestion": "..."}],
  "quickWins": ["..."],
  "longTermPlays": ["..."],
  "risksAndMitigations": [{"risk": "...", "mitigation": "..."}]
}`;
