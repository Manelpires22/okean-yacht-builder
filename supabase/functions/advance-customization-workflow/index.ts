import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdvanceWorkflowRequest {
  customizationId: string;
  currentStep: 'pm_review';
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

    const body: AdvanceWorkflowRequest = await req.json();
    const { customizationId, currentStep, action, data } = body;

    console.log(`Processing workflow: ${currentStep} -> ${action}`, { customizationId, user: user.id });

    // Buscar customização atual
    const { data: customization, error: fetchError } = await supabase
      .from('quotation_customizations')
      .select(`
        *,
        quotations (
          id,
          quotation_number,
          base_price,
          final_base_price,
          final_options_price,
          base_delivery_days,
          total_delivery_days,
          total_customizations_price
        )
      `)
      .eq('id', customizationId)
      .single();

    if (fetchError || !customization) {
      console.error('Customization not found:', fetchError);
      return new Response(JSON.stringify({ error: 'Customization not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle REJECT action
    if (action === 'reject') {
      await supabase
        .from('quotation_customizations')
        .update({
          workflow_status: 'rejected',
          status: 'rejected',
          reject_reason: data.reject_reason || 'Rejeitado',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('id', customizationId);

      await supabase
        .from('customization_workflow_steps')
        .update({
          status: 'rejected',
          completed_at: new Date().toISOString(),
          notes: data.reject_reason,
        })
        .eq('customization_id', customizationId)
        .eq('step_type', 'pm_review');

      return new Response(
        JSON.stringify({ message: 'Customização rejeitada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle ADVANCE action - PM Review único
    if (currentStep !== 'pm_review') {
      throw new Error('Step inválido. Apenas pm_review é suportado.');
    }

    // Validar dados completos do PM
    if (!data.pm_scope || data.pm_final_price === undefined || data.pm_final_delivery_impact_days === undefined) {
      return new Response(
        JSON.stringify({ error: 'Dados incompletos: escopo, preço e impacto no prazo são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const updateData = {
      pm_scope: data.pm_scope,
      pm_final_price: data.pm_final_price,
      pm_final_delivery_impact_days: data.pm_final_delivery_impact_days,
      required_parts: data.required_parts || [],
      pm_final_notes: data.pm_final_notes,
      workflow_status: 'approved',
      status: 'approved',
      additional_cost: data.pm_final_price,
      delivery_impact_days: data.pm_final_delivery_impact_days,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    };

    // Atualizar customization
    await supabase
      .from('quotation_customizations')
      .update(updateData)
      .eq('id', customizationId);

    // Marcar step como completo
    await supabase
      .from('customization_workflow_steps')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        response_data: data,
      })
      .eq('customization_id', customizationId)
      .eq('step_type', 'pm_review');

    // Atualizar totais da cotação
    const newCustomizationPrice = data.pm_final_price;
    const newDeliveryImpact = data.pm_final_delivery_impact_days;

    const { data: quotation } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', customization.quotation_id)
      .single();

    if (quotation) {
      const currentCustomizationsTotal = quotation.total_customizations_price || 0;
      const updatedCustomizationsTotal = currentCustomizationsTotal + newCustomizationPrice;
      
      const currentTotalDeliveryDays = quotation.total_delivery_days || quotation.base_delivery_days;
      const updatedTotalDeliveryDays = currentTotalDeliveryDays + newDeliveryImpact;

      const updatedFinalPrice = quotation.final_base_price + (quotation.final_options_price || 0) + updatedCustomizationsTotal;

      await supabase
        .from('quotations')
        .update({
          total_customizations_price: updatedCustomizationsTotal,
          total_delivery_days: updatedTotalDeliveryDays,
          final_price: updatedFinalPrice,
        })
        .eq('id', customization.quotation_id);
    }

    // Verificar se precisa aprovação comercial
    const { data: discountLimits } = await supabase
      .from('discount_limits_config')
      .select('*')
      .eq('limit_type', 'customization');

    const needsCommercialApproval = discountLimits && discountLimits.length > 0 && 
      newCustomizationPrice > (discountLimits[0].admin_approval_required_above || 50000);

    if (needsCommercialApproval) {
      await supabase
        .from('approvals')
        .insert({
          quotation_id: customization.quotation_id,
          approval_type: 'commercial',
          requested_by: user.id,
          status: 'pending',
          request_details: {
            customization_id: customizationId,
            customization_price: newCustomizationPrice,
            reason: 'Customização com preço elevado requer aprovação comercial',
          },
          notes: `Customização: ${customization.item_name} - ${data.pm_final_notes || ''}`,
        });

      return new Response(
        JSON.stringify({ 
          message: 'Customização aprovada! Aprovação comercial criada.',
          needsCommercialApproval: true,
          workflowCompleted: true,
          customizationId: customizationId,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        message: 'Customização aprovada com sucesso!',
        workflowCompleted: true,
        customizationId: customizationId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in advance-customization-workflow:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
