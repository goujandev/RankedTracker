/**
 * Valorant tier ids are contiguous from Iron 1 (3) up to Radiant (27); ids 0-2
 * are unused placeholders. `elo` follows the same ladder at 100 points per tier,
 * so a tier boundary sits at every (id - 3) * 100.
 */
const TIER_NAMES = [
  "Iron 1",
  "Iron 2",
  "Iron 3",
  "Bronze 1",
  "Bronze 2",
  "Bronze 3",
  "Silver 1",
  "Silver 2",
  "Silver 3",
  "Gold 1",
  "Gold 2",
  "Gold 3",
  "Platinum 1",
  "Platinum 2",
  "Platinum 3",
  "Diamond 1",
  "Diamond 2",
  "Diamond 3",
  "Ascendant 1",
  "Ascendant 2",
  "Ascendant 3",
  "Immortal 1",
  "Immortal 2",
  "Immortal 3",
  "Radiant",
];

const FIRST_RANKED_TIER_ID = 3;

export function tierNameFromElo(elo: number): string | null {
  const index = Math.floor(elo / 100);
  return TIER_NAMES[index] ?? null;
}

export function eloForTierBoundary(index: number): number {
  return index * 100;
}

export function tierIdToName(id: number): string | null {
  return TIER_NAMES[id - FIRST_RANKED_TIER_ID] ?? null;
}
