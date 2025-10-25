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
Sua tarefa é EXTRAIR E PREENCHER cada campo com os dados encontrados no documento.

# DADOS BÁSICOS - PROCURE E PREENCHA:

**code** (OBRIGATÓRIO):
- **PRIORIDADE MÁXIMA**: Use EXATAMENTE o número que aparece no TÍTULO PRINCIPAL da primeira página
- Se o título diz "FERRETTI YACHTS 670", o código é "FY670"
- Se o título diz "FERRETTI YACHTS 850", o código é "FY850"
- NÃO confunda os números! 670 ≠ 850
- Padrões: "FY###", "OK-##", "AZIMUT-##"
- ⚠️ CRÍTICO: Extraia o código do TÍTULO/INÍCIO, nunca de referências no meio do texto

**name** (OBRIGATÓRIO):
- Nome completo do modelo
- Ex: "Ferretti Yachts 670", "OKEAN 52", "Azimut 60"

**description**:
- Descrição geral do iate (geralmente no início do documento)
- Pode ser um parágrafo explicando o modelo

**base_price**:
- Procure por: "Preço Base", "Valor Base", "Price"
- Converta para número (remova "R$", pontos, vírgulas)
- Ex: "R$ 15.900.000,00" → 15900000

**base_delivery_days**:
- Procure por: "Prazo de Entrega", "Delivery", "Dias"
- Extraia apenas o número
- Ex: "500 dias" → 500

**registration_number**:
- Procure por: "Registro", "Matrícula", "Registration"
- Ex: "RJ-0001-BR"

**delivery_date**:
- Procure por: "Data de Entrega", "Entrega prevista"
- Formato: YYYY-MM-DD
- Ex: "Março/2026" → "2026-03-01"

# ESPECIFICAÇÕES TÉCNICAS - PROCURE CADA CAMPO:

**DIMENSÕES (em metros - use ponto decimal):**
- **length_overall**: Comprimento total, LOA, Length Overall
- **hull_length**: Comprimento do casco, Hull Length
- **beam**: Boca, Largura, Beam
- **draft**: Calado, Draft
- **height_from_waterline**: Altura da linha d'água

**PESOS (em quilogramas - apenas números):**
- **dry_weight**: Peso seco, Dry Weight
- **displacement_light**: Deslocamento leve, Light Displacement
- **displacement_loaded**: Deslocamento carregado, Loaded Displacement

**CAPACIDADES:**
- **fuel_capacity**: Capacidade de combustível (litros)
  - Procure: "Combustível", "Fuel Tank", "Diesel"
- **water_capacity**: Capacidade de água (litros)
  - Procure: "Água Potável", "Water Tank"
- **passengers_capacity**: Capacidade de passageiros (número)
  - Procure: "Passageiros", "Passengers"
- **cabins**: Número de camarotes (número inteiro)
  - Procure: "Camarotes", "Cabins", "Quartos"
- **bathrooms**: Banheiros (string, pode ser "3 + 1")
  - Procure: "Banheiros", "WC", "Toilets"

**MOTORIZAÇÃO:**
- **engines**: Descrição completa dos motores (texto)
  - Procure: "Motores", "Engines", "Motorização"
  - Ex: "2 x Volvo Penta D13 de 900 HP"
- **max_speed**: Velocidade máxima (em nós)
  - Procure: "Velocidade Máxima", "Max Speed"
- **cruise_speed**: Velocidade de cruzeiro (em nós)
  - Procure: "Velocidade de Cruzeiro", "Cruise Speed"
- **range_nautical_miles**: Autonomia (em milhas náuticas)
  - Procure: "Autonomia", "Range"

**OUTROS:**
- **hull_color**: Cor do casco
  - Procure: "Cor do Casco", "Hull Color"

# CONVERSÃO DE UNIDADES:
- Metros: mantenha formato decimal com ponto (26.14)
- Quilos/Toneladas: converta tudo para kg
- Litros: mantenha em litros
- Nós: mantenha em nós (knots)

# REGRAS CRÍTICAS:
✅ Procure ATIVAMENTE cada campo no documento
✅ Use null apenas se o campo NÃO existir no documento
✅ Preserve números com ponto decimal (não vírgula)
✅ Remova símbolos de moeda e formatação
✅ Para cada campo, procure variações em português e inglês

# MEMORIAL DESCRITIVO:
Categorize cada item em:
- **equipamentos**: Molinete, guincho, thruster, geradores, âncoras
- **acabamento**: Teca, madeira, carpete, estofados, móveis
- **eletrica**: Painéis, baterias, iluminação, som, TVs
- **hidraulica**: Tanques, bombas, água, chuveiros
- **propulsao**: Motores, hélices, eixos
- **seguranca**: Coletes, balsas, extintores
- **navegacao**: GPS, radar, VHF
- **conforto**: Ar-condicionado, entretenimento
- **outros**: Demais itens

# OPCIONAIS:
Extraia nome, descrição e preço (se disponível) de cada opcional sugerido.`;

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
