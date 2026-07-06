import { Download, Eye, Pencil, Search, Trash2, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { exportToExcel } from "../lib/exportToExcel";
import { GameRecord, GameRecordInput, Player, PlayerStats, RawResult, SEAT_LABELS, SEAT_ORDER, Seat } from "../types";
import {
  combineDateAndTime,
  describeResultsByRank,
  formatDateTime,
  formatNumber,
  formatPoint,
  orderedBySeat,
  toDateInputValue,
  toTimeInputValue
} from "../utils/format";

type Props = {
  players: Player[];
  records: GameRecord[];
  stats: PlayerStats[];
  onUpdateRecord: (recordId: string, input: GameRecordInput) => string[];
  onDeleteRecord: (recordId: string) => void;
};

type ScoreState = Record<Seat, string>;

export function RecordsPage({ players, records, stats, onUpdateRecord, onDeleteRecord }: Props) {
  const [playerFilter, setPlayerFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [keyword, setKeyword] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const filteredRecords = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLocaleLowerCase("zh-CN");

    return records
      .slice()
      .sort((left, right) => new Date(right.playedAt).getTime() - new Date(left.playedAt).getTime())
      .filter((record) => {
        if (playerFilter !== "all" && !record.results.some((result) => result.playerId === playerFilter)) {
          return false;
        }

        const recordDate = toDateInputValue(record.playedAt);
        if (fromDate && recordDate < fromDate) {
          return false;
        }
        if (toDate && recordDate > toDate) {
          return false;
        }

        if (normalizedKeyword) {
          const text = [
            record.id,
            record.note ?? "",
            ...record.results.flatMap((result) => [
              result.playerNameSnapshot,
              SEAT_LABELS[result.seat],
              result.score.toString(),
              `${result.rank}位`
            ])
          ]
            .join(" ")
            .toLocaleLowerCase("zh-CN");
          return text.includes(normalizedKeyword);
        }

        return true;
      });
  }, [fromDate, keyword, playerFilter, records]);

  function confirmDelete(record: GameRecord) {
    if (window.confirm(`确认删除对局 ${record.id} 吗？此操作不可撤销。`)) {
      onDeleteRecord(record.id);
      if (expandedId === record.id) {
        setExpandedId(null);
      }
      if (editingId === record.id) {
        setEditingId(null);
      }
    }
  }

  return (
    <div className="stack">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>对局记录</h2>
            <p>按时间倒序排列，支持查看、修改、删除和筛选。</p>
          </div>
          <button type="button" className="secondary-button" onClick={() => exportToExcel(records, stats)}>
            <Download aria-hidden="true" size={18} />
            导出 Excel
          </button>
        </div>

        <div className="filter-grid">
          <label>
            <span>玩家</span>
            <select value={playerFilter} onChange={(event) => setPlayerFilter(event.target.value)}>
              <option value="all">全部玩家</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>起始日期</span>
            <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          </label>
          <label>
            <span>结束日期</span>
            <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </label>
          <label>
            <span>关键词</span>
            <div className="input-with-icon">
              <Search aria-hidden="true" size={17} />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="玩家、备注、ID、分数"
              />
            </div>
          </label>
        </div>
      </section>

      <section className="records-list">
        {filteredRecords.map((record) => {
          const expanded = expandedId === record.id;
          const editing = editingId === record.id;
          return (
            <article key={record.id} className="record-card">
              <div className="record-main">
                <div>
                  <div className="record-title">
                    <strong>{formatDateTime(record.playedAt)}</strong>
                    <span className="pill">{record.id}</span>
                  </div>
                  <p>{describeResultsByRank(record.results)}</p>
                  {record.note && <p className="muted">备注：{record.note}</p>}
                </div>
                <div className="button-cluster">
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setExpandedId(expanded ? null : record.id)}
                    title={expanded ? "收起详情" : "查看详情"}
                  >
                    {expanded ? <X aria-hidden="true" size={17} /> : <Eye aria-hidden="true" size={17} />}
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => {
                      setExpandedId(record.id);
                      setEditingId(editing ? null : record.id);
                    }}
                    title="修改记录"
                  >
                    <Pencil aria-hidden="true" size={17} />
                  </button>
                  <button
                    type="button"
                    className="icon-button danger"
                    onClick={() => confirmDelete(record)}
                    title="删除记录"
                  >
                    <Trash2 aria-hidden="true" size={17} />
                  </button>
                </div>
              </div>

              {expanded && (
                <div className="record-detail">
                  {editing ? (
                    <EditRecordForm
                      record={record}
                      onCancel={() => setEditingId(null)}
                      onSave={(input) => onUpdateRecord(record.id, input)}
                      onSaved={() => setEditingId(null)}
                    />
                  ) : (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>座位</th>
                            <th>玩家名</th>
                            <th>原始分数</th>
                            <th>排名</th>
                            <th>马点</th>
                            <th>成绩点</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orderedBySeat(record.results).map((result) => (
                            <tr key={result.seat}>
                              <td>{SEAT_LABELS[result.seat]}</td>
                              <td>{result.playerNameSnapshot}</td>
                              <td>{formatNumber(result.score)}</td>
                              <td>{result.rank}位</td>
                              <td>{formatPoint(result.uma)}</td>
                              <td>{formatPoint(result.adjustedPoint)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}

        {filteredRecords.length === 0 && <p className="empty-state">没有符合条件的对局记录。</p>}
      </section>
    </div>
  );
}

type EditRecordFormProps = {
  record: GameRecord;
  onCancel: () => void;
  onSave: (input: GameRecordInput) => string[];
  onSaved: () => void;
};

function EditRecordForm({ record, onCancel, onSave, onSaved }: EditRecordFormProps) {
  const initialScores = SEAT_ORDER.reduce((current, seat) => {
    const result = record.results.find((item) => item.seat === seat);
    return {
      ...current,
      [seat]: result ? String(result.score) : ""
    };
  }, {} as ScoreState);

  const [dateValue, setDateValue] = useState(toDateInputValue(record.playedAt));
  const [timeValue, setTimeValue] = useState(toTimeInputValue(record.playedAt));
  const [scores, setScores] = useState<ScoreState>(initialScores);
  const [note, setNote] = useState(record.note ?? "");
  const [errors, setErrors] = useState<string[]>([]);

  function submit(event: FormEvent) {
    event.preventDefault();

    if (!dateValue || !timeValue) {
      setErrors(["必须填写对局日期和时间。"]);
      return;
    }

    let playedAt = "";
    try {
      playedAt = combineDateAndTime(dateValue, timeValue);
    } catch {
      setErrors(["对局日期时间无效。"]);
      return;
    }

    const rawResults: RawResult[] = orderedBySeat(record.results).map((result) => {
      const value = scores[result.seat].trim();
      return {
        playerId: result.playerId,
        playerNameSnapshot: result.playerNameSnapshot,
        seat: result.seat,
        score: value === "" ? Number.NaN : Number(value)
      };
    });

    const nextErrors = onSave({
      playedAt,
      results: rawResults,
      note
    });

    if (nextErrors.length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSaved();
  }

  return (
    <form className="edit-record-form" onSubmit={submit}>
      <div className="filter-grid">
        <label>
          <span>日期</span>
          <input type="date" value={dateValue} onChange={(event) => setDateValue(event.target.value)} />
        </label>
        <label>
          <span>时间</span>
          <input type="time" value={timeValue} onChange={(event) => setTimeValue(event.target.value)} />
        </label>
      </div>

      <div className="score-grid compact">
        {orderedBySeat(record.results).map((result) => (
          <label key={result.seat} className="score-input-card">
            <span className="seat-badge">{SEAT_LABELS[result.seat]}</span>
            <strong>{result.playerNameSnapshot}</strong>
            <input
              type="number"
              min="0"
              step="1000"
              inputMode="numeric"
              value={scores[result.seat]}
              onChange={(event) =>
                setScores((current) => ({
                  ...current,
                  [result.seat]: event.target.value
                }))
              }
            />
          </label>
        ))}
      </div>

      <label className="full-label">
        <span>备注</span>
        <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} />
      </label>

      {errors.length > 0 && (
        <div className="error-box">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      )}

      <div className="toolbar">
        <button type="submit" className="primary-button">
          保存修改
        </button>
        <button type="button" className="secondary-button" onClick={onCancel}>
          取消
        </button>
      </div>
    </form>
  );
}
