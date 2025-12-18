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

// Extract image URLs from search results text/snippets
function extractImageUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s"'<>\]]+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^\s"'<>\]]*)?/gi;
  const matches = text.match(urlRegex);
  return matches ? [...new Set(matches)] : [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, brand, model } = await req.json();

    if (!productName?.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: "Product name is required", images: [] }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    const perplexityApiKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!perplexityApiKey) {
      console.error("PERPLEXITY_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Perplexity API key not configured", images: [] }),
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

    // Build search query for product images
    let searchQuery = productName;
    if (brand) searchQuery = `${brand} ${searchQuery}`;
    if (model) searchQuery = `${model} ${searchQuery}`;
    searchQuery += " product image photo";

    console.log("Searching images with Perplexity Search API for:", searchQuery);

    // Use Perplexity Search API for real-time web search
    const perplexityResponse = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${perplexityApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: `You are a product image search assistant. Your task is to find REAL, EXISTING product images from the web.

CRITICAL RULES:
1. ONLY return URLs that you found in your web search results
2. DO NOT generate, invent, or hallucinate URLs
3. Prefer images from official manufacturer websites, marine equipment retailers (West Marine, MarineWarehouse, etc.), or Amazon
4. Return ONLY a JSON array of direct image URLs in this exact format: ["url1", "url2", "url3"]
5. If you cannot find real images, return an empty array: []
6. Maximum 6 URLs`,
          },
          {
            role: "user",
            content: `Search the web and find real product images for: ${searchQuery}

Return ONLY URLs from your actual search results. Do not make up URLs.`,
          },
        ],
        web_search: true,
        return_images: true,
        return_related_questions: false,
      }),
    });

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      console.error("Perplexity API error:", perplexityResponse.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to search images", images: [] }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    const data = await perplexityResponse.json();
    console.log("Perplexity full response:", JSON.stringify(data, null, 2));

    let urls: string[] = [];

    // Try to get images from the images field if available
    if (data.images && Array.isArray(data.images)) {
      urls = data.images.filter(
        (url: unknown) =>
          typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://")),
      );
      console.log("Found images in images field:", urls);
    }

    // Also try to extract from message content
    const content = data.choices?.[0]?.message?.content || "";
    console.log("Perplexity response content:", content);

    if (urls.length === 0) {
      try {
        const jsonMatch = content.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsed)) {
            urls = parsed.filter(
              (url: unknown) =>
                typeof url === "string" &&
                (url.startsWith("http://") || url.startsWith("https://")),
            );
          }
        }
      } catch {
        // ignore JSON parse errors
      }
    }

    // Extract URLs from citations if available
    if (urls.length === 0 && data.citations && Array.isArray(data.citations)) {
      for (const citation of data.citations) {
        const extractedUrls = extractImageUrls(citation);
        urls.push(...extractedUrls);
      }
      console.log("Extracted from citations:", urls);
    }

    // Fallback: extract URLs from content text
    if (urls.length === 0) {
      urls = extractImageUrls(content);
      console.log("Extracted from content text:", urls);
    }

    // Limit to 6 and dedupe
    urls = [...new Set(urls)].slice(0, 6);

    console.log("Final candidate URLs:", urls);

    if (urls.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          images: [],
          message: "No images found for this product",
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

    console.log("Stored images:", images);
    return new Response(JSON.stringify({ success: true, images }), {
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
