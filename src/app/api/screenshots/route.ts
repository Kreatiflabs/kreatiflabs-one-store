import { NextResponse } from "next/server";
import { executeQuery, initDatabase } from "@/lib/db";

export async function POST(req: Request) {
  try {
    await initDatabase();
    const { app_slug, image_url, caption = "", order_index = 0 } = await req.json();

    if (!app_slug || !image_url) {
      return NextResponse.json(
        { error: "app_slug and image_url are required" },
        { status: 400 }
      );
    }

    const id = `ss_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date().toISOString();

    await executeQuery(
      `INSERT INTO screenshots (id, app_slug, image_url, caption, order_index, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, app_slug, image_url, caption, order_index, now]
    );

    return NextResponse.json({ success: true, id, image_url });
  } catch (error: any) {
    console.error("POST /api/screenshots error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await initDatabase();
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await executeQuery("DELETE FROM screenshots WHERE id = ?", [id]);

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("DELETE /api/screenshots error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
