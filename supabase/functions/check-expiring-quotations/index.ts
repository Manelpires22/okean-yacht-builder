import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== Check Expiring Quotations Function Started ===");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date();
    const in1Day = new Date(today);
    in1Day.setDate(today.getDate() + 1);
    
    const in7Days = new Date(today);
    in7Days.setDate(today.getDate() + 7);
    
    const in20Days = new Date(today);
    in20Days.setDate(today.getDate() + 20);

    const results: {
      d20Reminders: number;
      d7Reminders: number;
      d1Reminders: number;
      errors: Array<{ quotation: string; error: string }>;
    } = {
      d20Reminders: 0,
      d7Reminders: 0,
      d1Reminders: 0,
      errors: []
    };

    // Buscar cotações enviadas que precisam de lembretes
    const { data: quotations, error: fetchError } = await supabase
      .from("quotations")
      .select(`
        *,
        users!quotations_sales_representative_id_fkey (full_name, email)
      `)
      .eq("status", "sent")
      .gte("valid_until", today.toISOString())
      .lte("valid_until", in20Days.toISOString());

    if (fetchError) throw fetchError;

    console.log(`Encontradas ${quotations?.length || 0} cotações para verificar`);

    for (const quotation of quotations || []) {
      const validUntil = new Date(quotation.valid_until);
      const daysRemaining = Math.ceil((validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      try {
        // Lembrete D-20
        if (daysRemaining <= 20 && daysRemaining > 7 && !quotation.expiration_reminder_sent_d20) {
          await sendReminderEmail(quotation, daysRemaining);
          await supabase
            .from("quotations")
            .update({ expiration_reminder_sent_d20: true })
            .eq("id", quotation.id);
          results.d20Reminders++;
          console.log(`Lembrete D-20 enviado para ${quotation.quotation_number}`);
        }

        // Lembrete D-7
        if (daysRemaining <= 7 && daysRemaining > 1 && !quotation.expiration_reminder_sent_d7) {
          await sendReminderEmail(quotation, daysRemaining);
          await supabase
            .from("quotations")
            .update({ expiration_reminder_sent_d7: true })
            .eq("id", quotation.id);
          results.d7Reminders++;
          console.log(`Lembrete D-7 enviado para ${quotation.quotation_number}`);
        }

        // Lembrete D-1
        if (daysRemaining <= 1 && !quotation.expiration_reminder_sent_d1) {
          await sendReminderEmail(quotation, daysRemaining);
          await supabase
            .from("quotations")
            .update({ expiration_reminder_sent_d1: true })
            .eq("id", quotation.id);
          results.d1Reminders++;
          console.log(`Lembrete D-1 enviado para ${quotation.quotation_number}`);
        }
      } catch (error: any) {
        console.error(`Erro ao processar ${quotation.quotation_number}:`, error);
        results.errors.push({
          quotation: quotation.quotation_number,
          error: error.message
        });
      }
    }

    console.log("Resultados:", results);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Erro geral:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

async function sendReminderEmail(quotation: any, daysRemaining: number) {
  const sellerEmail = quotation.users?.email;
  if (!sellerEmail) {
    throw new Error("Email do vendedor não encontrado");
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const urgencyLevel = daysRemaining <= 1 ? "🔴 URGENTE" : 
                       daysRemaining <= 7 ? "🟡 ATENÇÃO" : "🟢 AVISO";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; }
        .alert { background: ${daysRemaining <= 1 ? '#fef2f2' : daysRemaining <= 7 ? '#fffbeb' : '#f0fdf4'}; 
                 border-left: 4px solid ${daysRemaining <= 1 ? '#dc2626' : daysRemaining <= 7 ? '#f59e0b' : '#16a34a'};
                 padding: 15px; margin: 20px 0; }
        .button { display: inline-block; background: #1e40af; color: white; 
                 padding: 12px 24px; text-decoration: none; border-radius: 6px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>OKEAN Yachts</h1>
          <p>Lembrete de Expiração de Proposta</p>
        </div>
        <div class="content">
          <div class="alert">
            <h2>${urgencyLevel} Proposta Expirando em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}</h2>
          </div>
          
          <p>Olá ${quotation.users?.full_name || 'Vendedor'},</p>
          
          <p>A proposta <strong>${quotation.quotation_number}</strong> está próxima de expirar:</p>
          
          <ul>
            <li><strong>Cliente:</strong> ${quotation.client_name}</li>
            <li><strong>Valor:</strong> ${formatCurrency(quotation.final_price)}</li>
            <li><strong>Válida até:</strong> ${formatDate(quotation.valid_until)}</li>
            <li><strong>Dias restantes:</strong> ${daysRemaining}</li>
          </ul>
          
          <p>
            ${daysRemaining <= 1 
              ? '⚠️ Esta é sua última chance! A proposta expira amanhã.' 
              : daysRemaining <= 7 
              ? '⏰ Entre em contato com o cliente para confirmar o interesse.'
              : '📅 Mantenha contato com o cliente para não perder esta oportunidade.'
            }
          </p>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '')}.lovableproject.com/quotations/${quotation.id}" 
               class="button">
              Ver Proposta Completa
            </a>
          </p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Após a expiração, será necessário criar uma nova revisão da proposta com validade atualizada.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: "OKEAN Yachts <onboarding@resend.dev>",
    to: [sellerEmail],
    subject: `${urgencyLevel} - Proposta ${quotation.quotation_number} expira em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}`,
    html
  });
}
