import { RotateCcw, Save, Shuffle } from "lucide-react";
import { useMemo, useState } from "react";
import {
  assignRandomSeats,
  calculateRanks,
  sortResultsBySeat,
  validateScores
} from "../lib/mahjong";
import { GameRecordInput, Player, RawResult, SEAT_LABELS, SEAT_ORDER, Seat, SeatAssignment } from "../types";
import { formatPoint } from "../utils/format";

type Props = {
  players: Player[];
  onCreateRecord: (input: GameRecordInput) => string[];
};

type ScoreInputs = Record<Seat, string>;

const emptyScores: ScoreInputs = {
  east: "",
  south: "",
  west: ""
};

export function NewGamePage({ players, onCreateRecord }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [assignments, setAssignments] = useState<SeatAssignment[] | null>(null);
  const [scores, setScores] = useState<ScoreInputs>(emptyScores);
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const activePlayers = players.filter((player) => player.active);
  const playerById = useMemo(() => new Map(players.map((player) => [player.id, player])), [players]);

  const orderedAssignments = useMemo(() => {
    if (!assignments) {
      return [];
    }
    return SEAT_ORDER.map((seat) => assignments.find((assignment) => assignment.seat === seat)).filter(
      Boolean
    ) as SeatAssignment[];
  }, [assignments]);

  const preview = useMemo(() => {
    if (!assignments) {
      return null;
    }
    const raw = buildRawResults();
    const validation = validateScores(raw.map((result) => result.score));
    if (!validation.valid) {
      return null;
    }
    return sortResultsBySeat(calculateRanks(raw));
  }, [assignments, scores]);

  function togglePlayer(playerId: string) {
    setErrors([]);
    setAssignments(null);
    setScores(emptyScores);
    setSelectedIds((current) => {
      if (current.includes(playerId)) {
        return current.filter((id) => id !== playerId);
      }
      if (current.length >= 3) {
        return current;
      }
      return [...current, playerId];
    });
  }

  function randomizeSeats() {
    if (selectedIds.length !== 3) {
      setErrors(["必须先选择三名玩家。"]);
      return;
    }
    try {
      setAssignments(assignRandomSeats(selectedIds));
      setScores(emptyScores);
      setErrors([]);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "座位分配失败。"]);
    }
  }

  function buildRawResults(): RawResult[] {
    if (!assignments) {
      return [];
    }

    return assignments.map((assignment) => {
      const value = scores[assignment.seat].trim();
      return {
        playerId: assignment.playerId,
        playerNameSnapshot: playerById.get(assignment.playerId)?.name ?? "未知玩家",
        seat: assignment.seat,
        score: value === "" ? Number.NaN : Number(value)
      };
    });
  }

  function fillScores(values: ScoreInputs) {
    setScores(values);
    setErrors([]);
  }

  function saveRecord() {
    if (!assignments) {
      setErrors(["请先随机分配座位。"]);
      return;
    }

    const input: GameRecordInput = {
      playedAt: new Date().toISOString(),
      results: buildRawResults(),
      note
    };
    const nextErrors = onCreateRecord(input);
    if (nextErrors.length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSelectedIds([]);
    setAssignments(null);
    setScores(emptyScores);
    setNote("");
    setErrors([]);
  }

  return (
    <div className="stack">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>新建对局</h2>
            <p>固定三人参局，座位只使用东、南、西。</p>
          </div>
          <span className="pill">{selectedIds.length}/3 名玩家</span>
        </div>

        {activePlayers.length < 3 && (
          <p className="error-box">在店雀士少于 3 名，请先到雀士页面确认进店。</p>
        )}

        <div className="player-picker">
          {activePlayers.map((player) => {
            const checked = selectedIds.includes(player.id);
            const disabled = !checked && selectedIds.length >= 3;
            return (
              <button
                key={player.id}
                type="button"
                className={`select-card ${checked ? "selected" : ""}`}
                onClick={() => togglePlayer(player.id)}
                disabled={disabled}
              >
                <span>{player.name}</span>
                <small>{checked ? "已选择" : disabled ? "已满 3 人" : "点按选择"}</small>
              </button>
            );
          })}
        </div>

        <div className="toolbar">
          <button type="button" className="primary-button" onClick={randomizeSeats}>
            <Shuffle aria-hidden="true" size={18} />
            随机分配座位
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setSelectedIds([]);
              setAssignments(null);
              setScores(emptyScores);
              setErrors([]);
            }}
          >
            <RotateCcw aria-hidden="true" size={18} />
            清空
          </button>
        </div>
      </section>

      {assignments && (
        <section className="panel">
          <div className="section-heading">
            <div>
              <h2>录入最终点数</h2>
              <p>三人总分必须为 105000，每人分数必须是 1000 的倍数。</p>
            </div>
          </div>

          <div className="score-grid">
            {orderedAssignments.map((assignment) => (
              <label key={assignment.seat} className="score-input-card">
                <span className="seat-badge">{SEAT_LABELS[assignment.seat]}</span>
                <strong>{playerById.get(assignment.playerId)?.name ?? "未知玩家"}</strong>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  inputMode="numeric"
                  value={scores[assignment.seat]}
                  onChange={(event) =>
                    setScores((current) => ({
                      ...current,
                      [assignment.seat]: event.target.value
                    }))
                  }
                  placeholder="35000"
                />
              </label>
            ))}
          </div>

          <div className="quick-fill">
            <button
              type="button"
              className="ghost-button"
              onClick={() => fillScores({ east: "35000", south: "35000", west: "35000" })}
            >
              35000 / 35000 / 35000
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => fillScores({ east: "40000", south: "35000", west: "30000" })}
            >
              40000 / 35000 / 30000
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => fillScores({ east: "40000", south: "40000", west: "25000" })}
            >
              40000 / 40000 / 25000
            </button>
          </div>

          <label className="full-label">
            <span>备注（可选）</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="例如：周末练习局"
              rows={3}
            />
          </label>

          {preview && (
            <div className="preview-box">
              {preview.map((result) => (
                <div key={result.seat}>
                  <span>
                    {SEAT_LABELS[result.seat]} {result.playerNameSnapshot}
                  </span>
                  <strong>{result.rank}位</strong>
                  <span>马点 {formatPoint(result.uma)}</span>
                  <span>成绩点 {formatPoint(result.adjustedPoint)}</span>
                </div>
              ))}
            </div>
          )}

          {errors.length > 0 && (
            <div className="error-box">
              {errors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          )}

          <div className="toolbar">
            <button type="button" className="primary-button" onClick={saveRecord}>
              <Save aria-hidden="true" size={18} />
              保存对局
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
