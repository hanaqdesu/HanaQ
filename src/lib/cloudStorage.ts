import { createClient, RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { AppData } from "../types";
import { sampleData } from "../data/sampleData";
import { cloneData, normalizeData } from "./storage";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const ROOM_ID = (import.meta.env.VITE_SUPABASE_ROOM_ID as string | undefined) ?? "main";
const TABLE_NAME = "mahjong_app_state";

type StateRow = {
  room_id: string;
  data: AppData;
  updated_at: string;
};

let client: SupabaseClient | null = null;

export function isCloudConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function getClient(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase 环境变量未配置。");
  }

  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  return client;
}

function rowFromData(data: AppData): StateRow {
  return {
    room_id: ROOM_ID,
    data: normalizeData(data),
    updated_at: new Date().toISOString()
  };
}

export async function loadCloudData(): Promise<AppData> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("data")
    .eq("room_id", ROOM_ID)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data?.data) {
    return normalizeData(data.data as AppData);
  }

  const initialData = cloneData(sampleData);
  await saveCloudData(initialData);
  return initialData;
}

export async function saveCloudData(data: AppData): Promise<void> {
  const supabase = getClient();
  const { error } = await supabase.from(TABLE_NAME).upsert(rowFromData(data), {
    onConflict: "room_id"
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function resetCloudData(): Promise<AppData> {
  const fresh = cloneData(sampleData);
  await saveCloudData(fresh);
  return fresh;
}

export function subscribeToCloudData(onChange: (data: AppData) => void, onError: (message: string) => void): () => void {
  if (!isCloudConfigured()) {
    return () => undefined;
  }

  const supabase = getClient();
  let channel: RealtimeChannel | null = supabase
    .channel(`mahjong-app-state-${ROOM_ID}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: TABLE_NAME,
        filter: `room_id=eq.${ROOM_ID}`
      },
      (payload) => {
        const nextData = (payload.new as Partial<StateRow> | null)?.data;
        if (nextData) {
          onChange(normalizeData(nextData));
        }
      }
    )
    .subscribe((status) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        onError("云端实时同步连接异常，页面仍会尝试保存数据。");
      }
    });

  return () => {
    if (channel) {
      void supabase.removeChannel(channel);
      channel = null;
    }
  };
}
