import { NextResponse } from "next/server";
import { getR2Client, getR2BucketName } from "@/lib/r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get("url");
    const keyParam = url.searchParams.get("key");

    let key = keyParam;
    if (!key && targetUrl) {
      try {
        const parsed = new URL(targetUrl);
        key = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
      } catch {
        key = targetUrl;
      }
    }

    if (!key) {
      return new NextResponse("Key or URL is required", { status: 400 });
    }

    const client = getR2Client();
    const bucket = getR2BucketName();

    if (!client) {
      return new NextResponse("R2 Client not configured", { status: 500 });
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await client.send(command);

    if (!response.Body) {
      return new NextResponse("Image not found", { status: 404 });
    }

    // Convert stream to Web ReadableStream
    const stream = response.Body.transformToWebStream();

    const headers = new Headers();
    headers.set("Content-Type", response.ContentType || "image/jpeg");
    if (response.ContentLength) {
      headers.set("Content-Length", response.ContentLength.toString());
    }
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("Cross-Origin-Resource-Policy", "cross-origin");
    headers.set("Access-Control-Allow-Origin", "*");

    return new NextResponse(stream, { headers });
  } catch (error: any) {
    console.error("GET /api/image error:", error);
    return new NextResponse(error.message || "Failed to load image", {
      status: 500,
    });
  }
}
