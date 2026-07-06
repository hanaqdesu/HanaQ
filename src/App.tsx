import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Home,
  ListChecks,
  PlusCircle,
  Settings,
  UsersRound
} from "lucide-react";
import { DashboardPage } from "./pages/DashboardPage";
import { NewGamePage } from "./pages/NewGamePage";
import { PlayersPage } from "./pages/PlayersPage";
import { RecordsPage } from "./pages/RecordsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { StatsPage } from "./pages/StatsPage";
import { calculatePlayerStats, calculateRanks, validateScores } from "./lib/mahjong";
import { createId } from "./lib/ids";
import { loadData, resetToSampleData, saveData } from "./lib/storage";
import { isCloudConfigured, loadCloudData, saveCloudData, subscribeToCloudData } from "./lib/cloudStorage";
import { AppData, GameRecord, GameRecordInput, Player } from "./types";

type PageId = "dashboard" | "players" | "new-game" | "records" | "stats" | "settings";
type CloudStatus = "local" | "connecting" | "connected" | "saving" | "error";

const pages: Array<{ id: PageId; label: string; icon: typeof Home }> = [
  { id: "dashboard", label: "首页", icon: Home },
  { id: "players", label: "雀士", icon: UsersRound },
  { id: "new-game", label: "新建对局", icon: PlusCircle },
  { id: "records", label: "对局记录", icon: ListChecks },
  { id: "stats", label: "数据", icon: BarChart3 },
  { id: "settings", label: "设置", icon: Settings }
];

function normalizedName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase("zh-CN");
}

function hasDuplicateName(players: Player[], name: string, ignoredId?: string): boolean {
  const normalized = normalizedName(name);
  return players.some((player) => player.id !== ignoredId && normalizedName(player.name) === normalized);
}

function validateRecordInput(input: GameRecordInput): string[] {
  const errors: string[] = [];
  if (input.results.length !== 3 || new Set(input.results.map((result) => result.playerId)).size !== 3) {
    errors.push("每局必须刚好包含三名不同玩家。");
  }

  const scoreResult = validateScores(input.results.map((result) => result.score));
  errors.push(...scoreResult.errors);

  if (!Number.isFinite(new Date(input.playedAt).getTime())) {
    errors.push("对局日期时间无效。");
  }

  return errors;
}

