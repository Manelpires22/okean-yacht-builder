import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verificar autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar token do utilizador
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ success: false, error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se é administrador
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id);

    const isAdmin = roles?.some((r) => r.role === "administrador");
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Apenas administradores podem excluir utilizadores" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obter user_id a excluir
    const { user_id: userIdToDelete } = await req.json();
    
    if (!userIdToDelete) {
      return new Response(
        JSON.stringify({ success: false, error: "ID do utilizador é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Impedir auto-exclusão
    if (userIdToDelete === requestingUser.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Não pode excluir a si próprio" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obter dados do utilizador antes de excluir (para audit log)
    // Usar maybeSingle para não falhar se o utilizador já foi parcialmente apagado
    const { data: userToDelete } = await supabaseAdmin
      .from("users")
      .select("full_name, email")
      .eq("id", userIdToDelete)
      .maybeSingle();

    console.log(`Deleting user: ${userIdToDelete} (${userToDelete?.email || 'unknown'})`);

    // Contadores para audit log
    const dereferenceStats: Record<string, number> = {};

    // ============================================================
    // ETAPA 1: Desreferenciar FKs (SET NULL) antes de apagar users
    // ============================================================
    
    // 1.1 ato_workflow_steps.assigned_to
    const { data: atoSteps, error: atoStepsError } = await supabaseAdmin
      .from("ato_workflow_steps")
      .update({ assigned_to: null })
      .eq("assigned_to", userIdToDelete)
      .select("id");
    
    if (atoStepsError) {
      console.log("ato_workflow_steps dereference error:", atoStepsError.message);
    } else {
      dereferenceStats.ato_workflow_steps = atoSteps?.length || 0;
      console.log(`Dereferenced ${dereferenceStats.ato_workflow_steps} ato_workflow_steps`);
    }

    // 1.2 customization_workflow_steps.assigned_to
    const { data: custSteps, error: custStepsError } = await supabaseAdmin
      .from("customization_workflow_steps")
      .update({ assigned_to: null })
      .eq("assigned_to", userIdToDelete)
      .select("id");
    
    if (custStepsError) {
      console.log("customization_workflow_steps dereference error:", custStepsError.message);
    } else {
      dereferenceStats.customization_workflow_steps = custSteps?.length || 0;
      console.log(`Dereferenced ${dereferenceStats.customization_workflow_steps} customization_workflow_steps`);
    }

    // 1.3 quotations.sales_representative_id
    const { data: quotations, error: quotationsError } = await supabaseAdmin
      .from("quotations")
      .update({ sales_representative_id: null })
      .eq("sales_representative_id", userIdToDelete)
      .select("id");
    
    if (quotationsError) {
      console.log("quotations dereference error:", quotationsError.message);
    } else {
      dereferenceStats.quotations = quotations?.length || 0;
      console.log(`Dereferenced ${dereferenceStats.quotations} quotations`);
    }

    // 1.4 quotation_customizations.reviewed_by
    const { data: custReviews, error: custReviewsError } = await supabaseAdmin
      .from("quotation_customizations")
      .update({ reviewed_by: null })
      .eq("reviewed_by", userIdToDelete)
      .select("id");
    
    if (custReviewsError) {
      console.log("quotation_customizations dereference error:", custReviewsError.message);
    } else {
      dereferenceStats.quotation_customizations = custReviews?.length || 0;
      console.log(`Dereferenced ${dereferenceStats.quotation_customizations} quotation_customizations`);
    }

    // 1.5 yacht_models.created_by
    const { data: yachtModels, error: yachtModelsError } = await supabaseAdmin
      .from("yacht_models")
      .update({ created_by: null })
      .eq("created_by", userIdToDelete)
      .select("id");
    
    if (yachtModelsError) {
      console.log("yacht_models dereference error:", yachtModelsError.message);
    } else {
      dereferenceStats.yacht_models = yachtModels?.length || 0;
      console.log(`Dereferenced ${dereferenceStats.yacht_models} yacht_models`);
    }

    // 1.6 options.created_by
    const { data: options, error: optionsError } = await supabaseAdmin
      .from("options")
      .update({ created_by: null })
      .eq("created_by", userIdToDelete)
      .select("id");
    
    if (optionsError) {
      console.log("options dereference error:", optionsError.message);
    } else {
      dereferenceStats.options = options?.length || 0;
      console.log(`Dereferenced ${dereferenceStats.options} options`);
    }

    // 1.7 workflow_config.updated_by
    const { data: workflowConfig, error: workflowConfigError } = await supabaseAdmin
      .from("workflow_config")
      .update({ updated_by: null })
      .eq("updated_by", userIdToDelete)
      .select("id");
    
    if (workflowConfigError) {
      console.log("workflow_config dereference error:", workflowConfigError.message);
    } else {
      dereferenceStats.workflow_config = workflowConfig?.length || 0;
      console.log(`Dereferenced ${dereferenceStats.workflow_config} workflow_config`);
    }

    // 1.8 contracts.created_by
    const { data: contracts, error: contractsError } = await supabaseAdmin
      .from("contracts")
      .update({ created_by: null })
      .eq("created_by", userIdToDelete)
      .select("id");
    
    if (contractsError) {
      console.log("contracts dereference error:", contractsError.message);
    } else {
      dereferenceStats.contracts = contracts?.length || 0;
      console.log(`Dereferenced ${dereferenceStats.contracts} contracts`);
    }

    // 1.9 contracts.delivered_by
    const { data: contractsDelivered, error: contractsDeliveredError } = await supabaseAdmin
      .from("contracts")
      .update({ delivered_by: null })
      .eq("delivered_by", userIdToDelete)
      .select("id");
    
    if (contractsDeliveredError) {
      console.log("contracts.delivered_by dereference error:", contractsDeliveredError.message);
    } else {
      dereferenceStats.contracts_delivered_by = contractsDelivered?.length || 0;
      console.log(`Dereferenced ${dereferenceStats.contracts_delivered_by} contracts.delivered_by`);
    }

    // 1.10 memorial_items.created_by
    const { data: memorialItems, error: memorialItemsError } = await supabaseAdmin
      .from("memorial_items")
      .update({ created_by: null })
      .eq("created_by", userIdToDelete)
      .select("id");
    
    if (memorialItemsError) {
      console.log("memorial_items dereference error:", memorialItemsError.message);
    } else {
      dereferenceStats.memorial_items = memorialItems?.length || 0;
      console.log(`Dereferenced ${dereferenceStats.memorial_items} memorial_items`);
    }

    // 1.11 memorial_upgrades.created_by
    const { data: memorialUpgrades, error: memorialUpgradesError } = await supabaseAdmin
      .from("memorial_upgrades")
      .update({ created_by: null })
      .eq("created_by", userIdToDelete)
      .select("id");
    
    if (memorialUpgradesError) {
      console.log("memorial_upgrades dereference error:", memorialUpgradesError.message);
    } else {
      dereferenceStats.memorial_upgrades = memorialUpgrades?.length || 0;
      console.log(`Dereferenced ${dereferenceStats.memorial_upgrades} memorial_upgrades`);
    }

    // 1.12 ato_configurations.created_by and pm_reviewed_by
    const { data: atoConfigsCreated, error: atoConfigsCreatedError } = await supabaseAdmin
      .from("ato_configurations")
      .update({ created_by: null })
      .eq("created_by", userIdToDelete)
      .select("id");
    
    if (atoConfigsCreatedError) {
      console.log("ato_configurations.created_by dereference error:", atoConfigsCreatedError.message);
    } else {
      dereferenceStats.ato_configurations_created = atoConfigsCreated?.length || 0;
    }

    const { data: atoConfigsReviewed, error: atoConfigsReviewedError } = await supabaseAdmin
      .from("ato_configurations")
      .update({ pm_reviewed_by: null })
      .eq("pm_reviewed_by", userIdToDelete)
      .select("id");
    
    if (atoConfigsReviewedError) {
      console.log("ato_configurations.pm_reviewed_by dereference error:", atoConfigsReviewedError.message);
    } else {
      dereferenceStats.ato_configurations_reviewed = atoConfigsReviewed?.length || 0;
    }

    // 1.13 contract_delivery_checklist.verified_by
    const { data: deliveryChecklist, error: deliveryChecklistError } = await supabaseAdmin
      .from("contract_delivery_checklist")
      .update({ verified_by: null })
      .eq("verified_by", userIdToDelete)
      .select("id");
    
    if (deliveryChecklistError) {
      console.log("contract_delivery_checklist dereference error:", deliveryChecklistError.message);
    } else {
      dereferenceStats.contract_delivery_checklist = deliveryChecklist?.length || 0;
    }

    console.log("Dereference stats:", dereferenceStats);

    // ============================================================
    // ETAPA 2: Excluir dados em cascata (tabelas dependentes)
    // ============================================================
    
    // 2.1 PM assignments
    const { error: pmError } = await supabaseAdmin
      .from("pm_yacht_model_assignments")
      .delete()
      .eq("pm_user_id", userIdToDelete);
    
    if (pmError) console.log("PM assignments deletion:", pmError.message);

    // 2.2 User roles
    const { error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", userIdToDelete);
    
    if (rolesError) console.log("Roles deletion:", rolesError.message);

    // 2.3 MFA recovery codes
    const { error: mfaError } = await supabaseAdmin
      .from("mfa_recovery_codes")
      .delete()
      .eq("user_id", userIdToDelete);
    
    if (mfaError) console.log("MFA codes deletion:", mfaError.message);

    // ============================================================
    // ETAPA 3: Excluir o utilizador da tabela users
    // ============================================================
    const { error: usersError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", userIdToDelete);
    
    if (usersError) {
      console.error("Users table deletion error:", usersError);
      return new Response(
        JSON.stringify({ success: false, error: `Erro ao excluir perfil: ${usersError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================================
    // ETAPA 4: Excluir o utilizador do auth
    // ============================================================
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete);
    
    if (authDeleteError) {
      console.error("Auth user deletion error:", authDeleteError);
      return new Response(
        JSON.stringify({ success: false, error: `Erro ao excluir conta: ${authDeleteError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================================
    // ETAPA 5: Registrar no audit log
    // ============================================================
    await supabaseAdmin.from("audit_logs").insert({
      user_id: requestingUser.id,
      action: "DELETE_USER",
      table_name: "users",
      record_id: userIdToDelete,
      old_values: userToDelete,
      metadata: {
        deleted_user_email: userToDelete?.email,
        deleted_user_name: userToDelete?.full_name,
        dereferenced_records: dereferenceStats,
      },
    });

    console.log(`User ${userIdToDelete} deleted successfully by ${requestingUser.id}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Delete user error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
