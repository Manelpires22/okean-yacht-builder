import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendQuotationEmailRequest {
  quotationId: string;
  recipientEmail: string;
  subject?: string;
  message?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== Send Quotation Email Function Started ===");

    // Criar cliente Supabase com service role para bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { quotationId, recipientEmail, subject, message }: SendQuotationEmailRequest = 
      await req.json();

    console.log("Request data:", { quotationId, recipientEmail });

    if (!quotationId || !recipientEmail) {
      throw new Error("quotationId e recipientEmail são obrigatórios");
    }

    // Buscar dados da cotação
    const { data: quotation, error: fetchError } = await supabase
      .from("quotations")
      .select(`
        *,
        yacht_models (name, code, description, image_url),
        clients (name, company, email),
        users!quotations_sales_representative_id_fkey (full_name, email)
      `)
      .eq("id", quotationId)
      .single();

    if (fetchError) {
      console.error("Erro ao buscar cotação:", fetchError);
      throw fetchError;
    }

    if (!quotation) {
      throw new Error("Cotação não encontrada");
    }

    console.log("Cotação encontrada:", quotation.quotation_number);

    // Gerar link público de aceite
    const acceptanceLink = `${supabaseUrl.replace('.supabase.co', '')}.lovableproject.com/p/${quotation.secure_token}`;

    // Formatar valores
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    };

    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString('pt-BR');
    };

    // Template do email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .quotation-card {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .label {
            color: #6b7280;
            font-weight: 500;
          }
          .value {
            color: #111827;
            font-weight: 600;
          }
          .cta-button {
            display: inline-block;
            background: #1e40af;
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
          }
          .cta-button:hover {
            background: #1e3a8a;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
          }
          .message-box {
            background: white;
            border-left: 4px solid #1e40af;
            padding: 15px;
            margin: 20px 0;
            white-space: pre-line;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">OKEAN Yachts</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Proposta de Aquisição</p>
        </div>
        
        <div class="content">
          ${message ? `
            <div class="message-box">
              ${message}
            </div>
          ` : ''}
          
          <div class="quotation-card">
            <h2 style="margin-top: 0; color: #1e40af;">Detalhes da Proposta</h2>
            
            <div class="detail-row">
              <span class="label">Número da Proposta</span>
              <span class="value">${quotation.quotation_number}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">Modelo</span>
              <span class="value">${quotation.yacht_models?.name || 'N/A'}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">Valor Total</span>
              <span class="value" style="font-size: 20px; color: #1e40af;">
                ${formatCurrency(quotation.final_price)}
              </span>
            </div>
            
            <div class="detail-row">
              <span class="label">Prazo de Entrega</span>
              <span class="value">${quotation.total_delivery_days} dias</span>
            </div>
            
            <div class="detail-row">
              <span class="label">Válida até</span>
              <span class="value">${formatDate(quotation.valid_until)}</span>
            </div>
            
            <div class="detail-row">
              <span class="label">Vendedor</span>
              <span class="value">${quotation.users?.full_name || 'N/A'}</span>
            </div>
          </div>
          
          <div style="text-align: center;">
            <a href="${acceptanceLink}" class="cta-button">
              📄 Visualizar e Aceitar Proposta
            </a>
            <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
              Clique no botão acima para visualizar todos os detalhes<br>
              e aceitar a proposta com um clique
            </p>
          </div>
          
          <div class="footer">
            <p>
              <strong>OKEAN Yachts</strong><br>
              Iates de Luxo Personalizados<br>
              <a href="mailto:${quotation.users?.email}" style="color: #1e40af;">
                ${quotation.users?.email}
              </a>
            </p>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 15px;">
              Esta proposta é válida até ${formatDate(quotation.valid_until)}.<br>
              Após esta data, poderá estar sujeita a alterações de preço e prazo.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar email via Resend
    console.log("Enviando email para:", recipientEmail);
    
    const emailResponse = await resend.emails.send({
      from: "OKEAN Yachts <onboarding@resend.dev>", // TODO: Trocar por domínio verificado
      to: [recipientEmail],
      subject: subject || `Proposta OKEAN Yachts - ${quotation.quotation_number}`,
      html: emailHtml,
    });

    console.log("Email enviado com sucesso:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailResponse,
        quotationNumber: quotation.quotation_number,
        acceptanceLink
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Erro ao enviar email:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erro ao enviar email",
        details: error
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
