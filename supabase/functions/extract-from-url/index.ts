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
    dry_weight?: number;
  };
}

// Pré-processamento com regex para extrair especificações diretamente do markdown
function extractSpecsFromMarkdown(markdown: string): Record<string, number | string> {
  const specs: Record<string, number | string> = {};
  
  // Helper para extrair número de uma string
  const extractNumber = (match: RegExpMatchArray | null): number | null => {
    if (!match || !match[1]) return null;
    // Substitui vírgula por ponto e extrai o número
    const numStr = match[1].replace(',', '.').replace(/\s/g, '');
    const num = parseFloat(numStr);
    return isNaN(num) ? null : num;
  };

  // Padrões para especificações em português (sites brasileiros como Yachtmax)
  const patterns: Array<{ key: string; regex: RegExp; isString?: boolean }> = [
    // Dimensões
    { key: 'length_overall', regex: /Comprimento\s*Total[*\s:]*(\d+[.,]?\d*)\s*(Metros?|m)?/i },
    { key: 'hull_length', regex: /Comprimento\s*(?:do\s*)?Casco[*\s:]*(\d+[.,]?\d*)\s*(Metros?|m)?/i },
    { key: 'beam', regex: /Boca\s*(?:Máxima)?[*\s:]*(\d+[.,]?\d*)\s*(Metros?|m)?/i },
    { key: 'draft', regex: /Calado[*\s:]*(\d+[.,]?\d*)\s*(Metros?|m)?/i },
    { key: 'height_from_waterline', regex: /Altura\s*(?:da\s*)?(?:Linha\s*(?:d['']?[aá]gua)?|Borda\s*Livre)[*\s:]*(\d+[.,]?\d*)\s*(Metros?|m)?/i },
    
    // Pesos e deslocamento
    { key: 'displacement_loaded', regex: /Deslocamento\s*(?:Carregado|Total)[*\s:]*(\d+[.,]?\d*)\s*(?:kg|quilos?)?/i },
    { key: 'displacement_light', regex: /Deslocamento\s*(?:Leve|Sem\s*Carga)[*\s:]*(\d+[.,]?\d*)\s*(?:kg|quilos?)?/i },
    { key: 'dry_weight', regex: /Peso\s*(?:Seco|a\s*Seco)[*\s:]*(\d+[.,]?\d*)\s*(?:kg|quilos?)?/i },
    
    // Capacidades
    { key: 'fuel_capacity', regex: /(?:Combust[ií]vel|Tanque\s*(?:de\s*)?Combust[ií]vel|Diesel)[*\s:]*(\d+[.,]?\d*)\s*(?:litros?|L)?/i },
    { key: 'water_capacity', regex: /(?:[ÁA]gua\s*(?:Pot[áa]vel|Doce)?|Tanque\s*(?:de\s*)?[ÁA]gua)[*\s:]*(\d+[.,]?\d*)\s*(?:litros?|L)?/i },
    { key: 'passengers_capacity', regex: /(?:Pessoas?\s*(?:a\s*)?Bordo|Passageiros?|Capacidade)[*\s:]*(\d+)/i },
    { key: 'cabins', regex: /Cabin(?:e|s)[*\s:]*(\d+)/i },
    { key: 'bathrooms', regex: /(?:Banheiros?|WC|Lavabos?)[*\s:]*(\d+(?:\s*\+\s*\d+)?)/i, isString: true },
    
    // Performance
    { key: 'max_speed', regex: /(?:Velocidade\s*)?M[áa]xima[*\s:]*(\d+[.,]?\d*)\s*(?:n[óo]s?|kts?)?/i },
    { key: 'cruise_speed', regex: /(?:Velocidade\s*(?:de\s*)?)?Cruzeiro[*\s:]*(\d+[.,]?\d*)\s*(?:n[óo]s?|kts?)?/i },
    { key: 'range_nautical_miles', regex: /(?:Autonomia|Alcance)[*\s:]*(\d+[.,]?\d*)\s*(?:milhas?\s*n[áa]uticas?|NM|mn)?/i },
    
    // Motores (string)
    { key: 'engines', regex: /Motor(?:es|iza[çc][ãa]o)?[*\s:]*(.+?)(?:\n|\|)/i, isString: true },
  ];

  for (const { key, regex, isString } of patterns) {
    const match = markdown.match(regex);
    if (match) {
      if (isString) {
        const value = match[1]?.trim();
        if (value) {
          specs[key] = value;
          console.log(`Regex extracted ${key}:`, value);
        }
      } else {
        const num = extractNumber(match);
        if (num !== null) {
          specs[key] = num;
          console.log(`Regex extracted ${key}:`, num);
        }
      }
    }
  }

  return specs;
}

