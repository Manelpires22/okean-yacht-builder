import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContractPDFRequest {
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

    const { contract_id }: ContractPDFRequest = await req.json();

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

    // Generate simple HTML for PDF
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      padding: 40px;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #1e40af;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #1e40af;
      margin: 0;
      font-size: 32px;
    }
    .header p {
      margin: 5px 0;
      color: #666;
    }
    .section {
      margin: 30px 0;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #1e40af;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    .info-item {
      margin: 10px 0;
    }
    .info-label {
      font-weight: bold;
      color: #666;
      font-size: 12px;
      text-transform: uppercase;
    }
    .info-value {
      font-size: 16px;
      margin-top: 5px;
    }
    .ato-item {
      border: 1px solid #e5e7eb;
      padding: 15px;
      margin: 10px 0;
      border-radius: 5px;
    }
    .ato-title {
      font-weight: bold;
      font-size: 14px;
    }
    .ato-status {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 3px;
      font-size: 11px;
      margin-left: 10px;
    }
    .status-approved {
      background-color: #dcfce7;
      color: #166534;
    }
    .total-box {
      background-color: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      margin-top: 30px;
    }
    .total-item {
      display: flex;
      justify-content: space-between;
      margin: 10px 0;
      font-size: 16px;
    }
    .total-final {
      font-size: 24px;
      font-weight: bold;
      color: #1e40af;
      border-top: 2px solid #1e40af;
      padding-top: 15px;
      margin-top: 15px;
    }
    .footer {
      margin-top: 50px;
      text-align: center;
      font-size: 12px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>OKEAN YACHTS</h1>
    <p>Contrato de Construção Naval</p>
    <p style="font-size: 20px; font-weight: bold; margin-top: 15px;">${contract.contract_number}</p>
  </div>

  <div class="section">
    <div class="section-title">Informações do Contrato</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Cliente</div>
        <div class="info-value">${contract.client?.name || "N/A"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Modelo</div>
        <div class="info-value">${contract.yacht_model?.name || "N/A"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Data de Assinatura</div>
        <div class="info-value">${new Date(contract.signed_at).toLocaleDateString("pt-BR")}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Status</div>
        <div class="info-value">${contract.status === "active" ? "Ativo" : contract.status === "completed" ? "Concluído" : "Cancelado"}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Valores Contratuais</div>
    <div class="total-box">
      <div class="total-item">
        <span>Preço Base:</span>
        <span>R$ ${contract.base_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="total-item">
        <span>Prazo Base:</span>
        <span>${contract.base_delivery_days} dias</span>
      </div>
    </div>
  </div>

  ${contract.atos && contract.atos.length > 0 ? `
  <div class="section">
    <div class="section-title">ATOs (Additional To Order)</div>
    ${contract.atos.map((ato: any) => `
      <div class="ato-item">
        <div>
          <span class="ato-title">${ato.ato_number} - ${ato.title}</span>
          <span class="ato-status status-approved">${ato.status === "approved" ? "Aprovado" : ato.status}</span>
        </div>
        ${ato.description ? `<p style="margin: 10px 0; color: #666;">${ato.description}</p>` : ""}
        <div style="margin-top: 10px;">
          <span style="color: #16a34a; font-weight: bold;">+R$ ${ato.price_impact.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          <span style="margin-left: 20px; color: #ea580c; font-weight: bold;">+${ato.delivery_days_impact} dias</span>
        </div>
      </div>
    `).join("")}
  </div>
  ` : ""}

  <div class="section">
    <div class="section-title">Totais Atualizados</div>
    <div class="total-box">
      <div class="total-item">
        <span>Preço Base:</span>
        <span>R$ ${contract.base_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
      </div>
      ${contract.atos && contract.atos.filter((a: any) => a.status === "approved").length > 0 ? `
      <div class="total-item">
        <span>ATOs Aprovadas:</span>
        <span>R$ ${contract.atos.filter((a: any) => a.status === "approved").reduce((sum: number, a: any) => sum + Number(a.price_impact), 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
      </div>
      ` : ""}
      <div class="total-item total-final">
        <span>VALOR TOTAL:</span>
        <span>R$ ${contract.current_total_price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="total-item">
        <span>Prazo Total de Entrega:</span>
        <span style="font-size: 20px; font-weight: bold;">${contract.current_total_delivery_days} dias</span>
      </div>
    </div>
  </div>

  <div class="footer">
    <p>Este documento foi gerado eletronicamente pelo sistema CPQ da OKEAN Yachts</p>
    <p>Data de geração: ${new Date().toLocaleString("pt-BR")}</p>
  </div>
</body>
</html>
    `;

    // Convert HTML to PDF using external API (using htmltopdf.io or similar)
    // For now, return the HTML (can be enhanced with actual PDF generation)
    const pdfResponse = await fetch("https://api.html2pdf.app/v1/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        html: html,
        options: {
          format: "A4",
          margin: {
            top: "20mm",
            right: "15mm",
            bottom: "20mm",
            left: "15mm",
          },
        },
      }),
    });

    if (!pdfResponse.ok) {
      // Fallback: return HTML as base64
      const base64Html = btoa(unescape(encodeURIComponent(html)));
      return new Response(
        JSON.stringify({
          success: true,
          format: "html",
          data: base64Html,
          filename: `${contract.contract_number}.html`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    return new Response(
      JSON.stringify({
        success: true,
        format: "pdf",
        data: base64Pdf,
        filename: `${contract.contract_number}.pdf`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error generating contract PDF:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
