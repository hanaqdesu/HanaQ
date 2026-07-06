import { CheckCircle2, DoorClosed, DoorOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { GameRecord, Player, PlayerStats } from "../types";
import { formatRate } from "../utils/format";

type Props = {
  players: Player[];
  records: GameRecord[];
  stats: PlayerStats[];
  onAddPlayer: (name: string) => string | null;
  onUpdatePlayerName: (playerId: string, name: string) => string | null;
  onDeletePlayer: (playerId: string) => string | null;
  onSetPlayerInStore: (playerId: string, inStore: boolean) => void;
};

export function PlayersPage({
  players,
  records,
  stats,
  onAddPlayer,
  onUpdatePlayerName,
  onDeletePlayer,
  onSetPlayerInStore
}: Props) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const statsByPlayer = useMemo(
    () => new Map(stats.map((stat) => [stat.playerId, stat])),
    [stats]
  );

  function hasHistory(playerId: string): boolean {
    return records.some((record) => record.results.some((result) => result.playerId === playerId));
  }

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    const error = onAddPlayer(name);
    if (error) {
      setMessage(error);
      return;
    }
    setName("");
    setMessage("玩家已新增。");
  }

  function startEditing(player: Player) {
    setEditingId(player.id);
    setEditingName(player.name);
    setMessage(null);
  }

  function saveEditing(event: FormEvent) {
    event.preventDefault();
    if (!editingId) {
      return;
    }
    const error = onUpdatePlayerName(editingId, editingName);
    if (error) {
      setMessage(error);
      return;
    }
    setEditingId(null);
    setEditingName("");
    setMessage("玩家名字已更新，历史记录会保留当时名字快照。");
  }

  function removePlayer(player: Player) {
    const history = hasHistory(player.id);
    const confirmed = window.confirm(
      history
        ? "确认彻底删除该玩家吗？这会同时删除所有包含该玩家的历史对局和统计数据。"
        : "确认删除该玩家吗？"
    );
    if (!confirmed) {
      return;
    }
    const notice = onDeletePlayer(player.id);
    setMessage(notice ?? "玩家及相关数据已删除。");
  }

  function setInStore(player: Player, inStore: boolean) {
    onSetPlayerInStore(player.id, inStore);
    setMessage(`${player.name} 已${inStore ? "进店" : "退店"}。`);
  }

  return (
    <div className="stack">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>雀士</h2>
          </div>
        </div>

        <form className="inline-form" onSubmit={handleAdd}>
          <label>
            <span>新增玩家</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="输入玩家名字"
              autoComplete="off"
            />
          </label>
          <button type="submit" className="primary-button">
            <Plus aria-hidden="true" size={18} />
            新增
          </button>
        </form>

        {message && <p className="notice">{message}</p>}
      </section>

      <section className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>玩家</th>
                <th>店内状态</th>
                <th>总局数</th>
                <th>1位率</th>
                <th>平均排名</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => {
                const playerStats = statsByPlayer.get(player.id);
                return (
                  <tr key={player.id}>
                    <td>
                      {editingId === player.id ? (
                        <form className="edit-name-form" onSubmit={saveEditing}>
                          <input
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                            autoFocus
                          />
                          <button type="submit" className="icon-button" title="保存名字">
                            <CheckCircle2 aria-hidden="true" size={18} />
                          </button>
                        </form>
                      ) : (
                        <span className="player-name-with-light">
                          <span
                            className={`store-light ${player.active ? "in" : "out"}`}
                            aria-label={player.active ? "在店里" : "不在店里"}
                            title={player.active ? "在店里" : "不在店里"}
                          />
                          <strong>{player.name}</strong>
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`status ${player.active ? "active" : "inactive"}`}>
                        {player.active ? "在店" : "不在店"}
                      </span>
                    </td>
                    <td>{playerStats?.totalGames ?? 0}</td>
                    <td>{formatRate(playerStats?.rank1Rate ?? 0)}</td>
                    <td>{playerStats?.averageRank ? playerStats.averageRank.toFixed(2) : "-"}</td>
                    <td>
                      <div className="button-cluster">
                        <button type="button" className="icon-button" onClick={() => startEditing(player)} title="编辑名字">
                          <Pencil aria-hidden="true" size={17} />
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => setInStore(player, true)}
                          disabled={player.active}
                          title="进店"
                        >
                          <DoorOpen aria-hidden="true" size={17} />
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => setInStore(player, false)}
                          disabled={!player.active}
                          title="退店"
                        >
                          <DoorClosed aria-hidden="true" size={17} />
                        </button>
                        <button
                          type="button"
                          className="icon-button danger"
                          onClick={() => removePlayer(player)}
                          title="删除玩家"
                        >
                          <Trash2 aria-hidden="true" size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {players.length === 0 && <p className="empty-state">暂无玩家，请先新增玩家或重置测试数据。</p>}
      </section>
    </div>
  );
}
