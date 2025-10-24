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
Seu objetivo é extrair TODOS os dados possíveis de documentos, mesmo que:
- Informações estejam em formato livre (não tabeladas)
- Campos não estejam explicitamente rotulados
- Documento use títulos e listas numeradas

# ESTRATÉGIA DE EXTRAÇÃO

## 1. IDENTIFICAR MODELO E CÓDIGO
- Procure pelo título principal no início do documento (ex: "FERRETTI YACHTS 850")
- Extraia o código do modelo (ex: "FY850" ou "OK-52")
- Se não houver código explícito, crie um baseado no nome (ex: "FERRETTI YACHTS 850" → code: "FY850")

## 2. LOCALIZAR SEÇÕES POR TÍTULOS
O documento pode ter seções identificadas por títulos (não rótulos):
- "ESPECIFICAÇÕES TÉCNICAS" ou "DIMENSÕES" ou "PRINCIPAIS DIMENSÕES" → extrair specs técnicas
- "MEMORIAL DESCRITIVO" ou "MEMORIAL PADRÃO" → extrair memorial_items
- "OPCIONAIS" ou "OPCIONAIS SUGERIDOS" → extrair options
- "INFORMAÇÕES TÉCNICAS" → extrair capacidades e deslocamento

## 3. PARSE DE LISTAS NUMERADAS
Memorial e opcionais geralmente vêm em listas numeradas:
- "1. Item description" → extrair como memorial_item ou option
- Identifique a categoria pela área/seção mencionada (ex: "CONVÉS PRINCIPAL" → categoria: equipamentos)
- Para itens de memorial: extrair descrição completa mantendo detalhes técnicos

## 4. CONVERSÃO DE UNIDADES
- Metros (m) → manter em metros (formato decimal com ponto)
- Quilogramas (Kg) → converter para kg (remover pontos/vírgulas de milhares)
- Litros (l) → manter em litros
- HP (cavalos) → extrair para campo "engines"
- Nós → manter em nós

## 5. CAMPOS OPCIONAIS
Se um campo não for encontrado, retorne null (não invente dados):
- base_price: se não houver valor de preço explícito, retornar null
- base_delivery_days: se não houver prazo, retornar null
- registration_number: matrícula (raramente presente)
- delivery_date: data de entrega (raramente presente)

# MAPEAMENTO DE CATEGORIAS PARA MEMORIAL ITEMS

Use o contexto da seção ou do item para identificar a categoria:

**equipamentos**: Molinete, guincho, bow thruster, stern thruster, geradores, bombas, sistemas hidráulicos, âncoras, correntes, defensas, plataforma de banho

**acabamento**: Teca, madeira, carpete, piso, estofados, sofás, colchões, almofadas, portas, janelas, vigias, móveis, armários, revestimentos

**eletrica**: Painéis elétricos, baterias, inversores, iluminação, luzes, spots, tomadas, carregadores, sistemas de som, TVs

**hidraulica**: Tanques (combustível, água), bombas, válvulas, sistemas de água, chuveiros, torneiras, pias, sistemas de drenagem

**propulsao**: Motores principais, hélices, eixos, transmissão, bow thruster, stern thruster, sistemas de direção

**seguranca**: Coletes, balsas, sinalizadores, extintores, sistemas de incêndio, EPIs, kits de primeiros socorros, alarmes

**navegacao**: GPS, radar, sonar, piloto automático, VHF, rádio, comunicação, mapas, cartas náuticas

**conforto**: TVs, som, entretenimento, geladeiras, freezers, wine coolers, ar-condicionado, aquecedores, iluminação de cortesia

**outros**: Itens que não se encaixam nas categorias acima

# ESTRUTURA JSON DE SAÍDA

