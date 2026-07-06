import {
  GameRecord,
  GameResult,
  Player,
  PlayerStats,
  Rank,
  RawResult,
  RecentStats,
  SEAT_ORDER,
  Seat,
  SeatAssignment,
  Uma,
  ValidationResult
} from "../types";

export const TOTAL_SCORE = 105000;
export const BASE_SCORE = 35000;
export const SCORE_STEP = 1000;

const seatPriority: Record<Seat, number> = {
  east: 0,
  south: 1,
  west: 2
};

function emptyRecent(windowSize: 5 | 10 | 20): RecentStats {
  return {
    windowSize,
    games: 0,
    averageRank: 0,
    totalAdjustedPoint: 0,
    averageAdjustedPoint: 0,
    bestAdjustedPoint: 0,
    worstAdjustedPoint: 0
  };
}

function createEmptyStats(player: Pick<Player, "id" | "name" | "active">): PlayerStats {
  return {
    playerId: player.id,
    playerName: player.name,
    active: player.active,
    totalGames: 0,
    rank1Count: 0,
    rank2Count: 0,
    rank3Count: 0,
    averageRank: 0,
    rank1Rate: 0,
    rank2Rate: 0,
    rank3Rate: 0,
    totalScore: 0,
    averageScore: 0,
    totalUma: 0,
    averageUma: 0,
    totalAdjustedPoint: 0,
    averageAdjustedPoint: 0,
    recent: {
      5: emptyRecent(5),
      10: emptyRecent(10),
      20: emptyRecent(20)
    }
  };
}

