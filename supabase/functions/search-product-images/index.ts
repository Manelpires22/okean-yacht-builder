import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, brand, model } = await req.json();

    if (!productName?.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Product name is required', images: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!perplexityApiKey) {
      console.error('PERPLEXITY_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Perplexity API key not configured', images: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Build search query
    let searchQuery = productName;
    if (brand) searchQuery = `${brand} ${searchQuery}`;
    if (model) searchQuery = `${model} ${searchQuery}`;
    searchQuery += ' yacht marine equipment product image high quality';

    console.log('Searching images for:', searchQuery);

    const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: `You are an image search assistant. Find real product images from the web for yacht/marine equipment. 
Return ONLY a JSON array of direct image URLs (ending in .jpg, .jpeg, .png, .webp, or from product pages).
Focus on:
- Official manufacturer product images
- High-quality product photos from marine equipment retailers
- Product catalog images
Return exactly this format: ["url1", "url2", "url3", "url4", "url5", "url6"]
Maximum 6 URLs. Only include valid, accessible image URLs.`
          },
          {
            role: 'user',
            content: `Find product images for: ${searchQuery}. Return only the JSON array of image URLs.`
          }
        ],
      }),
    });

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      console.error('Perplexity API error:', perplexityResponse.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to search images', images: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const data = await perplexityResponse.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('Perplexity response content:', content);

    // Extract URLs from response
    let images: string[] = [];
    
    // Try to parse as JSON array first
    try {
      const jsonMatch = content.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          images = parsed.filter((url: any) => 
            typeof url === 'string' && 
            (url.startsWith('http://') || url.startsWith('https://'))
          );
        }
      }
    } catch (e) {
      console.log('JSON parse failed, trying regex extraction');
    }

    // Fallback: extract URLs with regex
    if (images.length === 0) {
      const urlRegex = /https?:\/\/[^\s"'<>\]]+\.(?:jpg|jpeg|png|webp|gif)/gi;
      const matches = content.match(urlRegex);
      if (matches) {
        images = [...new Set(matches)] as string[]; // Remove duplicates
      }
    }

    // Also check citations if available
    if (data.citations && Array.isArray(data.citations)) {
      for (const citation of data.citations) {
        if (typeof citation === 'string' && /\.(jpg|jpeg|png|webp|gif)/i.test(citation)) {
          if (!images.includes(citation)) {
            images.push(citation);
          }
        }
      }
    }

    // Limit to 6 images
    images = images.slice(0, 6);

    console.log('Found images:', images);

    return new Response(
      JSON.stringify({ success: true, images }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in search-product-images:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage, images: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
