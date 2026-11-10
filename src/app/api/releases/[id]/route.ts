import { NextResponse } from "next/server";
import { executeQuery, initDatabase } from "@/lib/db";

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await initDatabase();
    const { id } = await context.params;
    const body = await req.json();

    const { status, changelog, download_url, manifest_url, version } = body;

    await executeQuery(
      `UPDATE releases
       SET status = COALESCE(?, status),
           changelog = COALESCE(?, changelog),
           download_url = COALESCE(?, download_url),
           manifest_url = COALESCE(?, manifest_url),
           version = COALESCE(?, version)
       WHERE id = ?`,
      [
        status ?? null,
        changelog ?? null,
        download_url ?? null,
        manifest_url ?? null,
        version ?? null,
        id,
      ]
    );

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("PUT /api/releases/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await initDatabase();
    const { id } = await context.params;

    await executeQuery("DELETE FROM releases WHERE id = ?", [id]);

    return NextResponse.json({ success: true, deleted: id });
  } catch (error: any) {
    console.error("DELETE /api/releases/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