{
  "basic_data": {
    "code": "código do modelo (ex: FY850, OK-52)",
    "name": "nome completo do modelo",
    "description": "descrição geral extraída ou criada com base no modelo",
    "base_price": número em reais (apenas números, sem símbolos) ou null,
    "base_delivery_days": número de dias inteiro ou null,
    "registration_number": "matrícula se houver" ou null,
    "delivery_date": "YYYY-MM-DD se houver" ou null
  },
  "specifications": {
    "length_overall": número em metros com 2 decimais ou null,
    "hull_length": número em metros com 2 decimais ou null,
    "beam": número em metros com 2 decimais ou null,
    "draft": número em metros com 2 decimais ou null,
    "height_from_waterline": número em metros com 2 decimais ou null,
    "dry_weight": número em kg inteiro ou null,
    "displacement_light": número em kg inteiro ou null,
    "displacement_loaded": número em kg inteiro ou null,
    "fuel_capacity": número em litros inteiro ou null,
    "water_capacity": número em litros inteiro ou null,
    "passengers_capacity": número de pessoas inteiro ou null,
    "cabins": número inteiro ou null,
    "bathrooms": "texto (ex: 3+1)" ou null,
    "engines": "descrição completa dos motores" ou null,
    "hull_color": "cor do casco" ou null,
    "max_speed": número em nós com 1 decimal ou null,
    "cruise_speed": número em nós com 1 decimal ou null,
    "range_nautical_miles": número em milhas náuticas inteiro ou null
  },
  "memorial_items": [
    {
      "category": "equipamentos|acabamento|eletrica|hidraulica|propulsao|seguranca|navegacao|conforto|outros",
      "description": "descrição completa e detalhada do item preservando especificações técnicas",
      "specification": "marca, modelo, quantidade, potência, material, dimensões (se mencionados)"
    }
  ],
  "options": [
    {
      "name": "nome curto do opcional",
      "description": "descrição completa do opcional",
      "price": número em reais ou null,
      "category": "categoria identificada (equipamentos|acabamento|conforto|outros)"
    }
  ]
}

# EXEMPLOS DE EXTRAÇÃO

## Exemplo 1: Extrair Modelo do Título
Input: "FERRETTI YACHTS 850"
Output:
{
  "basic_data": {
    "code": "FY850",
    "name": "Ferretti Yachts 850",
    "description": "Iate de luxo modelo 850 da linha Ferretti Yachts"
  }
}

## Exemplo 2: Extrair Especificações de Lista
Input:
"Comprimento Total – 26,14 m
Boca Máxima – 6,28 m
Deslocamento Leve - 67.000 Kg"

Output:
{
  "specifications": {
    "length_overall": 26.14,
    "beam": 6.28,
    "displacement_light": 67000
  }
}

## Exemplo 3: Extrair Memorial de Lista Numerada
Input:
"CONVÉS PRINCIPAL
1. Acesso ao flybridge por escada de aço inox e degraus de teca com corrimão em aço inox
2. Porta de correr de vidro com armação de aço inox"

Output:
{
  "memorial_items": [
    {
      "category": "equipamentos",
      "description": "Acesso ao flybridge por escada de aço inox e degraus de teca com corrimão em aço inox",
      "specification": "Material: aço inox, Degraus: teca"
    },
    {
      "category": "acabamento",
      "description": "Porta de correr de vidro com armação de aço inox",
      "specification": "Tipo: porta de correr, Material: vidro, Armação: aço inox"
    }
  ]
}

## Exemplo 4: Extrair Opcionais de Lista Numerada
Input:
"OPCIONAIS SUGERIDOS
1. HT: teto de vidro fixo
2. Stern thruster
3. Ar-condicionado tropical (salão + cabines + 2 cabines de tripulação)"

Output:
{
  "options": [
    {
      "name": "Teto de vidro fixo (HT)",
      "description": "HT: teto de vidro fixo",
      "price": null,
      "category": "acabamento"
    },
    {
      "name": "Stern thruster",
      "description": "Stern thruster",
      "price": null,
      "category": "equipamentos"
    },
    {
      "name": "Ar-condicionado tropical",
      "description": "Ar-condicionado tropical (salão + cabines + 2 cabines de tripulação)",
      "price": null,
      "category": "conforto"
    }
  ]
}

REGRAS FINAIS:
- Retorne APENAS o JSON, sem texto adicional antes ou depois
- Use null para campos não encontrados
- Preserve formatação de números com ponto como decimal (ex: 26.14, não 26,14)
- Para memorial items, mantenha descrições completas e detalhadas
- Para opcionais, extraia nome curto e descrição completa separadamente
- Identifique categorias com base no contexto e tipo de item`;

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
