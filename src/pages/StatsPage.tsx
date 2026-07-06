import { Download, Filter } from "lucide-react";
import { useMemo, useState } from "react";
import { exportToExcel } from "../lib/exportToExcel";
import { GameRecord, PlayerStats } from "../types";
import { formatPoint, formatRate } from "../utils/format";

type Props = {
  records: GameRecord[];
  stats: PlayerStats[];
  minimumLeaderboardGames: number;
  onMinimumLeaderboardGamesChange: (value: number) => void;
};

type Leaderboard = {
  title: string;
  rows: PlayerStats[];
  value: (stat: PlayerStats) => string;
};

type RecentWindowOption = 5 | 10 | 20 | "all";

export function StatsPage({
  records,
  stats,
  minimumLeaderboardGames,
  onMinimumLeaderboardGamesChange
}: Props) {
  const [recentWindow, setRecentWindow] = useState<RecentWindowOption>(5);

  const playedStats = stats.filter((stat) => stat.totalGames > 0);
  const averageStats = playedStats.filter((stat) => stat.totalGames >= minimumLeaderboardGames);

  const leaderboards = useMemo<Leaderboard[]>(() => {
    const byAverageRank = averageStats
      .slice()
      .sort((left, right) => left.averageRank - right.averageRank);
    const byRank1Rate = averageStats
      .slice()
      .sort((left, right) => right.rank1Rate - left.rank1Rate);
    const byGames = playedStats.slice().sort((left, right) => right.totalGames - left.totalGames);

    return [
      {
        title: "平均排名排行榜",
        rows: byAverageRank,
        value: (stat) => stat.averageRank.toFixed(2)
      },
      {
        title: "1位率排行榜",
        rows: byRank1Rate,
        value: (stat) => formatRate(stat.rank1Rate)
      },
      {
        title: "对局数排行榜",
        rows: byGames,
        value: (stat) => `${stat.totalGames} 局`
      }
    ];
  }, [averageStats, playedStats]);

  const recentRows = playedStats
    .map((stat) => ({
      stat,
      recent:
        recentWindow === "all"
          ? {
              games: stat.totalGames,
              averageRank: stat.averageRank,
              totalAdjustedPoint: stat.totalAdjustedPoint,
              averageAdjustedPoint: stat.averageAdjustedPoint
            }
          : stat.recent[recentWindow]
    }))
    .filter((item) => item.recent.games > 0)
    .sort((left, right) => right.recent.totalAdjustedPoint - left.recent.totalAdjustedPoint);

  return (
    <div className="stack">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>数据</h2>
            <p>总数据、最近表现和排行榜都按玩家 ID 汇总，历史名字快照仍保留在记录里。</p>
          </div>
          <button type="button" className="secondary-button" onClick={() => exportToExcel(records, stats)}>
            <Download aria-hidden="true" size={18} />
            导出 Excel
          </button>
        </div>

        <div className="filter-grid compact-filter">
          <label>
            <span>平均榜最低对局数</span>
            <div className="input-with-icon">
              <Filter aria-hidden="true" size={17} />
              <input
                type="number"
                min="0"
                step="1"
                value={minimumLeaderboardGames}
                onChange={(event) => onMinimumLeaderboardGamesChange(Number(event.target.value))}
              />
            </div>
          </label>
          <label>
            <span>最近表现范围</span>
            <select
              value={recentWindow}
              onChange={(event) => {
                const value = event.target.value;
                setRecentWindow(value === "all" ? "all" : (Number(value) as 5 | 10 | 20));
              }}
            >
              <option value="all">全部</option>
              <option value={5}>最近 5 局</option>
              <option value={10}>最近 10 局</option>
              <option value={20}>最近 20 局</option>
            </select>
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>玩家总数据</h2>
            <p>平均类数据在玩家无对局时显示为 0 或空值。</p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>玩家</th>
                <th>局数</th>
                <th>1位</th>
                <th>2位</th>
                <th>3位</th>
                <th>平均排名</th>
                <th>1位率</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((stat) => (
                <tr key={stat.playerId}>
                  <td>
                    <strong>{stat.playerName}</strong>
                  </td>
                  <td>{stat.totalGames}</td>
                  <td>{stat.rank1Count}</td>
                  <td>{stat.rank2Count}</td>
                  <td>{stat.rank3Count}</td>
                  <td>{stat.totalGames ? stat.averageRank.toFixed(2) : "-"}</td>
                  <td>{formatRate(stat.rank1Rate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>最近表现</h2>
            <p>按每名玩家最近参与的对局统计，不受其他玩家对局影响。</p>
          </div>
          <span className="pill">{recentWindow === "all" ? "全部" : `最近 ${recentWindow} 局`}</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>玩家</th>
                <th>样本局数</th>
                <th>平均排名</th>
                <th>总成绩点</th>
                <th>平均成绩点</th>
              </tr>
            </thead>
            <tbody>
              {recentRows.map(({ stat, recent }) => (
                <tr key={stat.playerId}>
                  <td>{stat.playerName}</td>
                  <td>{recent.games}</td>
                  <td>{recent.averageRank.toFixed(2)}</td>
                  <td>{formatPoint(recent.totalAdjustedPoint)}</td>
                  <td>{formatPoint(recent.averageAdjustedPoint)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="leaderboard-grid">
        {leaderboards.map((leaderboard) => (
          <article key={leaderboard.title} className="leaderboard-card">
            <h2>{leaderboard.title}</h2>
            <ol>
              {leaderboard.rows.slice(0, 10).map((stat, index) => (
                <li key={stat.playerId}>
                  <span className="rank-number">{index + 1}</span>
                  <span className="leader-name">
                    {stat.playerName}
                    {stat.totalGames < minimumLeaderboardGames && (
                      <small className="sample-warning">样本少</small>
                    )}
                  </span>
                  <span className="leader-value">
                    {leaderboard.value(stat)}
                    <small>{stat.totalGames} 局</small>
                  </span>
                </li>
              ))}
            </ol>
            {leaderboard.rows.length === 0 && <p className="empty-state">暂无满足最低对局数的玩家。</p>}
          </article>
        ))}
      </section>
    </div>
  );
}
