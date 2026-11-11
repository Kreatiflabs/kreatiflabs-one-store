import { NextResponse } from "next/server";
import { uploadBufferToR2 } from "@/lib/r2";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const cleanFilename = file.name.toLowerCase().replace(/[^a-z0-9.-]/g, "_");
    const uniqueKey = `${folder}/${Date.now()}-${cleanFilename}`;
    const contentType = file.type || "application/octet-stream";

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { publicUrl, key } = await uploadBufferToR2(
      uniqueKey,
      buffer,
      contentType
    );

    return NextResponse.json({
      success: true,
      publicUrl,
      key,
    });
  } catch (error: any) {
    console.error("Server upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file to Cloudflare R2" },
      { status: 500 }
    );
  }
}
