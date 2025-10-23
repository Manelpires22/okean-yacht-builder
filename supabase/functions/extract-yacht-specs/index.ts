import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { documentText } = await req.json();

    if (!documentText) {
      return new Response(
        JSON.stringify({ error: 'Texto do documento é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'Configuração de IA não disponível' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `Você é um especialista em especificações técnicas de iates. 
Analise o documento fornecido e extraia TODOS os dados possíveis, organizando-os nesta estrutura JSON:

{
  "basic_data": {
    "code": "código do modelo (ex: OK-52)",
    "name": "nome do modelo",
    "description": "descrição geral",
    "base_price": número em reais (apenas números, sem símbolos),
    "base_delivery_days": número de dias inteiro,
    "registration_number": "matrícula se houver",
    "delivery_date": "YYYY-MM-DD se houver"
  },
  "specifications": {
    "length_overall": número em metros com 2 decimais,
    "hull_length": número em metros com 2 decimais,
    "beam": número em metros com 2 decimais,
    "draft": número em metros com 2 decimais,
    "height_from_waterline": número em metros com 2 decimais,
    "dry_weight": número em kg inteiro,
    "displacement_light": número em kg inteiro,
    "displacement_loaded": número em kg inteiro,
    "fuel_capacity": número em litros inteiro,
    "water_capacity": número em litros inteiro,
    "passengers_capacity": número de pessoas inteiro,
    "cabins": número inteiro,
    "bathrooms": "texto (ex: 3+1)",
    "engines": "descrição dos motores",
    "hull_color": "cor do casco",
    "max_speed": número em nós com 1 decimal,
    "cruise_speed": número em nós com 1 decimal,
    "range_nautical_miles": número em milhas náuticas inteiro
  },
  "memorial_items": [
    {
      "category": "dimensoes|equipamentos|acabamento|eletrica|hidraulica|propulsao|outros",
      "description": "descrição do item",
      "specification": "especificação técnica"
    }
  ],
  "options": [
    {
      "name": "nome do opcional",
      "description": "descrição",
      "price": número em reais,
      "category": "categoria identificada"
    }
  ]
}

REGRAS IMPORTANTES:
- Se um campo não for encontrado no documento, retorne null
- Converta TODAS as unidades para o padrão brasileiro:
  * Pés para metros (dividir por 3.28084)
  * Libras para kg (dividir por 2.20462)
  * Galões para litros (multiplicar por 3.78541)
  * MPH para nós (dividir por 1.15078)
- Para preços, extraia apenas números (remova R$, $, vírgulas como separadores de milhares)
- Use vírgula como separador decimal nos números
- Identifique automaticamente a categoria correta de cada memorial item
- Para bathrooms, preserve formato texto (ex: "3+1", "2", "1 completo + 1 lavabo")
- Retorne APENAS o JSON, sem texto adicional antes ou depois`;

    console.log('Enviando texto para OpenAI GPT-5...');
    console.log('Tamanho do texto:', documentText.length, 'caracteres');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Documento a analisar:\n\n${documentText}` }
        ],
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API OpenAI:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Aguarde alguns instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'API Key do OpenAI inválida. Verifique a configuração.' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Erro ao processar com IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('Resposta da IA recebida:', aiResponse.substring(0, 200) + '...');

    // Parse JSON da resposta da IA
    let extractedData;
    try {
      // Tentar extrair JSON caso venha com markdown
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                        aiResponse.match(/```\s*([\s\S]*?)\s*```/);
      
      const jsonText = jsonMatch ? jsonMatch[1] : aiResponse;
      extractedData = JSON.parse(jsonText);
      
      console.log('Dados extraídos com sucesso');
      console.log('Campos básicos encontrados:', Object.keys(extractedData.basic_data || {}).length);
      console.log('Especificações encontradas:', Object.keys(extractedData.specifications || {}).length);
      console.log('Itens de memorial:', (extractedData.memorial_items || []).length);
      console.log('Opcionais:', (extractedData.options || []).length);
      
    } catch (parseError: any) {
      console.error('Erro ao fazer parse do JSON:', parseError);
      console.error('Resposta da IA:', aiResponse);
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao processar resposta da IA',
          details: parseError?.message || 'Erro desconhecido' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Erro na função extract-yacht-specs:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao processar documento',
        details: error?.message || 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
