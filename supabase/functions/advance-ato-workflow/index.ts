import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdvanceATOWorkflowRequest {
  atoId: string;
  stepId: string;
  stepType: 'pm_review';
  action: 'advance' | 'reject';
  data: any;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: AdvanceATOWorkflowRequest = await req.json();
    const { atoId, stepId, stepType, action, data } = body;

    console.log(`Processing ATO workflow: ${stepType} -> ${action}`, { atoId, user: user.id });

    // Buscar ATO atual
    const { data: ato, error: fetchError } = await supabase
      .from('additional_to_orders')
      .select(`
        *,
        contracts (
          id,
          contract_number,
          base_price,
          current_total_price,
          base_delivery_days,
          current_total_delivery_days
        )
      `)
      .eq('id', atoId)
      .single();

    if (fetchError || !ato) {
      console.error('ATO not found:', fetchError);
      return new Response(JSON.stringify({ error: 'ATO not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle REJECT action
    if (action === 'reject') {
      await supabase
        .from('additional_to_orders')
        .update({
          workflow_status: 'rejected',
          status: 'rejected',
          rejection_reason: data.reject_reason || 'Rejeitado',
        })
        .eq('id', atoId);

      await supabase
        .from('ato_workflow_steps')
        .update({
          status: 'rejected',
          completed_at: new Date().toISOString(),
          notes: data.reject_reason,
        })
        .eq('id', stepId);

      return new Response(
        JSON.stringify({ message: 'ATO rejeitada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle ADVANCE action - PM Review único
    if (stepType !== 'pm_review') {
      throw new Error('Step inválido. Apenas pm_review é suportado.');
    }

    // Validar dados completos do PM
    if (!data.pm_scope || data.final_price === undefined || data.delivery_impact_days === undefined) {
      return new Response(
        JSON.stringify({ error: 'Dados incompletos: escopo, preço e impacto no prazo são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar ATO: workflow completo, mas aguardando validação comercial do vendedor
    const updateData = {
      price_impact: data.final_price,
      delivery_days_impact: data.delivery_impact_days,
      notes: `${ato.notes || ''}\n\nAvaliação PM:\n${data.pm_scope}\n\nNotas: ${data.notes || ''}`,
      workflow_status: 'completed',  // ✅ Workflow PM completo
      status: 'draft',               // ✅ Aguardando ação do vendedor
      // NÃO setar approved_at/approved_by aqui - só quando cliente aprovar
    };

    console.log('Updating ATO with data:', updateData);

    await supabase
      .from('additional_to_orders')
      .update(updateData)
      .eq('id', atoId);

    // Marcar step como completo
    await supabase
      .from('ato_workflow_steps')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        response_data: {
          materials: data.materials || [],
          total_materials_cost: data.total_materials_cost || 0,
          labor_hours: data.labor_hours || 0,
          labor_cost_per_hour: data.labor_cost_per_hour || 55,
          total_labor_cost: data.total_labor_cost || 0,
          total_cost: data.total_cost || 0,
          suggested_price: data.suggested_price || 0,
          final_price: data.final_price,
        },
        notes: data.notes,
      })
      .eq('id', stepId);

    // NÃO atualizar totais do contrato aqui - só quando cliente aprovar

    return new Response(
      JSON.stringify({ 
        message: 'Análise PM concluída! ATO aguardando validação comercial.',
        workflowCompleted: true,
        atoId: atoId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in advance-ato-workflow:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
