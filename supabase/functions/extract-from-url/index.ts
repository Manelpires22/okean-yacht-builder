import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
const GOOGLE_SEARCH_ENGINE_ID = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID');

interface BasicExtractedData {
  brand: string | null;
  model: string | null;
  description: string | null;
  exteriorImages: string[];
  interiorImages: string[];
}

interface ValidationIssue {
  field: string;
  currentValue: number | string;
  issue: string;
  suggestion?: number | string;
  severity: 'warning' | 'error';
}

interface SpecsExtractedData {
  brand: string | null;
  model: string | null;
  description: string | null;
  images: string[];
  specifications: Record<string, number | string>;
  validationIssues?: ValidationIssue[];
  missingFields?: string[];
}

// Extrai TODAS as imagens do markdown da página, classificando por URL/contexto
function extractImagesFromMarkdown(markdown: string): { 
  exteriorImages: string[]; 
  interiorImages: string[] 
} {
  const exteriorImages: string[] = [];
  const interiorImages: string[] = [];
  const allImages: string[] = [];

  // Função para extrair URLs de uma seção
  const extractUrlsFromSection = (section: string): string[] => {
    const urls: string[] = [];
    
    // Tentar extrair de formato markdown ![alt](url)
    let match;
    const imgRegex = /\!\[.*?\]\((https?:\/\/[^\s\)]+)\)/gi;
    while ((match = imgRegex.exec(section)) !== null) {
      if (match[1]) urls.push(match[1]);
    }
    
    // Também pegar URLs diretas de imagens
    const urlRegex = /(https?:\/\/[^\s\)\]"']+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^\s\)\]"']*)?)/gi;
    while ((match = urlRegex.exec(section)) !== null) {
      if (match[1] && !urls.includes(match[1])) {
        urls.push(match[1]);
      }
    }
    
    return urls;
  };

  // Padrões para identificar seções de imagens externas/exteriores
  const externalPatterns = [
    /#{1,3}\s*(?:Imagens?\s*Extern[ao]s?|Exterior|Fotos?\s*Extern[ao]s?|Galeria\s*Extern[ao]?|Gallery\s*Exterior|Exterior\s*Gallery|Exterior\s*Photos?)\s*([\s\S]*?)(?=#{1,3}|$)/i,
  ];

  // Padrões para identificar seções de imagens internas/interiores
  const internalPatterns = [
    /#{1,3}\s*(?:Imagens?\s*Intern[ao]s?|Interior|Fotos?\s*Intern[ao]s?|Galeria\s*Intern[ao]?|Gallery\s*Interior|Interior\s*Gallery|Interior\s*Photos?)\s*([\s\S]*?)(?=#{1,3}|$)/i,
  ];

  // Tentar encontrar seção de imagens externas
  for (const pattern of externalPatterns) {
    const match = markdown.match(pattern);
    if (match && match[1]) {
      const urls = extractUrlsFromSection(match[1]);
      exteriorImages.push(...urls);
      console.log(`Found ${urls.length} exterior images in section`);
      break;
    }
  }

  // Tentar encontrar seção de imagens internas
  for (const pattern of internalPatterns) {
    const match = markdown.match(pattern);
    if (match && match[1]) {
      const urls = extractUrlsFromSection(match[1]);
      interiorImages.push(...urls);
      console.log(`Found ${urls.length} interior images in section`);
      break;
    }
  }

  // Se não encontrou seções, extrair TODAS as imagens e classificar por URL
  if (exteriorImages.length === 0 && interiorImages.length === 0) {
    const allPageImages = extractUrlsFromSection(markdown);
    console.log(`No sections found, extracting all ${allPageImages.length} images from page`);
    
    // Classificar por URL patterns
    const interiorKeywords = ['interior', 'cabin', 'saloon', 'galley', 'bedroom', 'bathroom', 'cockpit', 'helm', 'salon', 'berth', 'stateroom', 'head', 'master', 'guest', 'vip', 'crew'];
    const exteriorKeywords = ['exterior', 'hull', 'deck', 'bow', 'stern', 'profile', 'side', 'aerial', 'drone', 'water', 'sea', 'marina', 'port', 'running', 'cruising'];
    const excludeKeywords = ['logo', 'icon', 'favicon', 'thumbnail', 'banner', 'header', 'footer', 'avatar', 'badge', 'button'];
    
    for (const imgUrl of allPageImages) {
      const urlLower = imgUrl.toLowerCase();
      
      // Ignorar logos, ícones, etc.
      if (excludeKeywords.some(kw => urlLower.includes(kw))) {
        continue;
      }
      
      if (interiorKeywords.some(kw => urlLower.includes(kw))) {
        interiorImages.push(imgUrl);
      } else if (exteriorKeywords.some(kw => urlLower.includes(kw))) {
        exteriorImages.push(imgUrl);
      } else {
        // Se não tem keyword, colocar como exterior (padrão)
        allImages.push(imgUrl);
      }
    }
    
    // Se ainda não classificou nada, dividir as imagens restantes igualmente
    if (exteriorImages.length === 0 && interiorImages.length === 0 && allImages.length > 0) {
      // Primeiras 60% como exterior, resto como interior
      const exteriorCount = Math.ceil(allImages.length * 0.6);
      exteriorImages.push(...allImages.slice(0, exteriorCount));
      interiorImages.push(...allImages.slice(exteriorCount));
      console.log(`Divided ${allImages.length} unclassified images: ${exteriorCount} exterior, ${allImages.length - exteriorCount} interior`);
    } else if (allImages.length > 0) {
      // Adicionar imagens não classificadas ao exterior
      exteriorImages.push(...allImages);
    }
  }

  // Remover duplicatas e limitar
  return { 
    exteriorImages: [...new Set(exteriorImages)].slice(0, 20), 
    interiorImages: [...new Set(interiorImages)].slice(0, 20)
  };
}

