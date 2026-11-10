import { NextResponse } from "next/server";
import { executeQuery, initDatabase, type AppModel } from "@/lib/db";

export async function GET(req: Request) {
  try {
    await initDatabase();
    const url = new URL(req.url);
    const includeDrafts = url.searchParams.get("include_drafts") === "true";

    const query = includeDrafts
      ? "SELECT * FROM apps ORDER BY updated_at DESC"
      : "SELECT * FROM apps WHERE is_published = 1 ORDER BY updated_at DESC";

    const apps = await executeQuery<AppModel>(query);

    return NextResponse.json({ apps });
  } catch (error: any) {
    console.error("GET /api/apps error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await initDatabase();
    const body = await req.json();
    const {
      name,
      slug,
      icon_url = "",
      category = "Tools",
      short_desc = "",
      description = "",
      author = "Kreatiflabs",
      is_published = 0,
    } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "name and slug are required" },
        { status: 400 }
      );
    }

    const cleanSlug = slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-");

    const existing = await executeQuery<{ id: string }>(
      "SELECT id FROM apps WHERE slug = ? LIMIT 1",
      [cleanSlug]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: `App with slug '${cleanSlug}' already exists` },
        { status: 409 }
      );
    }

    const id = `app_${Date.now()}`;
    const now = new Date().toISOString();

    await executeQuery(
      `INSERT INTO apps (id, slug, name, icon_url, category, short_desc, description, author, is_published, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        cleanSlug,
        name,
        icon_url,
        category,
        short_desc,
        description,
        author,
        is_published ? 1 : 0,
        now,
        now,
      ]
    );

    return NextResponse.json({ success: true, id, slug: cleanSlug });
  } catch (error: any) {
    console.error("POST /api/apps error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
