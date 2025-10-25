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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY não configurada');
      return new Response(
        JSON.stringify({ error: 'Configuração de IA não disponível' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `Você é um especialista em especificações técnicas de iates. 
Extraia TODOS os dados possíveis do documento fornecido.

# ESTRATÉGIA DE EXTRAÇÃO

## 1. IDENTIFICAR MODELO E CÓDIGO (⚠️ PRIORIDADE ABSOLUTA)
O código do modelo está SEMPRE no nome do arquivo ou no início do documento.

Passos para identificar corretamente:
1. Procure no INÍCIO do documento por padrões como "FY###", "OK-##", "AZIMUT-##"
2. Verifique se há título com código (ex: "FY670 - Memorial Descritivo", "Ferretti Yachts 670")
3. O código é geralmente uma SIGLA/ABREVIAÇÃO (2-6 caracteres + número)
4. ❌ NUNCA use códigos de outros modelos mencionados no documento
5. ❌ NUNCA invente um código - se não encontrar claramente, retorne null

Exemplos CORRETOS:
- "FY670" → código: "FY670", nome: "Ferretti Yachts 670"
- "OK-52" → código: "OK-52", nome: "OKEAN 52"
- "AZIMUT-60" → código: "AZIMUT-60"

## 2. LOCALIZAR SEÇÕES POR TÍTULOS
- "ESPECIFICAÇÕES TÉCNICAS" ou "DIMENSÕES" → extrair specs técnicas
- "MEMORIAL DESCRITIVO" ou "MEMORIAL PADRÃO" → extrair memorial_items
- "OPCIONAIS" ou "OPCIONAIS SUGERIDOS" → extrair options

## 3. PARSE DE LISTAS NUMERADAS
- "1. Item description" → extrair como memorial_item ou option
- Identifique a categoria pela área mencionada

## 4. CONVERSÃO DE UNIDADES
- Metros (m) → manter em metros (formato decimal com ponto)
- Quilogramas (Kg) → converter para kg (remover pontos/vírgulas)
- Litros (l) → manter em litros
- HP → extrair para campo "engines"
- Nós → manter em nós

## 5. MAPEAMENTO DE CATEGORIAS

**equipamentos**: Molinete, guincho, bow/stern thruster, geradores, bombas, âncoras, plataforma de banho
**acabamento**: Teca, madeira, carpete, piso, estofados, sofás, portas, janelas, móveis
**eletrica**: Painéis, baterias, inversores, iluminação, luzes, tomadas, som, TVs
**hidraulica**: Tanques, bombas, válvulas, sistemas de água, chuveiros, torneiras
**propulsao**: Motores, hélices, eixos, transmissão, sistemas de direção
**seguranca**: Coletes, balsas, sinalizadores, extintores, EPIs, alarmes
**navegacao**: GPS, radar, sonar, piloto automático, VHF, comunicação
**conforto**: TVs, som, entretenimento, geladeiras, ar-condicionado, aquecedores
**outros**: Itens que não se encaixam nas categorias acima

REGRAS:
- Use null para campos não encontrados
- Preserve formatação de números com ponto (ex: 26.14)
- Para memorial items, mantenha descrições completas
- Para opcionais, extraia nome curto e descrição completa
- ⚠️ O código do modelo é CRÍTICO - procure no TÍTULO/INÍCIO do documento`;

    console.log('📄 Enviando texto para Lovable AI (Gemini 2.5 Pro - Large Context)...');
    console.log('📊 Tamanho do texto:', documentText.length, 'caracteres');
    console.log('🔧 Usando tool calling para JSON estruturado...');

    // Define schema for structured output via tool calling
    const toolDefinition = {
      type: "function",
      function: {
        name: "extract_yacht_specifications",
        description: "Extract yacht specifications, memorial items, and options from document",
        parameters: {
          type: "object",
          properties: {
            basic_data: {
              type: "object",
              properties: {
                code: { type: "string", description: "Model code (e.g., FY850, OK-52)" },
                name: { type: "string", description: "Full model name" },
                description: { type: "string", description: "General description" },
                base_price: { type: ["number", "null"], description: "Base price in BRL" },
                base_delivery_days: { type: ["integer", "null"], description: "Delivery days" },
                registration_number: { type: ["string", "null"], description: "Registration number" },
                delivery_date: { type: ["string", "null"], description: "Delivery date (YYYY-MM-DD)" }
              },
              required: ["code", "name"]
            },
            specifications: {
              type: "object",
              properties: {
                length_overall: { type: ["number", "null"] },
                hull_length: { type: ["number", "null"] },
                beam: { type: ["number", "null"] },
                draft: { type: ["number", "null"] },
                height_from_waterline: { type: ["number", "null"] },
                dry_weight: { type: ["number", "null"] },
                displacement_light: { type: ["number", "null"] },
                displacement_loaded: { type: ["number", "null"] },
                fuel_capacity: { type: ["number", "null"] },
                water_capacity: { type: ["number", "null"] },
                passengers_capacity: { type: ["integer", "null"] },
                cabins: { type: ["integer", "null"] },
                bathrooms: { type: ["string", "null"] },
                engines: { type: ["string", "null"] },
                hull_color: { type: ["string", "null"] },
                max_speed: { type: ["number", "null"] },
                cruise_speed: { type: ["number", "null"] },
                range_nautical_miles: { type: ["number", "null"] }
              }
            },
            memorial_items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { 
                    type: "string",
                    enum: ["equipamentos", "acabamento", "eletrica", "hidraulica", "propulsao", "seguranca", "navegacao", "conforto", "outros"]
                  },
                  description: { type: "string" },
                  specification: { type: ["string", "null"] }
                },
                required: ["category", "description"]
              }
            },
            options: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  price: { type: ["number", "null"] },
                  category: { type: "string" }
                },
                required: ["name", "description"]
              }
            }
          },
          required: ["basic_data", "specifications", "memorial_items", "options"]
        }
      }
    };

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro', // Using Pro for larger context window
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Documento a analisar:\n\n${documentText}` }
        ],
        tools: [toolDefinition],
        tool_choice: { type: "function", function: { name: "extract_yacht_specifications" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na Lovable AI:', response.status, errorText);
      
      // Parse error details
      let errorMessage = 'Erro ao processar com IA';
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.metadata?.raw) {
          const rawError = JSON.parse(errorData.error.metadata.raw);
          if (rawError.error?.message) {
            errorMessage = rawError.error.message;
          }
        } else if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        // Keep default error message
      }
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Aguarde alguns instantes e tente novamente.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos de IA esgotados. Adicione fundos ao workspace Lovable.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 400 && errorMessage.includes('token count exceeds')) {
        return new Response(
          JSON.stringify({ 
            error: 'Documento muito grande para processar',
            details: 'O documento excede o limite de tokens. Tente um documento menor ou divida em partes.'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Extract data from tool call response
    let extractedData: any;
    try {
      if (data.choices[0].message.tool_calls && data.choices[0].message.tool_calls.length > 0) {
        // Structured output via tool calling
        const toolCall = data.choices[0].message.tool_calls[0];
        extractedData = JSON.parse(toolCall.function.arguments);
        console.log('✅ Dados extraídos via tool calling (JSON estruturado)');
      } else {
        // Fallback: try to parse from message content
        const aiResponse = data.choices[0].message.content;
        console.log('⚠️ Tentando extrair JSON do conteúdo da mensagem...');
        
        const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || 
                          aiResponse.match(/```\s*([\s\S]*?)\s*```/);
        
        const jsonText = jsonMatch ? jsonMatch[1] : aiResponse;
        extractedData = JSON.parse(jsonText);
        console.log('✅ JSON extraído do conteúdo');
      }
      
      console.log('📋 Dados extraídos com sucesso:');
      console.log('  - Campos básicos:', Object.keys(extractedData.basic_data || {}).length);
      console.log('  - Especificações:', Object.keys(extractedData.specifications || {}).filter(k => extractedData.specifications[k] != null).length);
      console.log('  - Itens de memorial:', (extractedData.memorial_items || []).length);
      console.log('  - Opcionais:', (extractedData.options || []).length);
      
    } catch (parseError: any) {
      console.error('❌ Erro ao fazer parse dos dados:', parseError);
      console.error('Resposta completa:', JSON.stringify(data, null, 2));
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
    console.error('❌ Erro na função extract-yacht-specs:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao processar documento',
        details: error?.message || 'Erro desconhecido' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
