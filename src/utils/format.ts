import { GameResult, SEAT_LABELS } from "../types";
import { sortResultsByRank, sortResultsBySeat } from "../lib/mahjong";

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("zh-CN").format(value);
}

export function formatPoint(value: number): string {
  if (Object.is(value, -0)) {
    return "0";
  }
  return value > 0 ? `+${value.toFixed(1).replace(".0", "")}` : value.toFixed(1).replace(".0", "");
}

export function formatRate(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(iso));
}

export function toDateInputValue(iso: string): string {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toTimeInputValue(iso: string): string {
  const date = new Date(iso);
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
}

export function combineDateAndTime(dateValue: string, timeValue: string): string {
  return new Date(`${dateValue}T${timeValue}:00`).toISOString();
}

export function describeResultsByRank(results: GameResult[]): string {
  return sortResultsByRank(results)
    .map((result) => `${result.rank}位 ${result.playerNameSnapshot} ${formatPoint(result.adjustedPoint)}`)
    .join(" / ");
}

export function describeSeat(result: GameResult): string {
  return `${SEAT_LABELS[result.seat]} ${result.playerNameSnapshot}`;
}

export function orderedBySeat(results: GameResult[]): GameResult[] {
  return sortResultsBySeat(results);
}
