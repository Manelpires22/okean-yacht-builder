import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache em memória (1 hora) - por moeda
const cachedRates: Record<string, { value: number; timestamp: number }> = {};
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hora

async function fetchRate(currency: string): Promise<number> {
  const today = new Date();
  const formattedDate = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}-${today.getFullYear()}`;
  
  const bcbUrl = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaDia(moeda=@moeda,dataCotacao=@dataCotacao)?@moeda='${currency}'&@dataCotacao='${formattedDate}'&$top=1&$orderby=dataHoraCotacao%20desc&$format=json`;
  
  console.log(`Buscando câmbio ${currency}/BRL do BCB:`, bcbUrl);
  
  const response = await fetch(bcbUrl, {
    headers: { 'Accept': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`BCB API error: ${response.status}`);
  }

  const data = await response.json();
  console.log(`Resposta BCB ${currency}:`, JSON.stringify(data));

  if (data.value && data.value.length > 0) {
    return data.value[0].cotacaoVenda;
  }
  
  // Se não houver cotação hoje, buscar última disponível
  console.log(`Sem cotação ${currency} hoje, buscando última disponível...`);
  
  const lastUrl = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoMoedaPeriodo(moeda=@moeda,dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?@moeda='${currency}'&@dataInicial='01-01-2024'&@dataFinalCotacao='${formattedDate}'&$top=1&$orderby=dataHoraCotacao%20desc&$format=json`;
  
  const lastResponse = await fetch(lastUrl);
  const lastData = await lastResponse.json();
  
  if (lastData.value && lastData.value.length > 0) {
    return lastData.value[0].cotacaoVenda;
  }
  
  throw new Error(`Nenhuma cotação disponível para ${currency}`);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Pegar moeda da query string (default: EUR)
    const url = new URL(req.url);
    const currency = url.searchParams.get('currency')?.toUpperCase() || 'EUR';
    
    // Validar moeda
    if (!['EUR', 'USD'].includes(currency)) {
      return new Response(
        JSON.stringify({ error: 'Moeda inválida. Use EUR ou USD.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = Date.now();
    
    // Verificar cache para esta moeda
    const cached = cachedRates[currency];
    if (cached && (now - cached.timestamp) < CACHE_DURATION_MS) {
      console.log(`Retornando câmbio ${currency} do cache:`, cached.value);
      return new Response(
        JSON.stringify({
          rate: cached.value,
          currency,
          source: 'cache',
          updatedAt: new Date(cached.timestamp).toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rate = await fetchRate(currency);
    
    // Atualizar cache
    cachedRates[currency] = { value: rate, timestamp: now };

    console.log(`Câmbio ${currency}/BRL:`, rate);

    return new Response(
      JSON.stringify({
        rate,
        currency,
        source: 'bcb',
        updatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao buscar câmbio:', errorMessage);
    
    // Pegar moeda da query
    const url = new URL(req.url);
    const currency = url.searchParams.get('currency')?.toUpperCase() || 'EUR';
    
    // Retornar cache antigo se disponível
    const cached = cachedRates[currency];
    if (cached) {
      return new Response(
        JSON.stringify({
          rate: cached.value,
          currency,
          source: 'cache-fallback',
          updatedAt: new Date(cached.timestamp).toISOString(),
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