// Função removida - extração limitada apenas ao conteúdo da página

// Corrige parsing de números no formato brasileiro (25.000,50 = 25000.50)
function parseBrazilianNumber(str: string): number | null {
  if (!str) return null;
  
  // Remove espaços
  str = str.replace(/\s/g, '');
  
  // Formato brasileiro: 25.000,50 → 25000.50
  if (str.includes('.') && str.includes(',')) {
    // Ponto como milhar, vírgula como decimal
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes('.')) {
    // Pode ser 25.000 (milhar) ou 25.5 (decimal)
    const parts = str.split('.');
    if (parts[1] && parts[1].length === 3) {
      // 25.000 → 25000 (milhar)
      str = str.replace('.', '');
    }
    // Se tem menos de 3 dígitos após o ponto, é decimal (25.5)
  } else if (str.includes(',')) {
    // 25,5 → 25.5 (decimal)
    str = str.replace(',', '.');
  }
  
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

// Valida especificações com "senso comum" para detectar valores absurdos
function validateSpecifications(
  specs: Record<string, number | string>
): { issues: ValidationIssue[]; missingFields: string[] } {
  const issues: ValidationIssue[] = [];
  const missingFields: string[] = [];
  
  const length = typeof specs.length_overall === 'number' ? specs.length_overall : null;
  
  // Campos importantes que podem estar faltando
  const importantFields = [
    'length_overall', 'beam', 'displacement_loaded', 'fuel_capacity', 'water_capacity'
  ];
  
  for (const field of importantFields) {
    if (specs[field] === undefined || specs[field] === null || specs[field] === 0) {
      missingFields.push(field);
    }
  }
  
  // Regra: Deslocamento típico de iate está entre 1.000kg e 500.000kg
  if (typeof specs.displacement_loaded === 'number') {
    const disp = specs.displacement_loaded;
    if (disp < 500 && length && length > 10) {
      // Provavelmente está em toneladas ou faltou zeros
      issues.push({
        field: 'displacement_loaded',
        currentValue: disp,
        issue: `${disp} kg é muito leve para um iate de ${length}m. Deveria ser ${disp * 1000} kg (${disp} toneladas)?`,
        suggestion: disp * 1000,
        severity: 'error'
      });
    } else if (disp > 500000) {
      issues.push({
        field: 'displacement_loaded',
        currentValue: disp,
        issue: `${disp} kg parece excessivamente pesado. Verifique a unidade.`,
        severity: 'warning'
      });
    }
  }
  
  // Regra: Deslocamento leve
  if (typeof specs.displacement_light === 'number') {
    const disp = specs.displacement_light;
    if (disp < 500 && length && length > 10) {
      issues.push({
        field: 'displacement_light',
        currentValue: disp,
        issue: `${disp} kg é muito leve para um iate de ${length}m. Deveria ser ${disp * 1000} kg?`,
        suggestion: disp * 1000,
        severity: 'error'
      });
    }
  }
  
  // Nota: Comprimento total (length_overall) PODE ser maior que comprimento do casco (hull_length)
  // porque inclui extensões como plataformas de popa, púlpitos, etc.
  // Por isso NÃO validamos essa relação - ambos os cenários são válidos.
  
  // Regra: Boca máxima proporcional ao comprimento (tipicamente 20-35% do comprimento)
  if (typeof specs.beam === 'number' && length) {
    const beamRatio = specs.beam / length;
    if (beamRatio > 0.5) {
      issues.push({
        field: 'beam',
        currentValue: specs.beam,
        issue: `Boca de ${specs.beam}m parece muito larga para comprimento de ${length}m`,
        severity: 'warning'
      });
    } else if (beamRatio < 0.1) {
      issues.push({
        field: 'beam',
        currentValue: specs.beam,
        issue: `Boca de ${specs.beam}m parece muito estreita para comprimento de ${length}m`,
        severity: 'warning'
      });
    }
  }
  
  // Regra: Capacidade de combustível razoável para o tamanho
  if (typeof specs.fuel_capacity === 'number' && length) {
    const fuel = specs.fuel_capacity;
    if (length > 10 && fuel < 100) {
      issues.push({
        field: 'fuel_capacity',
        currentValue: fuel,
        issue: `${fuel} litros é muito pouco para um iate de ${length}m. Deveria ser ${fuel * 10}L?`,
        suggestion: fuel * 10,
        severity: 'warning'
      });
    }
  }
  
  // Regra: Capacidade de água razoável
  if (typeof specs.water_capacity === 'number' && length) {
    const water = specs.water_capacity;
    if (length > 10 && water < 50) {
      issues.push({
        field: 'water_capacity',
        currentValue: water,
        issue: `${water} litros de água é muito pouco para um iate de ${length}m. Deveria ser ${water * 10}L?`,
        suggestion: water * 10,
        severity: 'warning'
      });
    }
  }
  
  // Regra: Velocidade máxima razoável (típico: 20-50 nós para iates de motor)
  if (typeof specs.max_speed === 'number') {
    const speed = specs.max_speed;
    if (speed > 100) {
      issues.push({
        field: 'max_speed',
        currentValue: speed,
        issue: `${speed} nós é uma velocidade improvável para um iate. Verifique a unidade.`,
        severity: 'warning'
      });
    }
  }
  
  // Regra: Velocidade de cruzeiro deve ser menor que máxima
  if (typeof specs.cruise_speed === 'number' && typeof specs.max_speed === 'number') {
    if (specs.cruise_speed > specs.max_speed) {
      issues.push({
        field: 'cruise_speed',
        currentValue: specs.cruise_speed,
        issue: `Velocidade de cruzeiro (${specs.cruise_speed}) não pode ser maior que máxima (${specs.max_speed})`,
        severity: 'error'
      });
    }
  }
  
  return { issues, missingFields };
}

// Pré-processamento com regex para extrair especificações diretamente do markdown
function extractSpecsFromMarkdown(markdown: string): Record<string, number | string> {
  const specs: Record<string, number | string> = {};
  
  const extractNumber = (match: RegExpMatchArray | null): number | null => {
    if (!match || !match[1]) return null;
    return parseBrazilianNumber(match[1]);
  };

  const patterns: Array<{ key: string; regex: RegExp; isString?: boolean }> = [
    { key: 'length_overall', regex: /Comprimento\s*Total[*\s:]*(\d+[\d.,\s]*\d*)\s*(Metros?|m)?/i },
    { key: 'hull_length', regex: /Comprimento\s*(?:do\s*)?Casco[*\s:]*(\d+[\d.,\s]*\d*)\s*(Metros?|m)?/i },
    { key: 'beam', regex: /Boca\s*(?:Máxima)?[*\s:]*(\d+[\d.,\s]*\d*)\s*(Metros?|m)?/i },
    { key: 'draft', regex: /Calado[*\s:]*(\d+[\d.,\s]*\d*)\s*(Metros?|m)?/i },
    { key: 'height_from_waterline', regex: /Altura\s*(?:da\s*)?(?:Linha\s*(?:d['']?[aá]gua)?|Borda\s*Livre)[*\s:]*(\d+[\d.,\s]*\d*)\s*(Metros?|m)?/i },
    { key: 'displacement_loaded', regex: /Deslocamento\s*(?:Carregado|Total)[*\s:]*(\d+[\d.,\s]*\d*)\s*(?:kg|quilos?|ton)?/i },
    { key: 'displacement_light', regex: /Deslocamento\s*(?:Leve|Sem\s*Carga)[*\s:]*(\d+[\d.,\s]*\d*)\s*(?:kg|quilos?|ton)?/i },
    { key: 'dry_weight', regex: /Peso\s*(?:Seco|a\s*Seco)[*\s:]*(\d+[\d.,\s]*\d*)\s*(?:kg|quilos?|ton)?/i },
    { key: 'fuel_capacity', regex: /(?:Combust[ií]vel|Tanque\s*(?:de\s*)?Combust[ií]vel|Diesel)[*\s:]*(\d+[\d.,\s]*\d*)\s*(?:litros?|L)?/i },
    { key: 'water_capacity', regex: /(?:[ÁA]gua\s*(?:Pot[áa]vel|Doce)?|Tanque\s*(?:de\s*)?[ÁA]gua)[*\s:]*(\d+[\d.,\s]*\d*)\s*(?:litros?|L)?/i },
    { key: 'passengers_capacity', regex: /(?:Pessoas?\s*(?:a\s*)?Bordo|Passageiros?|Capacidade)[*\s:]*(\d+)/i },
    { key: 'cabins', regex: /Cabin(?:e|s)[*\s:]*(\d+)/i },
    { key: 'bathrooms', regex: /(?:Banheiros?|WC|Lavabos?)[*\s:]*(\d+(?:\s*\+\s*\d+)?)/i, isString: true },
    { key: 'max_speed', regex: /(?:Velocidade\s*)?M[áa]xima[*\s:]*(\d+[\d.,\s]*\d*)\s*(?:n[óo]s?|kts?)?/i },
    { key: 'cruise_speed', regex: /(?:Velocidade\s*(?:de\s*)?)?Cruzeiro[*\s:]*(\d+[\d.,\s]*\d*)\s*(?:n[óo]s?|kts?)?/i },
    { key: 'range_nautical_miles', regex: /(?:Autonomia|Alcance)[*\s:]*(\d+[\d.,\s]*\d*)\s*(?:milhas?\s*n[áa]uticas?|NM|mn)?/i },
    // Regex melhorado para capturar **Motor** em formato markdown com negrito
    { key: 'engines', regex: /\*{0,2}Motor(?:es|iza[çc][ãa]o)?\*{0,2}[\s:]+(.+?)(?=\n\n|\n###|\n\*{2}Transmiss[ãa]o|\*{2}Transmiss[ãa]o|$)/i, isString: true },
    { key: 'hull_color', regex: /(?:Cor(?:\s*do)?\s*Casco)[*\s:]*(.+?)(?:\n|\||$)/i, isString: true },
  ];

  for (const { key, regex, isString } of patterns) {
    const match = markdown.match(regex);
    if (match) {
      if (isString) {
        let value = match[1]?.trim();
        if (value) {
          // Limpar caracteres escapados do markdown (\| → |)
          value = value.replace(/\\([|])/g, '$1');
          specs[key] = value;
        }
      } else {
        const num = extractNumber(match);
        if (num !== null) {
          specs[key] = num;
        }
      }
    }
  }

  return specs;
}

function findSpecsSection(markdown: string): string {
  const specsSectionPatterns = [
    /#{1,3}\s*(?:Especifica[çc][õo]es?|Ficha\s*T[ée]cnica|Dados\s*T[ée]cnicos?|Caracter[íi]sticas)/i,
    /\*{2}(?:Especifica[çc][õo]es?|Ficha\s*T[ée]cnica)\*{2}/i,
  ];

  for (const pattern of specsSectionPatterns) {
    const match = markdown.search(pattern);
    if (match !== -1) {
      const section = markdown.substring(match);
      return section.substring(0, 5000);
    }
  }

  const midPoint = Math.floor(markdown.length / 2);
  return markdown.substring(midPoint, midPoint + 5000);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, mode = 'basic', includeSpecs = false } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'Lovable AI não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping URL:', formattedUrl, 'mode:', mode);

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
        onlyMainContent: false,
        waitFor: 2000,
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
    const metadata = firecrawlData.data?.metadata || firecrawlData.metadata || {};

    console.log('Firecrawl response - markdown length:', markdown.length);

    // MODE: BASIC - Extrai apenas marca, modelo, descrição e busca imagens categorizadas
    if (mode === 'basic') {
      // Extract basic info with AI
      const basicPrompt = `Extraia APENAS as informações básicas deste conteúdo de iate/embarcação:
- brand: Nome do fabricante/marca
- model: Nome/número do modelo
- description: Descrição comercial (máximo 300 caracteres)

Conteúdo:
${markdown.substring(0, 4000)}`;

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'Você extrai informações básicas de iates. Responda apenas com os dados solicitados.' },
            { role: 'user', content: basicPrompt }
          ],
          tools: [{
            type: 'function',
            function: {
              name: 'extract_basic_data',
              description: 'Extract basic yacht data',
              parameters: {
                type: 'object',
                properties: {
                  brand: { type: 'string' },
                  model: { type: 'string' },
                  description: { type: 'string' }
                },
                required: ['brand', 'model']
              }
            }
          }],
          tool_choice: { type: 'function', function: { name: 'extract_basic_data' } }
        }),
      });

      let brand = null;
      let model = null;
      let description = null;

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            brand = args.brand || null;
            model = args.model || null;
            description = args.description || null;
          } catch (e) {
            console.error('Error parsing AI response:', e);
          }
        }
      }

      console.log('Extracted basic data:', { brand, model });

      // Primeiro: Tentar extrair imagens diretamente do markdown da página
      const pageImages = extractImagesFromMarkdown(markdown);
      let exteriorImages = pageImages.exteriorImages;
      let interiorImages = pageImages.interiorImages;

      console.log('Page images extracted:', { 
        exterior: exteriorImages.length, 
        interior: interiorImages.length 
      });

      // Usar APENAS imagens encontradas na página (sem busca externa)
      console.log('Using only page images - no external search');

      const result: BasicExtractedData = {
        brand,
        model,
        description,
        exteriorImages,
        interiorImages
      };

      console.log('Basic extraction result:', { 
        brand, model, 
        exteriorCount: exteriorImages.length, 
        interiorCount: interiorImages.length 
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: result,
          source: { url: formattedUrl, title: metadata.title }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // MODE: SPECS - Extrai especificações técnicas (para aba de especificações)
    const regexSpecs = extractSpecsFromMarkdown(markdown);
    console.log('Regex pre-extracted specs:', Object.keys(regexSpecs).length);

    const links = firecrawlData.data?.links || firecrawlData.links || [];
    const imageUrls = links.filter((link: string) => 
      /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(link) ||
      link.includes('/images/') ||
      link.includes('/img/')
    ).slice(0, 10);

    const specsSection = findSpecsSection(markdown);
    const basicSection = markdown.substring(0, 6000);

    const systemPrompt = `Você é um especialista em iates. Extraia TODAS as especificações técnicas disponíveis.

Campos a extrair:
- brand, model, description
- specifications: length_overall, hull_length, beam, draft, height_from_waterline, displacement_light, displacement_loaded, dry_weight, fuel_capacity, water_capacity, passengers_capacity, cabins, bathrooms, engines, hull_color, max_speed, cruise_speed, range_nautical_miles

IMPORTANTE sobre engines/motorização:
- Extraia a especificação COMPLETA dos motores incluindo marca, modelo e potência
- Exemplo: "2x Volvo D8 IPS800 600HP" ou "Volvo D11 IPS950 725HP"
- Se houver opções, liste todas separadas por " | "

Converta para sistema métrico (metros, litros, kg). Seja preciso com números.
Para hull_color, extraia a cor padrão do casco se disponível (ex: "Branco", "Azul marinho").`;

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
          { role: 'user', content: `URL: ${formattedUrl}\n\n=== CONTEÚDO ===\n${basicSection}\n\n=== SPECS ===\n${specsSection}` }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'extract_yacht_data',
            description: 'Extract structured yacht data',
            parameters: {
              type: 'object',
              properties: {
                brand: { type: 'string' },
                model: { type: 'string' },
                description: { type: 'string' },
                specifications: {
                  type: 'object',
                  properties: {
                    length_overall: { type: 'number' },
                    hull_length: { type: 'number' },
                    beam: { type: 'number' },
                    draft: { type: 'number' },
                    height_from_waterline: { type: 'number' },
                    displacement_light: { type: 'number' },
                    displacement_loaded: { type: 'number' },
                    dry_weight: { type: 'number' },
                    fuel_capacity: { type: 'number' },
                    water_capacity: { type: 'number' },
                    passengers_capacity: { type: 'number' },
                    cabins: { type: 'number' },
                    bathrooms: { type: 'string' },
                    engines: { type: 'string' },
                    hull_color: { type: 'string' },
                    max_speed: { type: 'number' },
                    cruise_speed: { type: 'number' },
                    range_nautical_miles: { type: 'number' }
                  }
                }
              },
              required: ['brand', 'model']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'extract_yacht_data' } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Limite de requisições excedido' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao processar com IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    
    let extractedData: SpecsExtractedData = {
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
      } catch (e) {
        console.error('Error parsing AI response:', e);
      }
    }

    // Merge regex specs with AI specs (regex has priority)
    const mergedSpecs = { ...extractedData.specifications };
    for (const [key, value] of Object.entries(regexSpecs)) {
      if (value !== undefined && value !== null) {
        const aiValue = mergedSpecs[key as keyof typeof mergedSpecs];
        if (aiValue === undefined || aiValue === null || typeof value === 'number') {
          (mergedSpecs as Record<string, number | string>)[key] = value;
        }
      }
    }
    extractedData.specifications = mergedSpecs;

    // Validar especificações com "senso comum"
    const validation = validateSpecifications(mergedSpecs);
    extractedData.validationIssues = validation.issues;
    extractedData.missingFields = validation.missingFields;

    console.log('Validation result:', {
      issuesCount: validation.issues.length,
      missingCount: validation.missingFields.length
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedData,
        source: { url: formattedUrl, title: metadata.title }
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
