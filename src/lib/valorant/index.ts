import "server-only";
import { HenrikDevProvider } from "./henrikdev";
import type { ValorantDataProvider } from "./provider";

export type { PlayerProfile, Affinity, RiotId } from "./types";
export { ValorantApiError } from "./types";

let provider: ValorantDataProvider | null = null;

export function getValorantProvider(): ValorantDataProvider {
  if (!provider) {
    provider = new HenrikDevProvider();
  }
  return provider;
}
