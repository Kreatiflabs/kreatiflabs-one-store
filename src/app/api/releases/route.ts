import { NextResponse } from "next/server";
import { executeQuery, initDatabase, type ReleaseModel } from "@/lib/db";

export async function GET(req: Request) {
  try {
    await initDatabase();
    const url = new URL(req.url);
    const slug = url.searchParams.get("app_slug");

    const query = slug
      ? "SELECT * FROM releases WHERE app_slug = ? ORDER BY build_number DESC, created_at DESC"
      : "SELECT * FROM releases ORDER BY created_at DESC";

    const params = slug ? [slug] : [];
    const releases = await executeQuery<ReleaseModel>(query, params);

    return NextResponse.json({ releases });
  } catch (error: any) {
    console.error("GET /api/releases error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await initDatabase();
    const body = await req.json();
    const {
      app_slug,
      platform = "android",
      version,
      build_number = 1,
      download_url,
      manifest_url = "",
      changelog = "",
      file_size_bytes = 0,
      status = "published",
    } = body;

    if (!app_slug || !version || !download_url) {
      return NextResponse.json(
        { error: "app_slug, version, dan download_url wajib diisi" },
        { status: 400 }
      );
    }

    const id = `rel_${Date.now()}`;
    const now = new Date().toISOString();

    await executeQuery(
      `INSERT INTO releases (id, app_slug, platform, version, build_number, download_url, manifest_url, changelog, file_size_bytes, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        app_slug,
        platform,
        version,
        parseInt(build_number, 10) || 1,
        download_url,
        manifest_url,
        changelog,
        parseInt(file_size_bytes, 10) || 0,
        status,
        now,
      ]
    );

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("POST /api/releases error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
