import { NextResponse } from "next/server";
import { executeQuery, initDatabase } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const webhookSecret = process.env.RELEASE_WEBHOOK_SECRET;

    if (webhookSecret) {
      const token = authHeader?.replace(/^Bearer\s+/i, "");
      if (token !== webhookSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json();
    const {
      app_slug,
      app_name,
      platform = "android",
      version,
      build_number = 1,
      download_url,
      manifest_url = "",
      changelog = "",
      file_size_bytes = 0,
      auto_publish = false,
    } = body;

    if (!app_slug || !version || !download_url) {
      return NextResponse.json(
        { error: "app_slug, version, and download_url are required" },
        { status: 400 }
      );
    }

    await initDatabase();

    const now = new Date().toISOString();

    // Check if app exists, otherwise create draft app
    const existingApps = await executeQuery<{ id: string }>(
      "SELECT id FROM apps WHERE slug = ? LIMIT 1",
      [app_slug]
    );

    if (existingApps.length === 0) {
      const newAppId = `app_${Date.now()}`;
      const name = app_name || app_slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      await executeQuery(
        `INSERT INTO apps (id, slug, name, short_desc, description, is_published, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
        [newAppId, app_slug, name, "New app build from CI/CD", "", now, now]
      );
    }

    // Insert new release
    const releaseId = `rel_${Date.now()}`;
    const status = auto_publish ? "published" : "draft";

    await executeQuery(
      `INSERT INTO releases (id, app_slug, platform, version, build_number, download_url, manifest_url, changelog, file_size_bytes, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        releaseId,
        app_slug,
        platform,
        version,
        build_number,
        download_url,
        manifest_url,
        changelog,
        file_size_bytes,
        status,
        now,
      ]
    );

    return NextResponse.json({
      success: true,
      message: `Release ${version} for ${app_slug} registered (${status})`,
      release_id: releaseId,
    });
  } catch (error: any) {
    console.error("Release webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
