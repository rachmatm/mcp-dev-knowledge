import { getCachedValue, setCachedValue } from "@/lib/redis";

const ALLOWED_ORIGIN = "https://rachmatm.github.io";
const CACHE_EXPIRATION = 8 * 60 * 60; // 8 hours in seconds

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

async function fetchMetalsPrice(currency: string): Promise<Record<string, unknown> | null> {
  const apiKey = process.env.METALS_DEV_API_KEY;
  console.log("[v0] apiKey exists:", !!apiKey);
  console.log("[v0] apiKey length:", apiKey?.length || 0);
  
  if (!apiKey) {
    console.error("[Metals API] METALS_DEV_API_KEY not set");
    return null;
  }

  const url = `https://api.metals.dev/v1/latest?api_key=${apiKey}&currency=${currency}&unit=g`;
  console.log("[v0] Fetching from metals.dev with currency:", currency);

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } } as RequestInit);
    console.log("[v0] Metals API response status:", res.status);
    
    if (!res.ok) {
      console.error(`[Metals API] Upstream returned ${res.status}`);
      const text = await res.text();
      console.error("[v0] Response body:", text);
      return null;
    }
    const data = await res.json();
    console.log("[v0] Metals API data:", JSON.stringify(data).substring(0, 200));
    return data;
  } catch (error) {
    console.error("[Metals API] Fetch error:", error);
    return null;
  }
}

async function getPricesWithCache(): Promise<{
  goldPrice: number | null;
  usdPrice: number | null;
}> {
  const goldCacheKey = "metals_gold_price";
  const usdCacheKey = "metals_usd_price";

  // Try to get both from cache first
  const [cachedGold, cachedUsd] = await Promise.all([
    getCachedValue(goldCacheKey),
    getCachedValue(usdCacheKey),
  ]);

  if (cachedGold && cachedUsd) {
    console.log("[Cache] Both prices hit - returning from cache");
    return {
      goldPrice: Number(cachedGold),
      usdPrice: Number(cachedUsd),
    };
  }

  console.log("[Cache] Missing data - fetching from API");

  // Fetch once from API with IDR currency
  const apiData = await fetchMetalsPrice("IDR");

  if (!apiData) {
    console.error("[API] Failed to fetch prices");
    return {
      goldPrice: cachedGold ? Number(cachedGold) : null,
      usdPrice: cachedUsd ? Number(cachedUsd) : null,
    };
  }

  // Extract both values from single API response
  const goldPrice =
    typeof apiData.gold === "number" ? apiData.gold : null;
  const usdPrice = typeof apiData.usd === "number" ? apiData.usd : null;

  // Cache both values independently
  if (goldPrice !== null) {
    await setCachedValue(goldCacheKey, goldPrice.toString(), CACHE_EXPIRATION);
    console.log(`[Cache] Stored ${goldCacheKey}`);
  }

  if (usdPrice !== null) {
    await setCachedValue(usdCacheKey, usdPrice.toString(), CACHE_EXPIRATION);
    console.log(`[Cache] Stored ${usdCacheKey}`);
  }

  return { goldPrice, usdPrice };
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET() {
  try {
    // Fetch both prices in single API call (with caching)
    const { goldPrice, usdPrice } = await getPricesWithCache();

    // Build response
    const response: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
    };

    if (goldPrice !== null) {
      response.idr_gold_price = goldPrice;
    } else {
      response.idr_gold_price_error = "Failed to fetch gold price";
    }

    if (usdPrice !== null) {
      response.idr_usd_price = usdPrice;
    } else {
      response.idr_usd_price_error = "Failed to fetch USD/IDR exchange rate";
    }

    return Response.json(response, { headers: corsHeaders() });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("[API] Error:", message);
    return Response.json(
      { error: message },
      { status: 500, headers: corsHeaders() }
    );
  }
}
