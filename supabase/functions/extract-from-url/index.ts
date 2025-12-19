import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

interface ExtractedData {
  brand: string | null;
  model: string | null;
  description: string | null;
  images: string[];
  specifications: {
    length_overall?: number;
    hull_length?: number;
    beam?: number;
    draft?: number;
    height_from_waterline?: number;
    displacement_light?: number;
    displacement_loaded?: number;
    fuel_capacity?: number;
    water_capacity?: number;
    passengers_capacity?: number;
    cabins?: number;
    bathrooms?: string;
    engines?: string;
    max_speed?: number;
    cruise_speed?: number;
    range_nautical_miles?: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, includeSpecs = true } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!FIRECRAWL_API_KEY) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Lovable AI não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping URL with Firecrawl:', formattedUrl);

    // Step 1: Scrape with Firecrawl
    const firecrawlResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown', 'links'],
        onlyMainContent: true,
      }),
    });

    const firecrawlData = await firecrawlResponse.json();

    if (!firecrawlResponse.ok) {
      console.error('Firecrawl API error:', firecrawlData);
      return new Response(
        JSON.stringify({ success: false, error: firecrawlData.error || 'Erro ao acessar página' }),
        { status: firecrawlResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const markdown = firecrawlData.data?.markdown || firecrawlData.markdown || '';
    const links = firecrawlData.data?.links || firecrawlData.links || [];
    const metadata = firecrawlData.data?.metadata || firecrawlData.metadata || {};

    console.log('Firecrawl response - markdown length:', markdown.length, 'links count:', links.length);

    // Extract image URLs from links
    const imageUrls = links.filter((link: string) => 
      /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(link) ||
      link.includes('/images/') ||
      link.includes('/img/') ||
      link.includes('/photos/')
    ).slice(0, 10); // Limit to 10 images

    console.log('Found image URLs:', imageUrls.length);

    // Step 2: Send to Lovable AI for structured extraction
    console.log('Sending to Lovable AI for extraction...');

    const systemPrompt = `Você é um especialista em iates e embarcações. Sua tarefa é extrair informações estruturadas de páginas de fabricantes de iates.

Extraia as seguintes informações do conteúdo fornecido:
- brand: Nome do fabricante/marca (ex: OKEAN, Azimut, Ferretti)
- model: Nome/número do modelo (ex: 57, 42 Sport, X95)
- description: Descrição comercial do modelo (máximo 500 caracteres)
- specifications: Especificações técnicas incluindo:
  - length_overall: Comprimento total em metros (número decimal)
  - hull_length: Comprimento do casco em metros (número decimal)
  - beam: Largura máxima em metros (número decimal)
  - draft: Calado em metros (número decimal)
  - displacement_light: Deslocamento sem carga em kg (número inteiro)
  - displacement_loaded: Deslocamento com carga em kg (número inteiro)
  - fuel_capacity: Capacidade de combustível em litros (número inteiro)
  - water_capacity: Capacidade de água em litros (número inteiro)
  - passengers_capacity: Número máximo de passageiros (número inteiro)
  - cabins: Número de cabines (número inteiro)
  - bathrooms: Número de banheiros (string, pode ser "3+1")
  - engines: Descrição dos motores (string)
  - max_speed: Velocidade máxima em nós (número decimal)
  - cruise_speed: Velocidade de cruzeiro em nós (número decimal)
  - range_nautical_miles: Autonomia em milhas náuticas (número inteiro)

Importante:
- Converta todas as medidas para o sistema métrico (metros, litros, kg)
- Se um valor estiver em pés, converta para metros (1 pé = 0.3048 metros)
- Se um valor estiver em galões, converta para litros (1 galão = 3.785 litros)
- Se uma informação não estiver disponível, retorne null para aquele campo
- Seja preciso com os números, não invente valores`;

    const userPrompt = `Extraia as informações deste conteúdo de página de iate:

URL: ${formattedUrl}
Título da página: ${metadata.title || 'Não disponível'}

Conteúdo:
${markdown.substring(0, 8000)}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_yacht_data',
              description: 'Extract structured yacht data from the page content',
              parameters: {
                type: 'object',
                properties: {
                  brand: { type: 'string', description: 'Manufacturer brand name' },
                  model: { type: 'string', description: 'Model name/number' },
                  description: { type: 'string', description: 'Commercial description (max 500 chars)' },
                  specifications: {
                    type: 'object',
                    properties: {
                      length_overall: { type: 'number', description: 'Length in meters' },
                      hull_length: { type: 'number', description: 'Hull length in meters' },
                      beam: { type: 'number', description: 'Beam/width in meters' },
                      draft: { type: 'number', description: 'Draft in meters' },
                      displacement_light: { type: 'number', description: 'Light displacement in kg' },
                      displacement_loaded: { type: 'number', description: 'Loaded displacement in kg' },
                      fuel_capacity: { type: 'number', description: 'Fuel capacity in liters' },
                      water_capacity: { type: 'number', description: 'Water capacity in liters' },
                      passengers_capacity: { type: 'number', description: 'Max passengers' },
                      cabins: { type: 'number', description: 'Number of cabins' },
                      bathrooms: { type: 'string', description: 'Number of bathrooms' },
                      engines: { type: 'string', description: 'Engine description' },
                      max_speed: { type: 'number', description: 'Max speed in knots' },
                      cruise_speed: { type: 'number', description: 'Cruise speed in knots' },
                      range_nautical_miles: { type: 'number', description: 'Range in nautical miles' }
                    }
                  }
                },
                required: ['brand', 'model']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_yacht_data' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Limite de requisições excedido, tente novamente em alguns minutos' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao processar com IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    console.log('Lovable AI response:', JSON.stringify(aiData, null, 2));

    // Extract the function call result
    let extractedData: ExtractedData = {
      brand: null,
      model: null,
      description: null,
      images: imageUrls,
      specifications: {}
    };

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const args = JSON.parse(toolCall.function.arguments);
        extractedData = {
          brand: args.brand || null,
          model: args.model || null,
          description: args.description || null,
          images: imageUrls,
          specifications: args.specifications || {}
        };
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
      }
    }

    console.log('Extracted data:', JSON.stringify(extractedData, null, 2));

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedData,
        source: {
          url: formattedUrl,
          title: metadata.title,
          scrapedAt: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-from-url:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
