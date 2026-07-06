import { Download, RotateCcw, Trash2 } from "lucide-react";
import { exportToExcel } from "../lib/exportToExcel";
import { GameRecord, Player, PlayerStats } from "../types";

type Props = {
  players: Player[];
  records: GameRecord[];
  stats: PlayerStats[];
  minimumLeaderboardGames: number;
  onMinimumLeaderboardGamesChange: (value: number) => void;
  onResetSamples: () => void;
  onClearAllData: () => void;
};

export function SettingsPage({
  players,
  records,
  stats,
  minimumLeaderboardGames,
  onMinimumLeaderboardGamesChange,
  onResetSamples,
  onClearAllData
}: Props) {
  function resetSamples() {
    if (window.confirm("确认清空当前数据并重新写入测试玩家和测试对局吗？")) {
      onResetSamples();
    }
  }

  function clearAllData() {
    if (window.confirm("确认清除所有数据吗？这会删除全部雀士和对局记录，且无法撤销。")) {
      onClearAllData();
    }
  }

  return (
    <div className="stack">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>设置</h2>
            <p>所有数据保存在当前浏览器本地，不需要后端服务器。</p>
          </div>
        </div>

        <div className="summary-row">
          <div>
            <span>玩家数</span>
            <strong>{players.length}</strong>
          </div>
          <div>
            <span>对局记录</span>
            <strong>{records.length}</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>排行榜设置</h2>
            <p>平均排名和 1位率排行榜会使用这个最低对局数。</p>
          </div>
        </div>
        <label className="setting-row">
          <span>平均榜最低对局数</span>
          <input
            type="number"
            min="0"
            step="1"
            value={minimumLeaderboardGames}
            onChange={(event) => onMinimumLeaderboardGamesChange(Number(event.target.value))}
          />
        </label>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>数据操作</h2>
            <p>重置测试数据会覆盖当前浏览器里的玩家和对局记录。</p>
          </div>
        </div>
        <div className="toolbar">
          <button type="button" className="secondary-button" onClick={() => exportToExcel(records, stats)}>
            <Download aria-hidden="true" size={18} />
            导出 Excel
          </button>
          <button type="button" className="danger-button" onClick={resetSamples}>
            <RotateCcw aria-hidden="true" size={18} />
            重置测试数据
          </button>
          <button type="button" className="danger-button" onClick={clearAllData}>
            <Trash2 aria-hidden="true" size={18} />
            清除所有数据
          </button>
        </div>
      </section>
    </div>
  );
}
