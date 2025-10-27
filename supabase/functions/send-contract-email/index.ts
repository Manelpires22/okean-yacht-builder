import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendContractEmailRequest {
  contract_id: string;
  recipient_email?: string;
  recipient_name?: string;
  message?: string;
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

    const {
      contract_id,
      recipient_email,
      recipient_name,
      message,
    }: SendContractEmailRequest = await req.json();

    if (!contract_id) {
      throw new Error("contract_id is required");
    }

    // Fetch contract data
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select(`
        *,
        client:clients(*),
        yacht_model:yacht_models(*),
        atos:additional_to_orders(*)
      `)
      .eq("id", contract_id)
      .single();

    if (contractError || !contract) {
      throw new Error("Contract not found");
    }

    // Get user info
    const { data: userData } = await supabase
      .from("users")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    const recipientEmail = recipient_email || contract.client?.email;
    const recipientName = recipient_name || contract.client?.name;

    if (!recipientEmail) {
      throw new Error("Recipient email is required");
    }

    // Format ATOs summary
    const approvedATOs = contract.atos?.filter((ato: any) => ato.status === "approved") || [];
    const atosHTML = approvedATOs.length > 0 ? `
      <h3 style="color: #1e40af; margin-top: 30px;">ATOs Aprovadas</h3>
      ${approvedATOs.map((ato: any) => `
        <div style="border: 1px solid #e5e7eb; padding: 15px; margin: 10px 0; border-radius: 5px;">
          <strong>${ato.ato_number}</strong> - ${ato.title}<br/>
          <span style="color: #16a34a; font-weight: bold;">+R$ ${ato.price_impact.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          <span style="margin-left: 15px; color: #ea580c;">+${ato.delivery_days_impact} dias</span>
        </div>
      `).join("")}
    ` : "";

    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 3px solid #1e40af;
    }
    .header h1 {
      color: #1e40af;
      margin: 0;
    }
    .content {
      padding: 30px 0;
    }
    .info-box {
      background-color: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .info-item {
      margin: 10px 0;
    }
    .label {
      font-weight: bold;
      color: #666;
    }
    .button {
      display: inline-block;
      background-color: #1e40af;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      padding-top: 30px;
      border-top: 1px solid #e5e7eb;
      color: #999;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛥️ OKEAN YACHTS</h1>
      <p>Contrato de Construção Naval</p>
    </div>
    
    <div class="content">
      <p>Olá <strong>${recipientName}</strong>,</p>
      
      ${message ? `<p>${message}</p>` : `
        <p>Estamos enviando o contrato <strong>${contract.contract_number}</strong> para sua revisão.</p>
      `}
      
      <div class="info-box">
        <h3 style="margin-top: 0;">Resumo do Contrato</h3>
        <div class="info-item">
          <span class="label">Número:</span> ${contract.contract_number}
        </div>
        <div class="info-item">
          <span class="label">Modelo:</span> ${contract.yacht_model?.name}
        </div>
        <div class="info-item">
          <span class="label">Valor Total:</span> R$ ${contract.current_total_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </div>
        <div class="info-item">
          <span class="label">Prazo de Entrega:</span> ${contract.current_total_delivery_days} dias
        </div>
        <div class="info-item">
          <span class="label">Data de Assinatura:</span> ${new Date(contract.signed_at).toLocaleDateString("pt-BR")}
        </div>
      </div>
      
      ${atosHTML}
      
      <p>Para mais informações ou dúvidas, entre em contato conosco.</p>
      
      <p style="margin-top: 30px;">
        Atenciosamente,<br/>
        <strong>${userData?.full_name || "Equipe OKEAN Yachts"}</strong><br/>
        ${userData?.email || "contato@okeanyachts.com"}
      </p>
    </div>
    
    <div class="footer">
      <p>OKEAN Yachts - Construção Naval de Luxo</p>
      <p>Este é um email automático, por favor não responda.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "OKEAN Yachts <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: `Contrato ${contract.contract_number} - OKEAN Yachts`,
      html: emailHTML,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log the email send in audit_logs
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      user_email: user.email,
      user_name: userData?.full_name,
      action: "EMAIL_SENT",
      table_name: "contracts",
      record_id: contract_id,
      metadata: {
        recipient: recipientEmail,
        contract_number: contract.contract_number,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending contract email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
