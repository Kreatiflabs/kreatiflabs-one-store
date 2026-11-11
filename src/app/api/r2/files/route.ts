import { NextResponse } from "next/server";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getR2Client, getR2BucketName, getR2PublicDomain } from "@/lib/r2";

export async function GET() {
  try {
    const client = getR2Client();
    if (!client) {
      return NextResponse.json(
        { error: "Cloudflare R2 is not configured" },
        { status: 500 }
      );
    }

    const bucket = getR2BucketName();
    const publicDomain = getR2PublicDomain();

    const command = new ListObjectsV2Command({
      Bucket: bucket,
      MaxKeys: 100,
    });

    const response = await client.send(command);
    const contents = response.Contents || [];

    // Filter only release binaries (apk, ipa, aab) or all files
    const files = contents
      .filter((item) => {
        const key = (item.Key || "").toLowerCase();
        return (
          key.endsWith(".apk") ||
          key.endsWith(".ipa") ||
          key.endsWith(".aab") ||
          key.includes("/releases/")
        );
      })
      .map((item) => {
        const key = item.Key || "";
        const url = `${publicDomain}/${key}`;
        return {
          key,
          size: item.Size || 0,
          lastModified: item.LastModified?.toISOString() || "",
          url,
        };
      });

    return NextResponse.json({ files });
  } catch (error: any) {
    console.error("GET /api/r2/files error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
