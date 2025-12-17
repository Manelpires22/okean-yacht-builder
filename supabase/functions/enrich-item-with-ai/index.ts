import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Known brand patterns for pre-processing
const BRAND_PATTERNS: Record<string, { brand: string; line?: string; type?: string }> = {
  'MC²': { brand: 'CMC Marine', line: 'MC²', type: 'stabilizer' },
  'MC2': { brand: 'CMC Marine', line: 'MC²', type: 'stabilizer' },
  'Seakeeper': { brand: 'Seakeeper', type: 'stabilizer' },
  'Garmin': { brand: 'Garmin', type: 'electronics' },
  'Raymarine': { brand: 'Raymarine', type: 'electronics' },
  'Simrad': { brand: 'Simrad', type: 'electronics' },
  'Furuno': { brand: 'Furuno', type: 'electronics' },
  'Volvo Penta': { brand: 'Volvo Penta', type: 'propulsion' },
  'Caterpillar': { brand: 'Caterpillar', type: 'propulsion' },
  'MAN': { brand: 'MAN', type: 'propulsion' },
  'Kohler': { brand: 'Kohler', type: 'generator' },
  'Onan': { brand: 'Onan', type: 'generator' },
  'Fischer Panda': { brand: 'Fischer Panda', type: 'generator' },
  'Webasto': { brand: 'Webasto', type: 'climate' },
  'Dometic': { brand: 'Dometic', type: 'climate' },
  'Fusion': { brand: 'Fusion', type: 'audio' },
  'JL Audio': { brand: 'JL Audio', type: 'audio' },
  'Bose': { brand: 'Bose', type: 'audio' },
  'Lewmar': { brand: 'Lewmar', type: 'deck_equipment' },
  'Maxwell': { brand: 'Maxwell', type: 'deck_equipment' },
  'Besenzoni': { brand: 'Besenzoni', type: 'deck_equipment' },
  'FLIR': { brand: 'FLIR', type: 'camera' },
  'Zipwake': { brand: 'Zipwake', type: 'trim' },
  'Humphree': { brand: 'Humphree', type: 'stabilizer' },
};

interface EnrichmentRequest {
  name: string;
  type: 'optional' | 'upgrade' | 'memorial';
  brand?: string;
  model?: string;
  context?: string;
}

interface EnrichmentResponse {
  description: string;
  extracted_brand: string | null;
  extracted_model: string | null;
  brand_confidence: number;
  needs_human_review: boolean;
  reasoning: string;
}

// Pre-process name to extract known brands
function extractKnownBrand(name: string): { brand: string; line?: string } | null {
  const upperName = name.toUpperCase();
  for (const [pattern, info] of Object.entries(BRAND_PATTERNS)) {
    if (upperName.includes(pattern.toUpperCase())) {
      return { brand: info.brand, line: info.line };
    }
  }
  return null;
}

// Extract model from name (usually alphanumeric codes)
function extractModelFromName(name: string): string | null {
  // Look for patterns like X19, 850, A50, etc.
  const modelMatch = name.match(/\b([A-Z]?\d+[A-Z]?)\b/i);
  return modelMatch ? modelMatch[1].toUpperCase() : null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    const { name, type, brand, model, context }: EnrichmentRequest = await req.json();

    if (!name) {
      throw new Error('Nome do item é obrigatório');
    }

    console.log(`Enriquecendo item: ${name} (${type})`);

    // Pre-process: try to extract known brand from name
    const knownBrand = extractKnownBrand(name);
    const extractedModel = extractModelFromName(name);
    
    console.log('Pre-processing results:', { knownBrand, extractedModel });

    // Determine item type label in Portuguese
    const typeLabels = {
      optional: 'um opcional',
      upgrade: 'um upgrade',
      memorial: 'um item do memorial descritivo'
    };

    // Build the prompt with anti-hallucination rules
    const systemPrompt = `Você é um especialista em equipamentos náuticos para iates de luxo.
Sua função é criar descrições COMERCIAIS baseadas no contexto dado.

REGRAS ABSOLUTAS - SIGA À RISCA:
1. NUNCA invente marca ou modelo se não estiver EXPLÍCITO no nome do item ou já informado
2. Se a marca/modelo já foi informada pelo sistema, USE essa informação
3. Foque em benefícios REAIS do tipo de equipamento, não invente especificações técnicas
4. A descrição deve ser comercial e vendedora, mas HONESTA - sem promessas impossíveis
5. Máximo 400 caracteres na descrição
6. Se não conseguir identificar marca/modelo com 100% de certeza, retorne null
7. NUNCA confunda marcas similares (ex: MC² é CMC Marine, NÃO é Seakeeper)`;

    const userPrompt = `Item: "${name}"
Marca informada pelo sistema: ${knownBrand?.brand || brand || "NÃO IDENTIFICADA"}
Modelo informado: ${model || extractedModel || "NÃO IDENTIFICADO"}
Tipo: ${typeLabels[type]}
${context ? `Contexto adicional: ${context}` : ''}

TAREFA:
1. Gere uma descrição comercial (max 400 chars) focada nos BENEFÍCIOS REAIS deste tipo de equipamento
2. NÃO INVENTE marca/modelo. Use APENAS o que foi informado acima ou o que conseguir EXTRAIR do nome com 100% certeza
3. Indique sua confiança na identificação (0.0 a 1.0)

Responda EXATAMENTE neste formato JSON (sem markdown, sem backticks):
{
  "description": "descrição comercial focada em benefícios reais",
  "extracted_brand": "${knownBrand?.brand || brand || 'null se não identificada'}",
  "extracted_model": "${model || extractedModel || 'null se não identificado'}",
  "brand_confidence": 0.0-1.0,
  "needs_human_review": true/false,
  "reasoning": "explicação curta de como identificou ou por que não identificou"
}`;

    // Call OpenAI with lower temperature for more deterministic results
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2, // Low temperature for more deterministic results
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`Erro na API OpenAI: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Resposta vazia da IA');
    }

    console.log('OpenAI response:', content);

    // Parse JSON response from GPT
    let parsedContent;
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('JSON não encontrado na resposta');
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      // Fallback with human review required
      parsedContent = {
        description: content.substring(0, 400),
        extracted_brand: knownBrand?.brand || null,
        extracted_model: extractedModel || null,
        brand_confidence: 0.3,
        needs_human_review: true,
        reasoning: "Falha ao processar resposta da IA - revisão manual necessária"
      };
    }

    // Validate and normalize response
    const result: EnrichmentResponse = {
      description: parsedContent.description || '',
      extracted_brand: parsedContent.extracted_brand === 'null' ? null : (parsedContent.extracted_brand || knownBrand?.brand || null),
      extracted_model: parsedContent.extracted_model === 'null' ? null : (parsedContent.extracted_model || extractedModel || null),
      brand_confidence: typeof parsedContent.brand_confidence === 'number' 
        ? Math.min(1, Math.max(0, parsedContent.brand_confidence)) 
        : 0.5,
      needs_human_review: parsedContent.needs_human_review ?? (parsedContent.brand_confidence < 0.7),
      reasoning: parsedContent.reasoning || 'Sem justificativa',
    };

    // If we used pre-processing to identify brand, boost confidence
    if (knownBrand && result.extracted_brand === knownBrand.brand) {
      result.brand_confidence = Math.max(result.brand_confidence, 0.95);
      result.needs_human_review = false;
    }

    console.log('Enrichment result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in enrich-item-with-ai:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
