import * as XLSX from "xlsx";
import { GameRecord, PlayerStats, SEAT_LABELS } from "../types";
import { sortResultsBySeat } from "./mahjong";

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function formatDateParts(iso: string) {
  const date = new Date(iso);
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  };
}

function todayCompact(): string {
  const date = new Date();
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

export function exportToExcel(records: GameRecord[], stats: PlayerStats[]): void {
  const recordRows = records
    .slice()
    .sort((left, right) => new Date(right.playedAt).getTime() - new Date(left.playedAt).getTime())
    .flatMap((record) => {
      const parts = formatDateParts(record.playedAt);
      return sortResultsBySeat(record.results).map((result) => ({
        "对局 ID": record.id,
        日期: parts.date,
        时间: parts.time,
        玩家名: result.playerNameSnapshot,
        座位: SEAT_LABELS[result.seat],
        原始分数: result.score,
        排名: result.rank,
        马点: result.uma,
        成绩点: result.adjustedPoint,
        备注: record.note ?? ""
      }));
    });

  const statsRows = stats.map((stat) => ({
    玩家名: stat.playerName,
    总对局数: stat.totalGames,
    "1位次数": stat.rank1Count,
    "2位次数": stat.rank2Count,
    "3位次数": stat.rank3Count,
    平均排名: Number(stat.averageRank.toFixed(2)),
    "1位率": Number((stat.rank1Rate * 100).toFixed(2)),
    "2位率": Number((stat.rank2Rate * 100).toFixed(2)),
    "3位率": Number((stat.rank3Rate * 100).toFixed(2)),
    原始总分: stat.totalScore,
    平均原始分: Number(stat.averageScore.toFixed(0)),
    总马点: stat.totalUma,
    平均马点: Number(stat.averageUma.toFixed(2)),
    总成绩点: Number(stat.totalAdjustedPoint.toFixed(2)),
    平均成绩点: Number(stat.averageAdjustedPoint.toFixed(2))
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(recordRows), "对局记录");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(statsRows), "玩家统计");
  XLSX.writeFile(workbook, `three-player-mahjong-score-records-${todayCompact()}.xlsx`);
}
