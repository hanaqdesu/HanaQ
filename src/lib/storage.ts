import { AppData } from "../types";
import { sampleData } from "../data/sampleData";

const STORAGE_KEY = "three-player-mahjong-score-records:v1";

export function cloneData(data: AppData): AppData {
  return JSON.parse(JSON.stringify(data)) as AppData;
}

export function normalizeData(data: Partial<AppData> | null | undefined): AppData {
  return {
    players: Array.isArray(data?.players) ? data.players : [],
    records: Array.isArray(data?.records) ? data.records : [],
    settings: {
      minimumLeaderboardGames: data?.settings?.minimumLeaderboardGames ?? 5
    }
  };
}

export function loadData(): AppData {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return cloneData(sampleData);
  }

  try {
    return normalizeData(JSON.parse(stored) as AppData);
  } catch {
    return cloneData(sampleData);
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function resetToSampleData(): AppData {
  const fresh = cloneData(sampleData);
  saveData(fresh);
  return fresh;
}
