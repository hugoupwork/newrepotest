export const IMAGE_ATOM_EXTRACTION_PROMPT = `You are an expert ad creative analyst specializing in performance marketing. Analyze this ad image and break it down into its atomic creative elements.

For each element you identify, provide:
- category: One of VISUAL_HOOK, TEXT_OVERLAY, COLOR_PALETTE, SCENE_COMPOSITION, TALENT_ACTOR, EMOTION, CTA_ELEMENT, PRODUCT_PLACEMENT, LIGHTING_MOOD, TYPOGRAPHY, BRANDING_ELEMENT, SOCIAL_PROOF_ELEMENT, OTHER
- name: A short descriptive name (snake_case, e.g. "bold_red_headline", "smiling_woman_closeup")
- description: A detailed description of this element
- confidence: Your confidence in this assessment (0.0-1.0)
- attributes: Any additional key-value details (colors, fonts, positions, etc.)

Be thorough — identify EVERY distinct creative element. Focus on what makes this ad work (or not work) from a direct-response advertising perspective.

Return your analysis as a JSON object with this structure:
{
  "atoms": [
    {
      "category": "VISUAL_HOOK",
      "name": "example_name",
      "description": "Description here",
      "confidence": 0.95,
      "attributes": { "key": "value" }
    }
  ],
  "overallAssessment": "Brief assessment of the creative's likely effectiveness"
}

Return ONLY valid JSON, no markdown code fences.`;

export const VIDEO_ATOM_EXTRACTION_PROMPT = `You are an expert video ad creative analyst specializing in performance marketing. Analyze this video ad and break it down into its atomic creative elements.

For each element, provide:
- category: One of VISUAL_HOOK, TEXT_OVERLAY, COLOR_PALETTE, SCENE_COMPOSITION, TALENT_ACTOR, EMOTION, MUSIC_AUDIO, TRANSITION, CTA_ELEMENT, PRODUCT_PLACEMENT, PACING, LIGHTING_MOOD, TYPOGRAPHY, BRANDING_ELEMENT, SOCIAL_PROOF_ELEMENT, OTHER
- name: A short descriptive name (snake_case)
- description: A detailed description
- confidence: 0.0-1.0
- timestampStart: Approximate start time in milliseconds (if applicable)
- timestampEnd: Approximate end time in milliseconds (if applicable)
- attributes: Additional key-value details

Pay special attention to:
- The hook (first 1-3 seconds) — what grabs attention?
- Pacing and transitions between scenes
- Audio elements (music, voiceover, sound effects)
- How the CTA is delivered
- The overall narrative arc

Return your analysis as a JSON object:
{
  "atoms": [
    {
      "category": "VISUAL_HOOK",
      "name": "example_name",
      "description": "Description",
      "confidence": 0.95,
      "timestampStart": 0,
      "timestampEnd": 3000,
      "attributes": { "key": "value" }
    }
  ],
  "overallAssessment": "Brief assessment of the video ad's likely effectiveness"
}

Return ONLY valid JSON, no markdown code fences.`;

export const SIMILARITY_ASSESSMENT_PROMPT = `Compare these two ad creatives and assess their similarity. Consider:
- Visual layout and composition
- Color scheme
- Copy/messaging
- Format and style
- Target audience
- Overall creative approach

Return a JSON object:
{
  "similarityScore": 0.85,
  "reasoning": "Explanation of why they are similar/different",
  "sharedElements": ["element1", "element2"],
  "differences": ["difference1", "difference2"]
}

Return ONLY valid JSON, no markdown code fences.`;

export const CORRELATION_INSIGHT_PROMPT = `You are a performance marketing strategist analyzing the relationship between ad creative elements and campaign performance.

Given the following data about which creative "atoms" (elements) appear in winning vs. losing ads, generate actionable insights.

WINNING ATOMS (elements that correlate with top-performing ads):
{winningAtoms}

LOSING ATOMS (elements that correlate with non-spending/poor ads):
{losingAtoms}

OVERALL STATISTICS:
{stats}

Provide your analysis as JSON:
{
  "winningPatterns": [
    { "pattern": "Description of pattern", "strength": 0.85, "examples": ["example1"] }
  ],
  "losingPatterns": [
    { "pattern": "Description of pattern", "strength": 0.7, "examples": ["example1"] }
  ],
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2"
  ],
  "summary": "Executive summary of findings"
}

Return ONLY valid JSON, no markdown code fences.`;