// Encontra a seção de especificações no markdown
function findSpecsSection(markdown: string): string {
  // Procura por seções que tipicamente contêm especificações
  const specsSectionPatterns = [
    /#{1,3}\s*(?:Especifica[çc][õo]es?|Ficha\s*T[ée]cnica|Dados\s*T[ée]cnicos?|Caracter[íi]sticas)/i,
    /\*{2}(?:Especifica[çc][õo]es?|Ficha\s*T[ée]cnica)\*{2}/i,
  ];

  for (const pattern of specsSectionPatterns) {
    const match = markdown.search(pattern);
    if (match !== -1) {
      // Extrai a partir da seção encontrada até o final ou próxima seção major
      const section = markdown.substring(match);
      // Retorna até 5000 caracteres da seção de specs
      return section.substring(0, 5000);
    }
  }

  // Se não encontrou seção específica, retorna a segunda metade do markdown
  // (specs geralmente estão depois da descrição comercial)
  const midPoint = Math.floor(markdown.length / 2);
  return markdown.substring(midPoint, midPoint + 5000);
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

    // Step 1.5: Pré-processamento com regex para extrair specs diretamente
    const regexSpecs = extractSpecsFromMarkdown(markdown);
    console.log('Regex pre-extracted specs:', JSON.stringify(regexSpecs, null, 2));

    // Extract image URLs from links
    const imageUrls = links.filter((link: string) => 
      /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(link) ||
      link.includes('/images/') ||
      link.includes('/img/') ||
      link.includes('/photos/')
    ).slice(0, 10); // Limit to 10 images

    console.log('Found image URLs:', imageUrls.length);

    // Step 2: Send to Lovable AI for structured extraction
    // Enviamos tanto o início (descrição) quanto a seção de specs
    console.log('Sending to Lovable AI for extraction...');

    const specsSection = findSpecsSection(markdown);
    const basicSection = markdown.substring(0, 6000);

    const systemPrompt = `Você é um especialista em iates e embarcações. Sua tarefa é extrair informações estruturadas de páginas de fabricantes de iates.

IMPORTANTE: Extraia TODAS as especificações técnicas disponíveis. Preste atenção especial aos números e unidades.

Extraia as seguintes informações do conteúdo fornecido:
- brand: Nome do fabricante/marca (ex: OKEAN, Azimut, Ferretti)
- model: Nome/número do modelo (ex: 57, 42 Sport, X95)
- description: Descrição comercial do modelo (máximo 500 caracteres)
- specifications: Especificações técnicas incluindo:
  - length_overall: Comprimento total em metros (número decimal)
  - hull_length: Comprimento do casco em metros (número decimal)
  - beam: Boca/Largura máxima em metros (número decimal)
  - draft: Calado em metros (número decimal)
  - height_from_waterline: Altura da linha d'água/borda livre em metros
  - displacement_light: Deslocamento leve em kg (número inteiro)
  - displacement_loaded: Deslocamento carregado em kg (número inteiro)
  - dry_weight: Peso seco em kg (número inteiro)
  - fuel_capacity: Capacidade de combustível em litros (número inteiro)
  - water_capacity: Capacidade de água em litros (número inteiro)
  - passengers_capacity: Número máximo de passageiros/pessoas a bordo (número inteiro)
  - cabins: Número de cabines (número inteiro)
  - bathrooms: Número de banheiros (string, pode ser "3+1")
  - engines: Descrição completa dos motores (string)
  - max_speed: Velocidade máxima em nós (número decimal)
  - cruise_speed: Velocidade de cruzeiro em nós (número decimal)
  - range_nautical_miles: Autonomia em milhas náuticas (número inteiro)

REGRAS IMPORTANTES:
1. Converta todas as medidas para o sistema métrico (metros, litros, kg)
2. Se um valor estiver em pés, converta para metros (1 pé = 0.3048 metros)
3. Se um valor estiver em galões, converta para litros (1 galão = 3.785 litros)
4. Se uma informação não estiver disponível, NÃO inclua o campo
5. Seja preciso com os números, não invente valores
6. Para "Pessoas a Bordo" use passengers_capacity
7. Para "Combustível" use fuel_capacity
8. Para "Água Potável" use water_capacity`;

    const userPrompt = `Extraia as informações deste conteúdo de página de iate.

URL: ${formattedUrl}
Título da página: ${metadata.title || 'Não disponível'}

=== CONTEÚDO PRINCIPAL ===
${basicSection}

=== SEÇÃO DE ESPECIFICAÇÕES TÉCNICAS ===
${specsSection}`;

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
                      length_overall: { type: 'number', description: 'Comprimento Total in meters' },
                      hull_length: { type: 'number', description: 'Comprimento do Casco in meters' },
                      beam: { type: 'number', description: 'Boca Máxima in meters' },
                      draft: { type: 'number', description: 'Calado in meters' },
                      height_from_waterline: { type: 'number', description: 'Altura da linha d agua in meters' },
                      displacement_light: { type: 'number', description: 'Deslocamento leve in kg' },
                      displacement_loaded: { type: 'number', description: 'Deslocamento carregado in kg' },
                      dry_weight: { type: 'number', description: 'Peso seco in kg' },
                      fuel_capacity: { type: 'number', description: 'Combustível capacity in liters' },
                      water_capacity: { type: 'number', description: 'Água Potável capacity in liters' },
                      passengers_capacity: { type: 'number', description: 'Pessoas a Bordo max count' },
                      cabins: { type: 'number', description: 'Number of cabines' },
                      bathrooms: { type: 'string', description: 'Number of banheiros' },
                      engines: { type: 'string', description: 'Motorização description' },
                      max_speed: { type: 'number', description: 'Velocidade máxima in knots' },
                      cruise_speed: { type: 'number', description: 'Velocidade de cruzeiro in knots' },
                      range_nautical_miles: { type: 'number', description: 'Autonomia in nautical miles' }
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

    // Step 3: Merge regex specs with AI specs (regex has priority for numerical values)
    const mergedSpecs = { ...extractedData.specifications };
    
    for (const [key, value] of Object.entries(regexSpecs)) {
      // Se regex encontrou um valor e AI não, ou se é um valor numérico (regex é mais preciso)
      if (value !== undefined && value !== null) {
        const aiValue = mergedSpecs[key as keyof typeof mergedSpecs];
        if (aiValue === undefined || aiValue === null) {
          // AI não encontrou, usar regex
          (mergedSpecs as Record<string, number | string>)[key] = value;
          console.log(`Using regex value for ${key}:`, value);
        } else if (typeof value === 'number' && typeof aiValue === 'number') {
          // Ambos são números - preferir regex se os valores são próximos
          // (regex pode ter extraído valor mais preciso direto do texto)
          (mergedSpecs as Record<string, number | string>)[key] = value;
          console.log(`Overriding AI value with regex for ${key}:`, value, '(was:', aiValue, ')');
        }
      }
    }

    extractedData.specifications = mergedSpecs;

    console.log('Final extracted data:', JSON.stringify(extractedData, null, 2));

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedData,
        source: {
          url: formattedUrl,
          title: metadata.title,
          scrapedAt: new Date().toISOString()
        },
        debug: {
          regexSpecsCount: Object.keys(regexSpecs).length,
          aiSpecsCount: Object.keys(extractedData.specifications).length
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
