import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getExtensionFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const ext = pathname.split(".").pop()?.toLowerCase();
    if (ext && ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) return ext;
  } catch {
    // ignore
  }
  return "jpg";
}

function toContentType(ext: string): string {
  switch (ext) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "jpeg":
    case "jpg":
    default:
      return "image/jpeg";
  }
}

async function downloadToStorage(supabase: any, imageUrl: string) {
  const ext = getExtensionFromUrl(imageUrl);
  const path = `ai-search/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const tryFetch = async (withHeaders: boolean) => {
    const res = await fetch(imageUrl, {
      redirect: "follow",
      headers: withHeaders
        ? {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
            Referer: new URL(imageUrl).origin,
          }
        : undefined,
    });
    return res;
  };

  let res = await tryFetch(true);
  if (!res.ok) {
    console.log("Image download failed (with headers)", { url: imageUrl, status: res.status });
    res = await tryFetch(false);
  }

  if (!res.ok) {
    throw new Error(`download_failed_${res.status}`);
  }

  const contentTypeHeader = res.headers.get("content-type") || "";
  const contentType = contentTypeHeader || toContentType(ext);

  if (contentTypeHeader && !contentTypeHeader.startsWith("image/")) {
    throw new Error(`not_image_content_type_${contentTypeHeader}`);
  }

  const bytes = new Uint8Array(await res.arrayBuffer());

  const { error: uploadError } = await supabase.storage.from("yacht-images").upload(path, bytes, {
    contentType,
    upsert: true,
  });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("yacht-images").getPublicUrl(path);
  return data.publicUrl;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, brand, model, customQuery } = await req.json();
    console.log('Search request:', { productName, brand, model, customQuery });

    if (!productName?.trim() && !customQuery?.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: "Product name or custom query is required", images: [] }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    const googleApiKey = Deno.env.get("GOOGLE_API_KEY");
    const searchEngineId = Deno.env.get("GOOGLE_SEARCH_ENGINE_ID");
    
    if (!googleApiKey || !searchEngineId) {
      console.error("GOOGLE_API_KEY or GOOGLE_SEARCH_ENGINE_ID not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Google API not configured", images: [] }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Supabase not configured", images: [] }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Use custom query if provided, otherwise build optimized query
    let searchQuery: string;
    if (customQuery?.trim()) {
      searchQuery = customQuery.trim();
    } else if (brand && model) {
      // Best case: use brand + model only (most efficient)
      searchQuery = `${brand} ${model} marine yacht product official image`;
    } else if (brand) {
      // Has brand but no model: use brand + truncated product name
      const shortName = productName.split(' ').slice(0, 5).join(' ').substring(0, 50);
      searchQuery = `${brand} ${shortName} yacht marine equipment`;
    } else {
      // Fallback: truncated product name only
      const shortName = productName.split(' ').slice(0, 6).join(' ').substring(0, 60);
      searchQuery = `${shortName} yacht marine equipment`;
    }
    console.log("Searching images with Google Custom Search for:", searchQuery);

    // Call Google Custom Search API
    const searchUrl = new URL("https://www.googleapis.com/customsearch/v1");
    searchUrl.searchParams.set("key", googleApiKey);
    searchUrl.searchParams.set("cx", searchEngineId);
    searchUrl.searchParams.set("q", searchQuery);
    searchUrl.searchParams.set("searchType", "image");
    searchUrl.searchParams.set("num", "10"); // Request more to have fallbacks
    searchUrl.searchParams.set("imgSize", "large");
    searchUrl.searchParams.set("safe", "active");

    const googleResponse = await fetch(searchUrl.toString());
    
    if (!googleResponse.ok) {
      const errorText = await googleResponse.text();
      console.error("Google API error:", googleResponse.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: "Google search failed", details: errorText, images: [] }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    const googleData = await googleResponse.json();
    console.log("Google returned", googleData.items?.length || 0, "results");

    // Extract image URLs from Google response
    let urls: string[] = [];
    if (googleData.items && Array.isArray(googleData.items)) {
      for (const item of googleData.items) {
        if (item.link && typeof item.link === "string") {
          // Filter out unwanted image types
          const urlLower = item.link.toLowerCase();
          if (!urlLower.includes("logo") && !urlLower.includes("icon") && !urlLower.includes("thumbnail") && !urlLower.includes("favicon")) {
            urls.push(item.link);
          }
        }
      }
    }

    // Limit to 6 and dedupe
    urls = [...new Set(urls)].slice(0, 8);
    console.log("Valid image URLs found:", urls.length);

    if (urls.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          images: [],
          message: "No images found for this product",
          searchQuery,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Download to our Storage to avoid hotlink/CORS blocks in the browser
    const settled = await Promise.allSettled(urls.map((u) => downloadToStorage(supabase, u)));

    const failed = settled.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    if (failed.length) {
      console.log(
        "Image download/upload failures:",
        failed.map((f) => (f.reason instanceof Error ? f.reason.message : String(f.reason))),
      );
    }

    const images = settled
      .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
      .map((r) => r.value)
      .slice(0, 6);

    console.log("Stored images:", images.length);
    return new Response(JSON.stringify({ success: true, images, searchQuery }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in search-product-images:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage, images: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
