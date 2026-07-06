export type Seat = "east" | "south" | "west";
export type Rank = 1 | 2 | 3;
export type Uma = 20 | 0 | -20;

export const SEAT_ORDER: Seat[] = ["east", "south", "west"];

export const SEAT_LABELS: Record<Seat, string> = {
  east: "东",
  south: "南",
  west: "西"
};

export type Player = {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
};

export type RawResult = {
  playerId: string;
  playerNameSnapshot: string;
  seat: Seat;
  score: number;
};

export type GameResult = RawResult & {
  rank: Rank;
  uma: Uma;
  adjustedPoint: number;
};

export type GameRecord = {
  id: string;
  playedAt: string;
  results: GameResult[];
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type GameRecordInput = {
  playedAt: string;
  results: RawResult[];
  note?: string;
};

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export type SeatAssignment = {
  playerId: string;
  seat: Seat;
};

export type RecentStats = {
  windowSize: 5 | 10 | 20;
  games: number;
  averageRank: number;
  totalAdjustedPoint: number;
  averageAdjustedPoint: number;
  bestAdjustedPoint: number;
  worstAdjustedPoint: number;
};

export type PlayerStats = {
  playerId: string;
  playerName: string;
  active: boolean;
  totalGames: number;
  rank1Count: number;
  rank2Count: number;
  rank3Count: number;
  averageRank: number;
  rank1Rate: number;
  rank2Rate: number;
  rank3Rate: number;
  totalScore: number;
  averageScore: number;
  totalUma: number;
  averageUma: number;
  totalAdjustedPoint: number;
  averageAdjustedPoint: number;
  recent: Record<5 | 10 | 20, RecentStats>;
};

export type AppSettings = {
  minimumLeaderboardGames: number;
};

export type AppData = {
  players: Player[];
  records: GameRecord[];
  settings: AppSettings;
};
