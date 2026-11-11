import { NextResponse } from "next/server";
import { executeQuery, initDatabase, type AppModel, type ReleaseModel } from "@/lib/db";

export async function POST(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await initDatabase();
    const { slug } = await context.params;
    const body = await req.json().catch(() => ({}));
    const { releaseId } = body;

    // Increment app download count
    await executeQuery(
      "UPDATE apps SET download_count = COALESCE(download_count, 0) + 1 WHERE slug = ?",
      [slug]
    );

    if (releaseId) {
      await executeQuery(
        "UPDATE releases SET download_count = COALESCE(download_count, 0) + 1 WHERE id = ?",
        [releaseId]
      );
    }

    const updated = await executeQuery<AppModel>(
      "SELECT download_count FROM apps WHERE slug = ? LIMIT 1",
      [slug]
    );

    return NextResponse.json({
      success: true,
      download_count: updated[0]?.download_count || 1,
    });
  } catch (error: any) {
    console.error("POST /api/apps/[slug]/download error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await initDatabase();
    const { slug } = await context.params;
    const url = new URL(req.url);
    const platform = url.searchParams.get("platform"); // 'android' | 'ios'

    // Increment count
    await executeQuery(
      "UPDATE apps SET download_count = COALESCE(download_count, 0) + 1 WHERE slug = ?",
      [slug]
    );

    let targetUrl = "";
    if (platform) {
      const rels = await executeQuery<ReleaseModel>(
        "SELECT * FROM releases WHERE app_slug = ? AND platform = ? AND status = 'published' ORDER BY build_number DESC LIMIT 1",
        [slug, platform]
      );
      if (rels.length > 0) {
        await executeQuery(
          "UPDATE releases SET download_count = COALESCE(download_count, 0) + 1 WHERE id = ?",
          [rels[0].id]
        );
        targetUrl = rels[0].download_url;
      }
    }

    if (targetUrl) {
      return NextResponse.redirect(targetUrl, { status: 302 });
    }

    const updated = await executeQuery<AppModel>(
      "SELECT download_count FROM apps WHERE slug = ? LIMIT 1",
      [slug]
    );

    return NextResponse.json({
      success: true,
      download_count: updated[0]?.download_count || 0,
    });
  } catch (error: any) {
    console.error("GET /api/apps/[slug]/download error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
