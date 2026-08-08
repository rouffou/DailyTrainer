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
