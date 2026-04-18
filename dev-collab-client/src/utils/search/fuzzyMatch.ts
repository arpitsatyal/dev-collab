import { normalizeQuery } from "../navigation/normalizeQuery";
import { levenshtein } from "../ai/levenshtein";
import { TypedItems } from "../../types";

export const FUZZY_MATCH_THRESHOLD = 2;

export const findClosestCacheMatch = (
  term: string,
  searchCache: Map<string, TypedItems[]>,
): TypedItems[] | null => {
  let bestMatch: string | null = null;
  let bestDistance = Infinity;

  if (term.length < 3) return null;
  for (const key of searchCache.keys()) {
    const distance = levenshtein(normalizeQuery(term), key);
    if (distance < bestDistance && distance <= FUZZY_MATCH_THRESHOLD) {
      bestDistance = distance;
      bestMatch = key;
    }
  }

  return bestMatch ? (searchCache.get(bestMatch) ?? null) : null;
};
