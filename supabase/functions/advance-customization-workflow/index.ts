import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdvanceWorkflowRequest {
  customizationId: string;
  currentStep: 'pm_initial' | 'supply_quote' | 'planning_check' | 'pm_final';
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
          yacht_model_id,
          base_discount_percentage,
          options_discount_percentage,
          final_base_price,
          final_options_price,
          base_delivery_days,
          yacht_models (
            id,
            name,
            pm_assignments:pm_yacht_model_assignments (
              pm_user_id,
              pm_user:users (id, full_name, email)
            )
          )
        )
      `)
      .eq('id', customizationId)
      .single();

    if (fetchError || !customization) {
      return new Response(JSON.stringify({ error: 'Customization not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle rejection
    if (action === 'reject') {
      if (!data.reject_reason) {
        return new Response(JSON.stringify({ error: 'Motivo da rejeição obrigatório' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase
        .from('quotation_customizations')
        .update({
          workflow_status: 'rejected',
          status: 'rejected',
          reject_reason: data.reject_reason,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', customizationId);

      // Mark all pending steps as rejected
      await supabase
        .from('customization_workflow_steps')
        .update({ status: 'rejected' })
        .eq('customization_id', customizationId)
        .eq('status', 'pending');

      return new Response(JSON.stringify({ success: true, status: 'rejected' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle advancement based on current step
    let nextStatus = '';
    let nextStepType = '';
    let updateData: any = {};

    if (currentStep === 'pm_initial') {
      // Validate PM Initial
      if (!data.pm_scope || data.engineering_hours < 0) {
        return new Response(JSON.stringify({ error: 'Escopo e horas de engenharia são obrigatórios' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      nextStatus = 'pending_supply_quote';
      nextStepType = 'supply_quote';
      updateData = {
        workflow_status: nextStatus,
        pm_scope: data.pm_scope,
        engineering_hours: data.engineering_hours,
        required_parts: data.required_parts || [],
      };

    } else if (currentStep === 'supply_quote') {
      // Validate Supply Quote
      if (!data.supply_items?.length || data.supply_cost < 0) {
        return new Response(JSON.stringify({ error: 'Itens cotados são obrigatórios' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      nextStatus = 'pending_planning_validation';
      nextStepType = 'planning_check';
      updateData = {
        workflow_status: nextStatus,
        supply_items: data.supply_items,
        supply_cost: data.supply_cost,
        supply_lead_time_days: data.supply_lead_time_days,
        supply_notes: data.supply_notes,
      };

    } else if (currentStep === 'planning_check') {
      // Validate Planning
      if (data.planning_delivery_impact_days < 0) {
        return new Response(JSON.stringify({ error: 'Impacto no prazo inválido' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      nextStatus = 'pending_pm_final_approval';
      nextStepType = 'pm_final';
      updateData = {
        workflow_status: nextStatus,
        planning_window_start: data.planning_window_start,
        planning_delivery_impact_days: data.planning_delivery_impact_days,
        planning_notes: data.planning_notes,
      };

    } else if (currentStep === 'pm_final') {
      // Validate PM Final
      if (!data.pm_final_price || data.pm_final_price < 0) {
        return new Response(JSON.stringify({ error: 'Preço de venda obrigatório' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Calculate technical cost
      const { data: config } = await supabase
        .from('workflow_config')
        .select('config_value')
        .eq('config_key', 'engineering_rate')
        .single();

      const { data: contingencyConfig } = await supabase
        .from('workflow_config')
        .select('config_value')
        .eq('config_key', 'contingency_percent')
        .single();

      const engineeringRate = config?.config_value?.rate_per_hour || 150;
      const contingencyPercent = (contingencyConfig?.config_value?.percent || 10) / 100;

      const engineeringCost = customization.engineering_hours * engineeringRate;
      const technicalCost = customization.supply_cost + engineeringCost;
      const costWithContingency = technicalCost * (1 + contingencyPercent);

      nextStatus = 'approved';
      updateData = {
        workflow_status: nextStatus,
        status: 'approved', // ✅ SEMPRE marcar como aprovado após PM Final
        pm_final_price: data.pm_final_price,
        pm_final_delivery_impact_days: data.pm_final_delivery_impact_days,
        pm_final_notes: data.pm_final_notes,
        additional_cost: data.pm_final_price,
        delivery_impact_days: data.pm_final_delivery_impact_days,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      };

      // ✅ ATUALIZAR A CUSTOMIZAÇÃO IMEDIATAMENTE ANTES DE VERIFICAR APROVAÇÃO COMERCIAL
      await supabase
        .from('quotation_customizations')
        .update(updateData)
        .eq('id', customizationId);

      // Update quotation totals
      const { data: allCustomizations } = await supabase
        .from('quotation_customizations')
        .select('additional_cost, delivery_impact_days')
        .eq('quotation_id', customization.quotations.id)
        .in('status', ['approved', 'pending']);

      const totalCustomizationsCost = (allCustomizations || []).reduce(
        (sum, c) => sum + (c.additional_cost || 0),
        0
      ) - (customization.additional_cost || 0) + data.pm_final_price;

      const maxDeliveryImpact = Math.max(
        ...(allCustomizations || []).map(c => c.delivery_impact_days || 0),
        data.pm_final_delivery_impact_days
      );

      const newFinalPrice =
        customization.quotations.final_base_price +
        customization.quotations.final_options_price +
        totalCustomizationsCost;

      await supabase
        .from('quotations')
        .update({
          total_customizations_price: totalCustomizationsCost,
          total_delivery_days: customization.quotations.base_delivery_days + maxDeliveryImpact,
          final_price: newFinalPrice,
        })
        .eq('id', customization.quotations.id);

      // Check if commercial approval is needed
      const baseDiscount = customization.quotations.base_discount_percentage || 0;
      const optionsDiscount = customization.quotations.options_discount_percentage || 0;

      // Import discount limits logic
      const { data: baseLimits } = await supabase
        .from('discount_limits_config')
        .select('*')
        .eq('limit_type', 'base')
        .single();

      const noApprovalMax = baseLimits?.no_approval_max || 10;
      const maxDiscount = Math.max(baseDiscount, optionsDiscount);

      if (maxDiscount > noApprovalMax) {
        // Create commercial approval
        await supabase
          .from('approvals')
          .insert({
            quotation_id: customization.quotations.id,
            approval_type: 'commercial',
            request_details: {
              discount_type: 'combined',
              reason: 'Gerado automaticamente após aprovação de customização',
              customization_triggered: true,
            },
            requested_by: user.id,
            status: 'pending',
          });

        await supabase
          .from('quotations')
          .update({ status: 'pending_commercial_approval' })
          .eq('id', customization.quotations.id);

        // ✅ Marcar step como concluído e retornar
        await supabase
          .from('customization_workflow_steps')
          .update({
            status: 'completed',
            response_data: data,
            completed_at: new Date().toISOString(),
          })
          .eq('customization_id', customizationId)
          .eq('step_type', currentStep);

        return new Response(
          JSON.stringify({
            success: true,
            status: 'approved',
            needsCommercialApproval: true,
            message: 'Customização aprovada. Aprovação comercial criada automaticamente.',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // No commercial approval needed
        await supabase
          .from('quotations')
          .update({ status: 'ready_to_send' })
          .eq('id', customization.quotations.id);

        // ✅ Marcar step como concluído
        await supabase
          .from('customization_workflow_steps')
          .update({
            status: 'completed',
            response_data: data,
            completed_at: new Date().toISOString(),
          })
          .eq('customization_id', customizationId)
          .eq('step_type', currentStep);

        return new Response(
          JSON.stringify({
            success: true,
            status: 'approved',
            message: 'Customização aprovada com sucesso!',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Update customization
    await supabase
      .from('quotation_customizations')
      .update(updateData)
      .eq('id', customizationId);

    // Mark current step as completed
    await supabase
      .from('customization_workflow_steps')
      .update({
        status: 'completed',
        response_data: data,
        completed_at: new Date().toISOString(),
      })
      .eq('customization_id', customizationId)
      .eq('step_type', currentStep);

    // Create next step (if not final)
    if (nextStepType) {
      let assignedTo = null;

      if (nextStepType === 'supply_quote') {
        // Assign to first buyer
        const { data: buyer } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'comprador')
          .limit(1)
          .single();
        assignedTo = buyer?.user_id;
      } else if (nextStepType === 'planning_check') {
        // Assign to first planner
        const { data: planner } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'planejador')
          .limit(1)
          .single();
        assignedTo = planner?.user_id;
      } else if (nextStepType === 'pm_final') {
        // Assign to PM of the yacht model
        const pmAssignments = customization.quotations.yacht_models?.pm_assignments || [];
        if (pmAssignments.length > 0) {
          assignedTo = pmAssignments[0].pm_user_id;
        }
      }

      await supabase
        .from('customization_workflow_steps')
        .insert({
          customization_id: customizationId,
          step_type: nextStepType,
          assigned_to: assignedTo,
          status: 'pending',
        });

      // Send notification (call notification function)
      if (assignedTo) {
        await supabase.functions.invoke('send-workflow-notification', {
          body: {
            assignedTo,
            customizationId,
            stepType: nextStepType,
          },
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        nextStatus,
        message: nextStatus === 'approved' ? 'Customização aprovada com sucesso!' : 'Workflow avançado com sucesso!',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error advancing workflow:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
