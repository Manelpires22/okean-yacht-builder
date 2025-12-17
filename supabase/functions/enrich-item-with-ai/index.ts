import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  brand?: string;
  model?: string;
  suggestedImages: string[];
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

    // Determine item type label in Portuguese
    const typeLabels = {
      optional: 'um opcional',
      upgrade: 'um upgrade',
      memorial: 'um item do memorial descritivo'
    };

    // Build the prompt
    const systemPrompt = `Você é um especialista em equipamentos náuticos e de luxo para iates. 
Você está ajudando a criar descrições técnicas e comerciais para um sistema de configuração de iates de luxo da OKEAN Yachts.
Suas respostas devem ser profissionais, técnicas e destacar os benefícios para proprietários de iates de luxo.
Responda SEMPRE em português brasileiro.`;

    const userPrompt = `Baseado no nome do item "${name}"${brand ? `, marca "${brand}"` : ''}${model ? `, modelo "${model}"` : ''}, que é ${typeLabels[type]} para iates de luxo OKEAN, gere:

1. Uma descrição técnica e comercial detalhada (2-3 parágrafos curtos, máximo 500 caracteres)
2. Se não informado, sugira uma marca conhecida no segmento náutico (se aplicável)
3. Se não informado, sugira um modelo específico (se aplicável)
4. Palavras-chave para busca de imagens

${context ? `Contexto adicional: ${context}` : ''}

Responda EXATAMENTE no formato JSON abaixo:
{
  "description": "Descrição técnica e comercial do item...",
  "suggestedBrand": "Marca sugerida ou null se já informada",
  "suggestedModel": "Modelo sugerido ou null se já informado",
  "imageSearchTerms": ["termo1", "termo2", "termo3"]
}`;

    // Call OpenAI
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
        temperature: 0.7,
        max_tokens: 1000,
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
      // Fallback: use the raw content as description
      parsedContent = {
        description: content.substring(0, 500),
        suggestedBrand: null,
        suggestedModel: null,
        imageSearchTerms: [name]
      };
    }

    // Generate image search URLs (using Unsplash API for yacht/marine equipment)
    const searchTerms = parsedContent.imageSearchTerms || [name];
    const suggestedImages: string[] = [];
    
    // Generate Unsplash URLs for suggested images
    for (const term of searchTerms.slice(0, 2)) {
      const encodedTerm = encodeURIComponent(`yacht ${term} marine luxury`);
      suggestedImages.push(`https://source.unsplash.com/800x600/?${encodedTerm}`);
    }

    const result: EnrichmentResponse = {
      description: parsedContent.description || '',
      brand: brand ? undefined : parsedContent.suggestedBrand,
      model: model ? undefined : parsedContent.suggestedModel,
      suggestedImages,
    };

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
