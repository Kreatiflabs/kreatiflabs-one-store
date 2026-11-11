import { createClient, type Client } from "@libsql/client";
import { queryD1 } from "./d1";

export interface AppModel {
  id: string;
  slug: string;
  name: string;
  icon_url: string;
  category: string;
  short_desc: string;
  description: string;
  author: string;
  is_published: number; // 0 or 1
  created_at: string;
  updated_at: string;
}

export interface ReleaseModel {
  id: string;
  app_slug: string;
  platform: "android" | "ios";
  version: string;
  build_number: number;
  download_url: string;
  manifest_url: string;
  changelog: string;
  file_size_bytes: number;
  status: "draft" | "published";
  created_at: string;
}

export interface ScreenshotModel {
  id: string;
  app_slug: string;
  image_url: string;
  caption: string;
  order_index: number;
  created_at: string;
}

let localLibsql: Client | null = null;

function isD1Configured(): boolean {
  return Boolean(
    process.env.CLOUDFLARE_ACCOUNT_ID &&
    process.env.CLOUDFLARE_D1_DATABASE_ID &&
    process.env.CLOUDFLARE_API_TOKEN
  );
}

function getLocalDb(): Client {
  if (localLibsql) return localLibsql;
  localLibsql = createClient({
    url: process.env.DATABASE_URL || "file:kreatiflabs.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  return localLibsql;
}

export async function executeQuery<T = Record<string, unknown>>(
  sql: string,
  params: (string | number | boolean | null)[] = []
): Promise<T[]> {
  if (isD1Configured()) {
    return queryD1<T>(sql, params);
  }

  // Fallback to local LibSQL / SQLite
  const db = getLocalDb();
  const res = await db.execute({
    sql,
    args: params as (string | number | bigint | ArrayBuffer | null)[],
  });

  return (res.rows as unknown) as T[];
}

let isInitialized = false;

export async function initDatabase(): Promise<void> {
  if (isInitialized) return;
  const schemaStatements = [
    `CREATE TABLE IF NOT EXISTS apps (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      icon_url TEXT DEFAULT '',
      category TEXT DEFAULT 'Tools',
      short_desc TEXT DEFAULT '',
      description TEXT DEFAULT '',
      author TEXT DEFAULT 'Kreatiflabs',
      is_published INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS releases (
      id TEXT PRIMARY KEY,
      app_slug TEXT NOT NULL,
      platform TEXT NOT NULL,
      version TEXT NOT NULL,
      build_number INTEGER DEFAULT 1,
      download_url TEXT NOT NULL,
      manifest_url TEXT DEFAULT '',
      changelog TEXT DEFAULT '',
      file_size_bytes INTEGER DEFAULT 0,
      status TEXT DEFAULT 'draft',
      created_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS screenshots (
      id TEXT PRIMARY KEY,
      app_slug TEXT NOT NULL,
      image_url TEXT NOT NULL,
      caption TEXT DEFAULT '',
      order_index INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );`,
  ];

  for (const statement of schemaStatements) {
    await executeQuery(statement);
  }
  isInitialized = true;
}
