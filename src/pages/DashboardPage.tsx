import { ArrowRight, BarChart3, Download, PlusCircle, Trophy, UsersRound } from "lucide-react";
import { exportToExcel } from "../lib/exportToExcel";
import { GameRecord, Player, PlayerStats } from "../types";
import {
  describeResultsByRank,
  formatDateTime,
  formatPoint
} from "../utils/format";

type Props = {
  players: Player[];
  records: GameRecord[];
  stats: PlayerStats[];
  onNavigate: (page: "players" | "new-game" | "records" | "stats") => void;
};

export function DashboardPage({ players, records, stats, onNavigate }: Props) {
  const activePlayers = players.filter((player) => player.active).length;
  const leader = stats
    .filter((stat) => stat.totalGames > 0)
    .slice()
    .sort((left, right) => right.totalAdjustedPoint - left.totalAdjustedPoint)[0];
  const latest = records
    .slice()
    .sort((left, right) => new Date(right.playedAt).getTime() - new Date(left.playedAt).getTime())[0];

  return (
    <div className="stack">
      <section className="dashboard-grid">
        <button type="button" className="metric-tile action-tile" onClick={() => onNavigate("new-game")}>
          <PlusCircle aria-hidden="true" />
          <span>新建对局</span>
          <small>选择三名玩家，随机东南西</small>
        </button>
        <button type="button" className="metric-tile" onClick={() => onNavigate("players")}>
          <UsersRound aria-hidden="true" />
          <span>{activePlayers}</span>
          <small>在店雀士 / 共 {players.length} 名</small>
        </button>
        <button type="button" className="metric-tile" onClick={() => onNavigate("records")}>
          <BarChart3 aria-hidden="true" />
          <span>{records.length}</span>
          <small>已保存对局</small>
        </button>
        <button type="button" className="metric-tile" onClick={() => onNavigate("stats")}>
          <Trophy aria-hidden="true" />
          <span>{leader ? leader.playerName : "暂无"}</span>
          <small>
            {leader ? `总成绩点 ${formatPoint(leader.totalAdjustedPoint)}` : "保存对局后生成排行榜"}
          </small>
        </button>
      </section>

      <section className="toolbar">
        <button type="button" className="primary-button" onClick={() => onNavigate("new-game")}>
          <PlusCircle aria-hidden="true" size={18} />
          录入新对局
        </button>
        <button type="button" className="secondary-button" onClick={() => exportToExcel(records, stats)}>
          <Download aria-hidden="true" size={18} />
          导出 Excel
        </button>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>最近一局</h2>
            <p>最新记录会按时间倒序显示在对局记录页。</p>
          </div>
          <button type="button" className="ghost-button" onClick={() => onNavigate("records")}>
            查看全部
            <ArrowRight aria-hidden="true" size={17} />
          </button>
        </div>

        {latest ? (
          <div className="latest-record">
            <div>
              <strong>{formatDateTime(latest.playedAt)}</strong>
              <p>{describeResultsByRank(latest.results)}</p>
              {latest.note && <p className="muted">备注：{latest.note}</p>}
            </div>
            <span className="pill">ID {latest.id}</span>
          </div>
        ) : (
          <p className="empty-state">暂无对局。可以先使用内置测试数据，也可以直接新建对局。</p>
        )}
      </section>
    </div>
  );
}