export function validateScores(scores: number[]): ValidationResult {
  const errors: string[] = [];

  if (scores.length !== 3) {
    errors.push("必须刚好输入三名玩家的分数。");
  }

  scores.forEach((score, index) => {
    const label = `第 ${index + 1} 名玩家`;
    if (!Number.isFinite(score)) {
      errors.push(`${label}分数不能为空。`);
      return;
    }
    if (!Number.isInteger(score)) {
      errors.push(`${label}分数必须是整数。`);
    }
    if (score < 0) {
      errors.push(`${label}分数不能为负数。`);
    }
    if (score % SCORE_STEP !== 0) {
      errors.push(`${label}分数必须是 ${SCORE_STEP} 的倍数。`);
    }
  });

  if (scores.length === 3 && scores.every(Number.isFinite)) {
    const total = scores.reduce((sum, score) => sum + score, 0);
    if (total !== TOTAL_SCORE) {
      errors.push(`三人分数总和必须等于 ${TOTAL_SCORE}，当前为 ${total}。`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function assignRandomSeats(playerIds: string[]): SeatAssignment[] {
  if (playerIds.length !== 3 || new Set(playerIds).size !== 3) {
    throw new Error("必须选择三名不同玩家后才能随机分配座位。");
  }

  const seats = [...SEAT_ORDER];
  for (let index = seats.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [seats[index], seats[randomIndex]] = [seats[randomIndex], seats[index]];
  }

  return playerIds.map((playerId, index) => ({
    playerId,
    seat: seats[index]
  }));
}

export function calculateUma(rank: Rank): Uma {
  if (rank === 1) {
    return 20;
  }
  if (rank === 2) {
    return 0;
  }
  return -20;
}

export function calculateAdjustedPoint(score: number, uma: number): number {
  return (score - BASE_SCORE) / SCORE_STEP + uma;
}

export function calculateRanks(results: RawResult[]): GameResult[] {
  if (results.length !== 3) {
    throw new Error("每局必须刚好有三名玩家。");
  }

  const ranked = [...results]
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return seatPriority[left.seat] - seatPriority[right.seat];
    })
    .map((result, index) => {
      const rank = (index + 1) as Rank;
      const uma = calculateUma(rank);
      return {
        ...result,
        rank,
        uma,
        adjustedPoint: calculateAdjustedPoint(result.score, uma)
      };
    });

  return ranked.sort((left, right) => seatPriority[left.seat] - seatPriority[right.seat]);
}

export function sortResultsBySeat(results: GameResult[]): GameResult[] {
  return [...results].sort((left, right) => seatPriority[left.seat] - seatPriority[right.seat]);
}

export function sortResultsByRank(results: GameResult[]): GameResult[] {
  return [...results].sort((left, right) => left.rank - right.rank);
}

function finalizeStats(stats: PlayerStats): PlayerStats {
  if (stats.totalGames === 0) {
    return stats;
  }

  return {
    ...stats,
    averageRank:
      (stats.rank1Count + stats.rank2Count * 2 + stats.rank3Count * 3) / stats.totalGames,
    rank1Rate: stats.rank1Count / stats.totalGames,
    rank2Rate: stats.rank2Count / stats.totalGames,
    rank3Rate: stats.rank3Count / stats.totalGames,
    averageScore: stats.totalScore / stats.totalGames,
    averageUma: stats.totalUma / stats.totalGames,
    averageAdjustedPoint: stats.totalAdjustedPoint / stats.totalGames
  };
}

function calculateRecentStats(
  windowSize: 5 | 10 | 20,
  results: Array<GameResult & { playedAt: string }>
): RecentStats {
  const recent = results
    .sort((left, right) => new Date(right.playedAt).getTime() - new Date(left.playedAt).getTime())
    .slice(0, windowSize);

  if (recent.length === 0) {
    return emptyRecent(windowSize);
  }

  const totalRank = recent.reduce((sum, result) => sum + result.rank, 0);
  const totalAdjustedPoint = recent.reduce((sum, result) => sum + result.adjustedPoint, 0);
  const adjustedPoints = recent.map((result) => result.adjustedPoint);

  return {
    windowSize,
    games: recent.length,
    averageRank: totalRank / recent.length,
    totalAdjustedPoint,
    averageAdjustedPoint: totalAdjustedPoint / recent.length,
    bestAdjustedPoint: Math.max(...adjustedPoints),
    worstAdjustedPoint: Math.min(...adjustedPoints)
  };
}

export function calculatePlayerStats(players: Player[], records: GameRecord[]): PlayerStats[] {
  const statsMap = new Map<string, PlayerStats>();
  const recentResults = new Map<string, Array<GameResult & { playedAt: string }>>();

  players.forEach((player) => {
    statsMap.set(player.id, createEmptyStats(player));
    recentResults.set(player.id, []);
  });

  records.forEach((record) => {
    record.results.forEach((result) => {
      if (!statsMap.has(result.playerId)) {
        statsMap.set(
          result.playerId,
          createEmptyStats({
            id: result.playerId,
            name: result.playerNameSnapshot,
            active: false
          })
        );
        recentResults.set(result.playerId, []);
      }

      const stats = statsMap.get(result.playerId);
      const recent = recentResults.get(result.playerId);
      if (!stats || !recent) {
        return;
      }

      stats.totalGames += 1;
      stats.totalScore += result.score;
      stats.totalUma += result.uma;
      stats.totalAdjustedPoint += result.adjustedPoint;

      if (result.rank === 1) {
        stats.rank1Count += 1;
      } else if (result.rank === 2) {
        stats.rank2Count += 1;
      } else {
        stats.rank3Count += 1;
      }

      recent.push({
        ...result,
        playedAt: record.playedAt
      });
    });
  });

  return Array.from(statsMap.values())
    .map((stats) => {
      const recent = recentResults.get(stats.playerId) ?? [];
      const finalized = finalizeStats(stats);
      return {
        ...finalized,
        recent: {
          5: calculateRecentStats(5, [...recent]),
          10: calculateRecentStats(10, [...recent]),
          20: calculateRecentStats(20, [...recent])
        }
      };
    })
    .sort((left, right) => {
      if (right.totalGames !== left.totalGames) {
        return right.totalGames - left.totalGames;
      }
      return left.playerName.localeCompare(right.playerName, "zh-CN");
    });
}