export default function App() {
  const [page, setPage] = useState<PageId>("dashboard");
  const [data, setData] = useState<AppData>(() => loadData());
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>(() =>
    isCloudConfigured() ? "connecting" : "local"
  );
  const [cloudMessage, setCloudMessage] = useState(() =>
    isCloudConfigured() ? "正在连接云端数据" : "未配置云端数据库，当前使用本地模式"
  );
  const cloudReadyRef = useRef(false);
  const skipNextCloudSaveRef = useRef(false);

  useEffect(() => {
    if (!isCloudConfigured()) {
      return;
    }

    let cancelled = false;
    let unsubscribe: () => void = () => undefined;
    setCloudStatus("connecting");
    setCloudMessage("正在连接云端数据");

    loadCloudData()
      .then((cloudData) => {
        if (cancelled) {
          return;
        }

        skipNextCloudSaveRef.current = true;
        cloudReadyRef.current = true;
        setData(cloudData);
        saveData(cloudData);
        setCloudStatus("connected");
        setCloudMessage("云端同步已连接");

        unsubscribe = subscribeToCloudData(
          (remoteData) => {
            if (cancelled) {
              return;
            }
            skipNextCloudSaveRef.current = true;
            setData(remoteData);
            saveData(remoteData);
            setCloudStatus("connected");
            setCloudMessage("已收到云端更新");
          },
          (message) => {
            setCloudStatus("error");
            setCloudMessage(message);
          }
        );
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        setCloudStatus("error");
        setCloudMessage(error instanceof Error ? error.message : "云端数据连接失败，当前使用本地缓存。");
      });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    saveData(data);

    if (!isCloudConfigured() || !cloudReadyRef.current) {
      return;
    }

    if (skipNextCloudSaveRef.current) {
      skipNextCloudSaveRef.current = false;
      return;
    }

    setCloudStatus("saving");
    setCloudMessage("正在同步到云端");
    void saveCloudData(data)
      .then(() => {
        setCloudStatus("connected");
        setCloudMessage("云端同步已连接");
      })
      .catch((error: unknown) => {
        setCloudStatus("error");
        setCloudMessage(error instanceof Error ? error.message : "云端保存失败。");
      });
  }, [data]);

  const stats = useMemo(() => calculatePlayerStats(data.players, data.records), [data.players, data.records]);

  function addPlayer(name: string): string | null {
    const trimmed = name.trim();
    if (!trimmed) {
      return "玩家名字不可为空。";
    }
    if (hasDuplicateName(data.players, trimmed)) {
      return "已有同名玩家，请使用不同名字。";
    }

    const now = new Date().toISOString();
    setData((current) => ({
      ...current,
      players: [
        ...current.players,
        {
          id: createId("player"),
          name: trimmed,
          active: true,
          createdAt: now
        }
      ]
    }));
    return null;
  }

  function updatePlayerName(playerId: string, name: string): string | null {
    const trimmed = name.trim();
    if (!trimmed) {
      return "玩家名字不可为空。";
    }
    if (hasDuplicateName(data.players, trimmed, playerId)) {
      return "已有同名玩家，请使用不同名字。";
    }

    setData((current) => ({
      ...current,
      players: current.players.map((player) => (player.id === playerId ? { ...player, name: trimmed } : player))
    }));
    return null;
  }

  function deletePlayer(playerId: string): string | null {
    setData((current) => ({
      ...current,
      players: current.players.filter((player) => player.id !== playerId),
      records: current.records.filter((record) =>
        record.results.every((result) => result.playerId !== playerId)
      )
    }));

    return null;
  }

  function setPlayerInStore(playerId: string, inStore: boolean): void {
    setData((current) => ({
      ...current,
      players: current.players.map((player) =>
        player.id === playerId ? { ...player, active: inStore } : player
      )
    }));
  }

  function createRecord(input: GameRecordInput): string[] {
    const errors = validateRecordInput(input);
    if (errors.length > 0) {
      return errors;
    }

    const now = new Date().toISOString();
    const record: GameRecord = {
      id: createId("game"),
      playedAt: input.playedAt,
      results: calculateRanks(input.results),
      note: input.note?.trim() || undefined,
      createdAt: now,
      updatedAt: now
    };

    setData((current) => ({
      ...current,
      records: [record, ...current.records]
    }));
    setPage("records");
    return [];
  }

  function updateRecord(recordId: string, input: GameRecordInput): string[] {
    const errors = validateRecordInput(input);
    if (errors.length > 0) {
      return errors;
    }

    setData((current) => ({
      ...current,
      records: current.records.map((record) =>
        record.id === recordId
          ? {
              ...record,
              playedAt: input.playedAt,
              results: calculateRanks(input.results),
              note: input.note?.trim() || undefined,
              updatedAt: new Date().toISOString()
            }
          : record
      )
    }));
    return [];
  }

  function deleteRecord(recordId: string): void {
    setData((current) => ({
      ...current,
      records: current.records.filter((record) => record.id !== recordId)
    }));
  }

  function resetSamples(): void {
    setData(resetToSampleData());
    setPage("dashboard");
  }

  function clearAllData(): void {
    setData((current) => ({
      ...current,
      players: [],
      records: []
    }));
    setPage("dashboard");
  }

  function updateMinimumLeaderboardGames(value: number): void {
    setData((current) => ({
      ...current,
      settings: {
        ...current.settings,
        minimumLeaderboardGames: Math.max(0, Math.floor(value))
      }
    }));
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Three Player Mahjong Score Suite</p>
          <h1>三麻计分板</h1>
          <p className="author-line">Designed and built by hanaq</p>
        </div>
        <div className="header-meta">
          <span>{data.players.filter((player) => player.active).length} 名在店雀士</span>
          <span className={`sync-pill ${cloudStatus}`}>{cloudMessage}</span>
        </div>
      </header>

      <nav className="tabbar" aria-label="主导航">
        {pages.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={`tab-button ${page === item.id ? "active" : ""}`}
              onClick={() => setPage(item.id)}
            >
              <Icon aria-hidden="true" size={19} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <main>
        {page === "dashboard" && (
          <DashboardPage
            players={data.players}
            records={data.records}
            stats={stats}
            onNavigate={setPage}
          />
        )}
        {page === "players" && (
          <PlayersPage
            players={data.players}
            records={data.records}
            stats={stats}
            onAddPlayer={addPlayer}
            onUpdatePlayerName={updatePlayerName}
            onDeletePlayer={deletePlayer}
            onSetPlayerInStore={setPlayerInStore}
          />
        )}
        {page === "new-game" && (
          <NewGamePage players={data.players} onCreateRecord={createRecord} />
        )}
        {page === "records" && (
          <RecordsPage
            players={data.players}
            records={data.records}
            stats={stats}
            onUpdateRecord={updateRecord}
            onDeleteRecord={deleteRecord}
          />
        )}
        {page === "stats" && (
          <StatsPage
            records={data.records}
            stats={stats}
            minimumLeaderboardGames={data.settings.minimumLeaderboardGames}
            onMinimumLeaderboardGamesChange={updateMinimumLeaderboardGames}
          />
        )}
        {page === "settings" && (
          <SettingsPage
            players={data.players}
            records={data.records}
            stats={stats}
            minimumLeaderboardGames={data.settings.minimumLeaderboardGames}
            onMinimumLeaderboardGamesChange={updateMinimumLeaderboardGames}
            onResetSamples={resetSamples}
            onClearAllData={clearAllData}
          />
        )}
      </main>
    </div>
  );
}
