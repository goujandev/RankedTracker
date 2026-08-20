import type { Affinity, PlayerProfile } from "./types";

export interface ValorantDataProvider {
  getPlayerProfile(riotId: { name: string; tag: string }, affinity: Affinity): Promise<PlayerProfile>;
}
