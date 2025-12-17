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

  const res = await fetch(imageUrl, {
    headers: {
      // Some origins block hotlinks unless a user-agent is present
      "User-Agent": "Mozilla/5.0 (compatible; OKEAN-CPQ/1.0; +https://okeanyachts.com)",
      "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    },
  });

  if (!res.ok) {
    throw new Error(`download_failed_${res.status}`);
  }

  const contentType = res.headers.get("content-type") || toContentType(ext);
  const bytes = new Uint8Array(await res.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("yacht-images")
    .upload(path, bytes, {
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

    // Build search query
    let searchQuery = productName;
    if (brand) searchQuery = `${brand} ${searchQuery}`;
    if (model) searchQuery = `${model} ${searchQuery}`;
    searchQuery += " yacht marine equipment product image high quality";

    console.log("Searching images for:", searchQuery);

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
            content:
              `You are an image search assistant. Find real product images from the web for yacht/marine equipment.
Return ONLY a JSON array of direct image URLs.
Return exactly this format: ["url1", "url2", "url3", "url4", "url5", "url6"]
Maximum 6 URLs.`,
          },
          {
            role: "user",
            content: `Find product images for: ${searchQuery}. Return only the JSON array of image URLs.`,
          },
        ],
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
    const content = data.choices?.[0]?.message?.content || "";

    console.log("Perplexity response content:", content);

    // Extract URLs from response
    let urls: string[] = [];

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
      // ignore
    }

    if (urls.length === 0) {
      const urlRegex = /https?:\/\/[^\s"'<>\]]+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^\s"'<>\]]*)?/gi;
      const matches = content.match(urlRegex);
      if (matches) urls = [...new Set(matches)] as string[];
    }

    // Limit to 6
    urls = urls.slice(0, 6);

    console.log("Found candidate URLs:", urls);

    // Download to our Storage to avoid hotlink/CORS blocks in the browser
    const settled = await Promise.allSettled(urls.map((u) => downloadToStorage(supabase, u)));
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
    return new Response(
      JSON.stringify({ success: false, error: errorMessage, images: [] }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
