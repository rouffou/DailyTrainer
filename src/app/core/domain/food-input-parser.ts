import type { ParsedFoodInput } from '../models/parsed-food-input.model';

const DEFAULT_UNIT = 'unité';

// DailyTrainer_SPEC.md section 5.1 step 1 gives this as a plain regex, e.g.
// "100gr de bacon aldi" -> { quantity: 100, unit: 'g', name: 'bacon aldi' }.
//
// The unit alternatives are followed by a lookahead for whitespace/end-of-string rather than
// a plain \b: JS's \b is defined in terms of \w ([A-Za-z0-9_]), which doesn't include accented
// letters, so "100 gâteau" would otherwise have "g" wrongly consumed as the unit (the
// transition from 'g' to 'â' still counts as a word boundary) — leaving "âteau" as the name.
const FOOD_INPUT_PATTERN =
  /^(\d+(?:[.,]\d+)?)\s*(?:(g|gr|kg|ml|cl|cas|cac|unité)(?=\s|$))?\s*(?:de\s+|d')?(.+)$/i;

export function parseFoodInput(input: string): ParsedFoodInput | null {
  const match = FOOD_INPUT_PATTERN.exec(input.trim());
  if (!match) {
    return null;
  }

  const [, quantityText, unit, name] = match;
  // quantityText and name come from mandatory (non-`?`) capture groups: if `match` succeeded,
  // both were necessarily captured. Only the unit group is optional (`?`) and genuinely absent.
  return {
    quantity: Number(quantityText!.replace(',', '.')),
    unit: unit?.toLowerCase() ?? DEFAULT_UNIT,
    name: name!.trim(),
  };
}

// DailyTrainer_SPEC.md section 8 step 12 (Bonus V2) — "100gr de bacon aldi, 500gr de
// crudités..." in one go. Splits on newlines (a multi-line textarea is as valid an input shape
// as a single comma-separated sentence) and on commas, then reuses parseFoodInput per segment.
// A comma is only treated as a separator when NOT immediately followed by a digit — French
// decimal quantities ("0,5kg") use a comma with no surrounding space, while a list separator
// is followed by whitespace (SPEC's own example: "..., 500gr..."), so this tells them apart
// without needing to look ahead any further than the very next character.
// A segment that doesn't parse (typo, stray punctuation) is silently dropped rather than
// failing the whole batch — the caller only ever sees entries it can actually act on.
export function parseMultipleFoodInputs(input: string): ParsedFoodInput[] {
  return input
    .split(/,(?!\d)|\n/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0)
    .map((segment) => parseFoodInput(segment))
    .filter((parsed): parsed is ParsedFoodInput => parsed !== null);
}
