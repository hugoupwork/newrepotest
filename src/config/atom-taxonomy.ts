export const ATOM_CATEGORIES = [
  { value: "VISUAL_HOOK", label: "Visual Hook", description: "First 1-3 seconds attention grabber", icon: "Eye" },
  { value: "TEXT_OVERLAY", label: "Text Overlay", description: "On-screen text, captions, subtitles", icon: "Type" },
  { value: "COLOR_PALETTE", label: "Color Palette", description: "Dominant colors and scheme", icon: "Palette" },
  { value: "SCENE_COMPOSITION", label: "Scene Composition", description: "Layout, framing, visual hierarchy", icon: "Layout" },
  { value: "TALENT_ACTOR", label: "Talent/Actor", description: "People appearing in the creative", icon: "User" },
  { value: "EMOTION", label: "Emotion", description: "Emotional tone conveyed", icon: "Heart" },
  { value: "MUSIC_AUDIO", label: "Music/Audio", description: "Background music, voiceover, sound effects", icon: "Music" },
  { value: "TRANSITION", label: "Transition", description: "Scene transitions and editing style", icon: "ArrowRightLeft" },
  { value: "CTA_ELEMENT", label: "CTA Element", description: "Visual and text call-to-action", icon: "MousePointerClick" },
  { value: "PRODUCT_PLACEMENT", label: "Product Placement", description: "How the product is shown", icon: "Package" },
  { value: "PACING", label: "Pacing", description: "Speed, rhythm, scene duration", icon: "Timer" },
  { value: "LIGHTING_MOOD", label: "Lighting/Mood", description: "Lighting style and atmosphere", icon: "Sun" },
  { value: "TYPOGRAPHY", label: "Typography", description: "Font choices and text styling", icon: "ALargeSmall" },
  { value: "BRANDING_ELEMENT", label: "Branding", description: "Logo placement, brand colors", icon: "Stamp" },
  { value: "SOCIAL_PROOF_ELEMENT", label: "Social Proof", description: "Reviews, ratings, testimonials", icon: "Star" },
  { value: "OTHER", label: "Other", description: "Other creative elements", icon: "MoreHorizontal" },
] as const;

export const PERFORMANCE_TIER_OPTIONS = [
  { value: "WINNER", label: "Winner", color: "green", description: "Top ~20% by ROAS/spend" },
  { value: "STRONG", label: "Strong", color: "emerald", description: "Above average performance" },
  { value: "AVERAGE", label: "Average", color: "yellow", description: "Middle of the pack" },
  { value: "WEAK", label: "Weak", color: "orange", description: "Below average performance" },
  { value: "NON_SPENDER", label: "Non-Spender", color: "red", description: "Barely any spend allocated" },
  { value: "UNKNOWN", label: "Unknown", color: "gray", description: "No performance data" },
] as const;
