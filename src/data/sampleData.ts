import { AppData, GameRecord, Player, RawResult } from "../types";
import { calculateRanks } from "../lib/mahjong";

const createdAt = "2026-07-01T09:00:00.000Z";

export const samplePlayers: Player[] = [
  { id: "player_zhangsan", name: "张三", active: true, createdAt },
  { id: "player_lisi", name: "李四", active: true, createdAt },
  { id: "player_wangwu", name: "王五", active: true, createdAt },
  { id: "player_zhaoliu", name: "赵六", active: true, createdAt },
  { id: "player_xiaolin", name: "小林", active: true, createdAt },
  { id: "player_tianzhong", name: "田中", active: true, createdAt }
];

const playerName = (playerId: string) =>
  samplePlayers.find((player) => player.id === playerId)?.name ?? "未知玩家";

function record(
  id: string,
  playedAt: string,
  results: Array<Omit<RawResult, "playerNameSnapshot">>,
  note: string
): GameRecord {
  const rawResults = results.map((result) => ({
    ...result,
    playerNameSnapshot: playerName(result.playerId)
  }));

  return {
    id,
    playedAt,
    results: calculateRanks(rawResults),
    note,
    createdAt: playedAt,
    updatedAt: playedAt
  };
}

export const sampleRecords: GameRecord[] = [
  record(
    "game_20260701_001",
    "2026-07-01T10:00:00.000Z",
    [
      { playerId: "player_zhangsan", seat: "east", score: 45000 },
      { playerId: "player_lisi", seat: "south", score: 35000 },
      { playerId: "player_wangwu", seat: "west", score: 25000 }
    ],
    "正常不同分数"
  ),
  record(
    "game_20260701_002",
    "2026-07-01T11:00:00.000Z",
    [
      { playerId: "player_lisi", seat: "east", score: 40000 },
      { playerId: "player_wangwu", seat: "south", score: 40000 },
      { playerId: "player_zhaoliu", seat: "west", score: 25000 }
    ],
    "两人同分，东优先"
  ),
  record(
    "game_20260702_001",
    "2026-07-02T10:30:00.000Z",
    [
      { playerId: "player_wangwu", seat: "east", score: 35000 },
      { playerId: "player_zhaoliu", seat: "south", score: 35000 },
      { playerId: "player_xiaolin", seat: "west", score: 35000 }
    ],
    "三人同分，按东南西排序"
  ),
  record(
    "game_20260702_002",
    "2026-07-02T12:30:00.000Z",
    [
      { playerId: "player_zhaoliu", seat: "east", score: 30000 },
      { playerId: "player_xiaolin", seat: "south", score: 45000 },
      { playerId: "player_tianzhong", seat: "west", score: 30000 }
    ],
    "西南东座位覆盖"
  ),
  record(
    "game_20260703_001",
    "2026-07-03T13:00:00.000Z",
    [
      { playerId: "player_xiaolin", seat: "east", score: 50000 },
      { playerId: "player_tianzhong", seat: "south", score: 25000 },
      { playerId: "player_zhangsan", seat: "west", score: 30000 }
    ],
    "小林大胜"
  ),
  record(
    "game_20260703_002",
    "2026-07-03T20:00:00.000Z",
    [
      { playerId: "player_tianzhong", seat: "east", score: 38000 },
      { playerId: "player_zhangsan", seat: "south", score: 37000 },
      { playerId: "player_lisi", seat: "west", score: 30000 }
    ],
    "田中微胜"
  ),
  record(
    "game_20260704_001",
    "2026-07-04T09:30:00.000Z",
    [
      { playerId: "player_zhangsan", seat: "east", score: 28000 },
      { playerId: "player_wangwu", seat: "south", score: 42000 },
      { playerId: "player_xiaolin", seat: "west", score: 35000 }
    ],
    "王五逆转"
  ),
  record(
    "game_20260704_002",
    "2026-07-04T15:15:00.000Z",
    [
      { playerId: "player_lisi", seat: "east", score: 34000 },
      { playerId: "player_zhaoliu", seat: "south", score: 36000 },
      { playerId: "player_tianzhong", seat: "west", score: 35000 }
    ],
    "分差很小"
  ),
  record(
    "game_20260705_001",
    "2026-07-05T10:00:00.000Z",
    [
      { playerId: "player_wangwu", seat: "east", score: 31000 },
      { playerId: "player_xiaolin", seat: "south", score: 39000 },
      { playerId: "player_zhangsan", seat: "west", score: 35000 }
    ],
    "成绩点正负都有"
  ),
  record(
    "game_20260705_002",
    "2026-07-05T18:45:00.000Z",
    [
      { playerId: "player_zhaoliu", seat: "east", score: 43000 },
      { playerId: "player_tianzhong", seat: "south", score: 33000 },
      { playerId: "player_lisi", seat: "west", score: 29000 }
    ],
    "赵六一位"
  )
];

export const sampleData: AppData = {
  players: samplePlayers,
  records: sampleRecords,
  settings: {
    minimumLeaderboardGames: 5
  }
};
