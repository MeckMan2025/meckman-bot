import { REJECTED_MESSAGE } from "../ui/constitution";

// Patterns that indicate NSFW or prohibited content requests
const BLOCKED_PATTERNS: RegExp[] = [
  // Explicit sexual content
  /\b(nude|naked|nsfw|porn|xxx|hentai|erotic|sexua(?:l|lly)|lewd)\b/i,
  // Violence and gore
  /\b(gore|dismember|mutilat|torture|graphic.?violence|brutal.?kill)\b/i,
  // Hate speech
  /\b(racial.?slur|ethnic.?cleansing|white.?supremac|genocide)\b/i,
  // Self-harm
  /\b(suicide.?method|how.?to.?kill.?(myself|yourself|themselves)|self.?harm.?instruc)\b/i,
  // Drug manufacturing
  /\b(synthesiz.{0,5}(meth|cocaine|fentanyl|heroin)|cook.?meth|make.?drugs)\b/i,
  // Weapons manufacturing
  /\b(build.{0,5}bomb|make.{0,5}explosive|3d.?print.{0,5}gun|ghost.?gun)\b/i,
  // Child exploitation
  /\b(child.?porn|underage|minor.{0,5}(sexual|explicit|nude))\b/i,
];

// Additional patterns for image/gif prompts (stricter for visual content)
const BLOCKED_IMAGE_PATTERNS: RegExp[] = [
  ...BLOCKED_PATTERNS,
  /\b(bikini|lingerie|underwear|seductive|provocative|suggestive)\b/i,
  /\b(blood|wound|corpse|dead.?body|death.?scene)\b/i,
  /\b(weapon|gun|rifle|pistol|knife.?attack|sword.?fight)\b/i,
];

export interface FilterResult {
  safe: boolean;
  message?: string;
}

export function filterTextInput(prompt: string): FilterResult {
  const trimmed = prompt.trim();

  if (!trimmed) {
    return { safe: false, message: "Please provide a message." };
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { safe: false, message: REJECTED_MESSAGE };
    }
  }

  return { safe: true };
}

export function filterImageInput(prompt: string): FilterResult {
  const trimmed = prompt.trim();

  if (!trimmed) {
    return { safe: false, message: "Please provide an image description." };
  }

  for (const pattern of BLOCKED_IMAGE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { safe: false, message: REJECTED_MESSAGE };
    }
  }

  return { safe: true };
}
