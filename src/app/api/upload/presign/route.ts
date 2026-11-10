import { NextResponse } from "next/server";
import { createPresignedUploadUrl } from "@/lib/r2";

export async function POST(req: Request) {
  try {
    const { filename, contentType, folder = "screenshots" } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "filename and contentType are required" },
        { status: 400 }
      );
    }

    const cleanFilename = filename.toLowerCase().replace(/[^a-z0-9.-]/g, "_");
    const uniqueKey = `${folder}/${Date.now()}-${cleanFilename}`;

    const { uploadUrl, publicUrl } = await createPresignedUploadUrl(
      uniqueKey,
      contentType
    );

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      key: uniqueKey,
    });
  } catch (error: any) {
    console.error("Presign upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate presigned upload URL" },
      { status: 500 }
    );
  }
}
