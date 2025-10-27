import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConvertRequest {
  customization_id: string;
  contract_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { customization_id, contract_id }: ConvertRequest = await req.json();

    if (!customization_id || !contract_id) {
      throw new Error("customization_id and contract_id are required");
    }

    // Fetch customization details
    const { data: customization, error: customError } = await supabase
      .from("quotation_customizations")
      .select("*")
      .eq("id", customization_id)
      .single();

    if (customError || !customization) {
      throw new Error("Customization not found");
    }

    // Validate that customization is approved
    if (customization.status !== "approved") {
      throw new Error("Only approved customizations can be converted to ATOs");
    }

    // Check if already converted
    if (customization.ato_id) {
      throw new Error("This customization has already been converted to an ATO");
    }

    // Get next sequence number for ATO
    const { data: existingATOs, error: countError } = await supabase
      .from("additional_to_orders")
      .select("sequence_number")
      .eq("contract_id", contract_id)
      .order("sequence_number", { ascending: false })
      .limit(1);

    if (countError) throw countError;

    const nextSequence = existingATOs && existingATOs.length > 0
      ? existingATOs[0].sequence_number + 1
      : 1;

    const atoNumber = `ATO-${String(nextSequence).padStart(3, "0")}`;

    // Create ATO from customization
    const { data: newATO, error: atoError } = await supabase
      .from("additional_to_orders")
      .insert({
        contract_id,
        ato_number: atoNumber,
        sequence_number: nextSequence,
        title: `Customização: ${customization.item_name}`,
        description: customization.pm_scope || customization.notes || "Customização convertida automaticamente",
        price_impact: customization.additional_cost || 0,
        delivery_days_impact: customization.delivery_impact_days || 0,
        status: "draft",
        requested_by: user.id,
        notes: `Convertido de customização ID: ${customization_id}\n\nDetalhes:\n- Custo: ${customization.additional_cost}\n- Prazo: ${customization.delivery_impact_days} dias\n- Horas de engenharia: ${customization.engineering_hours}`,
      })
      .select()
      .single();

    if (atoError) throw atoError;

    // Link customization to ATO
    const { error: updateError } = await supabase
      .from("quotation_customizations")
      .update({ ato_id: newATO.id })
      .eq("id", customization_id);

    if (updateError) throw updateError;

    // Log audit event
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "CONVERT_CUSTOMIZATION_TO_ATO",
      table_name: "additional_to_orders",
      record_id: newATO.id,
      metadata: {
        customization_id,
        contract_id,
        ato_number: atoNumber,
      },
    });

    console.log("Customization converted to ATO successfully:", {
      customization_id,
      ato_id: newATO.id,
      ato_number: atoNumber,
    });

    return new Response(
      JSON.stringify({
        success: true,
        ato: newATO,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error converting customization to ATO:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
