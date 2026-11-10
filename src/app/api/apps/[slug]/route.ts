import { NextResponse } from "next/server";
import {
  executeQuery,
  initDatabase,
  type AppModel,
  type ReleaseModel,
  type ScreenshotModel,
} from "@/lib/db";

export async function GET(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await initDatabase();
    const { slug } = await context.params;

    const apps = await executeQuery<AppModel>(
      "SELECT * FROM apps WHERE slug = ? LIMIT 1",
      [slug]
    );

    if (apps.length === 0) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    const app = apps[0];

    const url = new URL(req.url);
    const includeDrafts = url.searchParams.get("include_drafts") === "true";

    const releaseQuery = includeDrafts
      ? "SELECT * FROM releases WHERE app_slug = ? ORDER BY build_number DESC, created_at DESC"
      : "SELECT * FROM releases WHERE app_slug = ? AND status = 'published' ORDER BY build_number DESC, created_at DESC";

    const releases = await executeQuery<ReleaseModel>(releaseQuery, [slug]);

    const screenshots = await executeQuery<ScreenshotModel>(
      "SELECT * FROM screenshots WHERE app_slug = ? ORDER BY order_index ASC, created_at ASC",
      [slug]
    );

    return NextResponse.json({
      app,
      releases,
      screenshots,
    });
  } catch (error: any) {
    console.error("GET /api/apps/[slug] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await initDatabase();
    const { slug } = await context.params;
    const body = await req.json();

    const {
      name,
      icon_url,
      category,
      short_desc,
      description,
      author,
      is_published,
    } = body;

    const now = new Date().toISOString();

    await executeQuery(
      `UPDATE apps
       SET name = COALESCE(?, name),
           icon_url = COALESCE(?, icon_url),
           category = COALESCE(?, category),
           short_desc = COALESCE(?, short_desc),
           description = COALESCE(?, description),
           author = COALESCE(?, author),
           is_published = COALESCE(?, is_published),
           updated_at = ?
       WHERE slug = ?`,
      [
        name ?? null,
        icon_url ?? null,
        category ?? null,
        short_desc ?? null,
        description ?? null,
        author ?? null,
        typeof is_published === "boolean" ? (is_published ? 1 : 0) : (is_published ?? null),
        now,
        slug,
      ]
    );

    return NextResponse.json({ success: true, slug });
  } catch (error: any) {
    console.error("PUT /api/apps/[slug] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await initDatabase();
    const { slug } = await context.params;

    await executeQuery("DELETE FROM apps WHERE slug = ?", [slug]);
    await executeQuery("DELETE FROM releases WHERE app_slug = ?", [slug]);
    await executeQuery("DELETE FROM screenshots WHERE app_slug = ?", [slug]);

    return NextResponse.json({ success: true, deleted: slug });
  } catch (error: any) {
    console.error("DELETE /api/apps/[slug] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
