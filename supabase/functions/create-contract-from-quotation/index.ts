import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Unauthorized");
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { quotation_id } = await req.json();

    if (!quotation_id) {
      throw new Error("quotation_id is required");
    }

    console.log("Creating contract from quotation:", quotation_id);

    // 1. Buscar cotação completa
    const { data: quotation, error: quotationError } = await supabase
      .from("quotations")
      .select(`
        *,
        client:clients(*),
        yacht_model:yacht_models(*),
        quotation_options(*, option:options(*)),
        quotation_customizations(*),
        quotation_upgrades(*, upgrade:memorial_upgrades(*), memorial_item:memorial_items(item_name))
      `)
      .eq("id", quotation_id)
      .single();

    if (quotationError || !quotation) {
      console.error("Error fetching quotation:", quotationError);
      throw new Error("Quotation not found");
    }

    // Verificar se cotação está aprovada/aceita
    if (quotation.status !== "accepted" && quotation.status !== "approved") {
      throw new Error("Quotation must be accepted or approved to create contract");
    }

    // Verificar se já existe contrato para esta cotação
    const { data: existingContract } = await supabase
      .from("contracts")
      .select("id, contract_number")
      .eq("quotation_id", quotation_id)
      .single();

    if (existingContract) {
      return new Response(
        JSON.stringify({
          success: true,
          contract: existingContract,
          message: "Contract already exists for this quotation",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // 2. Gerar número do contrato
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const contractNumber = `CTR-${year}-${random}`;

    // 3. Recalcular o preço final corretamente (incluindo upgrades)
    // O campo quotation.final_price pode não incluir upgrades corretamente
    const basePrice = quotation.base_price || 0;
    const baseDiscount = quotation.base_discount_percentage || 0;
    const optionsDiscount = quotation.options_discount_percentage || 0;

    // Total de opcionais
    const optionsTotal = (quotation.quotation_options || []).reduce(
      (sum: number, opt: any) => sum + (opt.total_price || 0), 
      0
    );

    // Total de upgrades
    const upgradesTotal = (quotation.quotation_upgrades || []).reduce(
      (sum: number, upg: any) => sum + (upg.price || 0), 
      0
    );

    // Aplicar descontos
    const finalBasePrice = basePrice * (1 - baseDiscount / 100);
    const finalOptionsPrice = optionsTotal * (1 - optionsDiscount / 100);
    const finalUpgradesPrice = upgradesTotal * (1 - optionsDiscount / 100);

    // Preço final recalculado (correto)
    const calculatedFinalPrice = finalBasePrice + finalOptionsPrice + finalUpgradesPrice;

    console.log("Price calculation:", {
      basePrice,
      baseDiscount,
      optionsTotal,
      optionsDiscount,
      upgradesTotal,
      finalBasePrice,
      finalOptionsPrice,
      finalUpgradesPrice,
      calculatedFinalPrice,
      originalFinalPrice: quotation.final_price
    });

    // 4. Criar snapshot da cotação
    const snapshot = {
      quotation_id: quotation.id,
      quotation_number: quotation.quotation_number,
      client: quotation.client,
      yacht_model: quotation.yacht_model,
      base_price: quotation.base_price,
      final_price: calculatedFinalPrice, // Usar preço recalculado
      base_delivery_days: quotation.base_delivery_days,
      total_delivery_days: quotation.total_delivery_days,
      selected_options: quotation.quotation_options || [],
      selected_upgrades: quotation.quotation_upgrades || [],
      customizations: quotation.quotation_customizations || [],
      discount_percentage: quotation.discount_percentage,
      options_discount_percentage: quotation.options_discount_percentage,
      created_at: new Date().toISOString(),
    };

    // 5. Criar contrato
    // Determinar quem assinou: se accepted, é o cliente; se approved, é interno
    const isInternalApproval = quotation.status === 'approved';
    const signedByName = isInternalApproval 
      ? (user.user_metadata?.full_name || user.email || 'Sistema')
      : (quotation.accepted_by_name || quotation.client?.name);
    const signedByEmail = isInternalApproval
      ? user.email
      : (quotation.accepted_by_email || quotation.client?.email);

    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .insert({
        quotation_id: quotation.id,
        client_id: quotation.client_id,
        yacht_model_id: quotation.yacht_model_id,
        hull_number_id: quotation.hull_number_id || null,
        contract_number: contractNumber,
        base_price: calculatedFinalPrice, // Usar preço recalculado
        base_delivery_days: quotation.total_delivery_days,
        base_snapshot: snapshot,
        current_total_price: calculatedFinalPrice, // Usar preço recalculado
        current_total_delivery_days: quotation.total_delivery_days,
        status: "active",
        signed_at: quotation.accepted_at || new Date().toISOString(),
        signed_by_name: signedByName,
        signed_by_email: signedByEmail,
        created_by: user.id,
      })
      .select()
      .single();

    if (contractError) {
      console.error("Error creating contract:", contractError);
      throw new Error("Failed to create contract: " + contractError.message);
    }

    // 6. Atualizar hull_number como vendido e vincular ao contrato
    if (quotation.hull_number_id) {
      const { error: hullError } = await supabase
        .from("hull_numbers")
        .update({ 
          status: 'sold',
          contract_id: contract.id 
        })
        .eq("id", quotation.hull_number_id);

      if (hullError) {
        console.error("Error updating hull number status:", hullError);
      } else {
        console.log(`Hull number ${quotation.hull_number_id} marked as sold`);
      }
    }

    // 7. Marcar customizações aprovadas como incluídas no contrato
    if (quotation.quotation_customizations && quotation.quotation_customizations.length > 0) {
      const approvedCustomizationIds = quotation.quotation_customizations
        .filter((c: any) => c.status === "approved")
        .map((c: any) => c.id);

      if (approvedCustomizationIds.length > 0) {
        const { error: customizationsError } = await supabase
          .from("quotation_customizations")
          .update({ included_in_contract: true })
          .in("id", approvedCustomizationIds);

        if (customizationsError) {
          console.error("Error marking customizations as included:", customizationsError);
        } else {
          console.log(`Marked ${approvedCustomizationIds.length} customizations as included in contract`);
        }
      }
    }

    // 8. Atualizar status da cotação
    const { error: updateError } = await supabase
      .from("quotations")
      .update({ status: "converted_to_contract" })
      .eq("id", quotation_id);

    if (updateError) {
      console.warn("Could not update quotation status:", updateError);
    }

    // 9. Criar log de auditoria
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "CREATE_CONTRACT",
      table_name: "contracts",
      record_id: contract.id,
      new_values: {
        contract_number: contractNumber,
        quotation_id,
        hull_number_id: quotation.hull_number_id,
      },
    });

    console.log("Contract created successfully:", contract.id);

    return new Response(
      JSON.stringify({
        success: true,
        contract,
        message: "Contract created successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in create-contract-from-quotation:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
