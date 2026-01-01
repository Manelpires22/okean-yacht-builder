import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache em memória (1 hora)
let cachedRate: { value: number; timestamp: number } | null = null;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hora

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = Date.now();
    
    // Verificar cache
    if (cachedRate && (now - cachedRate.timestamp) < CACHE_DURATION_MS) {
      console.log('Retornando câmbio do cache:', cachedRate.value);
      return new Response(
        JSON.stringify({
          rate: cachedRate.value,
          source: 'cache',
          updatedAt: new Date(cachedRate.timestamp).toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar da API do Banco Central
    // API: https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/
    const today = new Date();
    const formattedDate = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}-${today.getFullYear()}`;
    
    const bcbUrl = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaDia(moeda=@moeda,dataCotacao=@dataCotacao)?@moeda='EUR'&@dataCotacao='${formattedDate}'&$top=1&$orderby=dataHoraCotacao%20desc&$format=json`;
    
    console.log('Buscando câmbio do BCB:', bcbUrl);
    
    const response = await fetch(bcbUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`BCB API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Resposta BCB:', JSON.stringify(data));

    let rate: number;
    
    if (data.value && data.value.length > 0) {
      // Usar cotação de venda (cotacaoVenda)
      rate = data.value[0].cotacaoVenda;
    } else {
      // Se não houver cotação hoje, buscar última disponível
      console.log('Sem cotação hoje, buscando última disponível...');
      
      const lastUrl = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaPeriodo(moeda=@moeda,dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?@moeda='EUR'&@dataInicial='01-01-2024'&@dataFinalCotacao='${formattedDate}'&$top=1&$orderby=dataHoraCotacao%20desc&$format=json`;
      
      const lastResponse = await fetch(lastUrl);
      const lastData = await lastResponse.json();
      
      if (lastData.value && lastData.value.length > 0) {
        rate = lastData.value[0].cotacaoVenda;
      } else {
        throw new Error('Nenhuma cotação disponível');
      }
    }

    // Atualizar cache
    cachedRate = { value: rate, timestamp: now };

    console.log('Câmbio EUR/BRL:', rate);

    return new Response(
      JSON.stringify({
        rate,
        source: 'bcb',
        updatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao buscar câmbio:', errorMessage);
    
    // Retornar cache antigo se disponível
    if (cachedRate) {
      return new Response(
        JSON.stringify({
          rate: cachedRate.value,
          source: 'cache-fallback',
          updatedAt: new Date(cachedRate.timestamp).toISOString(),
          error: errorMessage,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'Não foi possível obter a cotação',
        message: errorMessage,
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
