interface D1Response<T = Record<string, unknown>> {
  result: Array<{
    results: T[];
    success: boolean;
    meta?: Record<string, unknown>;
  }>;
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: Array<string>;
}

export async function queryD1<T = Record<string, unknown>>(
  sql: string,
  params: (string | number | boolean | null)[] = []
): Promise<T[]> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !databaseId || !apiToken) {
    throw new Error(
      "Cloudflare D1 is not configured. Missing CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, or CLOUDFLARE_API_TOKEN."
    );
  }

  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;

  let lastError: any = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sql,
          params,
        }),
        cache: "no-store",
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Cloudflare D1 HTTP Error (${res.status}): ${errorText}`);
      }

      const data: D1Response<T> = await res.json();
      if (!data.success || !data.result?.[0]?.success) {
        const errMsg = data.errors?.map((e) => e.message).join(", ") || "Unknown D1 query error";
        throw new Error(`Cloudflare D1 Query Failed: ${errMsg}`);
      }

      return data.result[0].results || [];
    } catch (err) {
      lastError = err;
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 400 * attempt));
      }
    }
  }

  throw lastError;
}
