import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

import {
  COLORS,
  setupFont,
  setColor,
  formatCurrency,
  formatDate,
  formatDateShort,
  drawGoldLine,
  drawPremiumBox,
  drawPageHeader,
  addFootersToAllPages,
  drawPremiumCover,
  drawInfoList,
  drawFinancialSummary,
} from "../_shared/pdf-design-system.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== Generate Premium Contract PDF Started ===");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) throw new Error("Unauthorized");

    const { contract_id } = await req.json();
    if (!contract_id) throw new Error("contract_id is required");

    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select(`*, client:clients(*), yacht_model:yacht_models(*), atos:additional_to_orders(*)`)
      .eq("id", contract_id)
      .single();

    if (contractError || !contract) throw new Error("Contract not found");

    console.log("Contract found:", contract.contract_number);

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageW - (margin * 2);

    // CAPA
    function addCoverPage() {
      drawPremiumCover(doc, pageW, pageH, {
        title: "Resumo do Contrato",
        subtitle: contract.yacht_model?.name,
        documentNumber: contract.contract_number,
        clientName: contract.client?.name,
        totalValue: contract.current_total_price,
        date: formatDate(contract.signed_at || contract.created_at),
        badgeText: contract.status === "active" ? "Ativo" : contract.status === "completed" ? "Concluído" : "Cancelado",
        badgeStatus: contract.status === "active" ? "approved" : contract.status === "completed" ? "info" : "rejected",
      });
    }

    // INFO
    function addContractInfo() {
      doc.addPage();
      let yPos = drawPageHeader("Informações do Contrato", pageW, margin);

      drawPremiumBox(doc, margin, yPos, contentWidth, 85, "light");
      yPos += 15;

      drawInfoList(doc, [
        { label: "Contrato", value: contract.contract_number },
        { label: "Cliente", value: contract.client?.name || "N/A" },
        { label: "Modelo", value: contract.yacht_model?.name || "N/A" },
        { label: "Assinatura", value: formatDateShort(contract.signed_at) },
        { label: "Assinado por", value: contract.signed_by_name || "N/A" },
        { label: "Status", value: contract.status === "active" ? "Ativo" : contract.status === "completed" ? "Concluído" : "Cancelado" },
      ], yPos, margin + 10, 50);
    }

    // ATOs
    function addATOs() {
      const approvedATOs = contract.atos?.filter((a: any) => a.status === "approved") || [];
      if (approvedATOs.length === 0) return;

      doc.addPage();
      let yPos = drawPageHeader("ATOs Aprovadas", pageW, margin);

      approvedATOs.forEach((ato: any) => {
        if (yPos > 240) {
          doc.addPage();
          yPos = drawPageHeader("ATOs Aprovadas (cont.)", pageW, margin);
        }

        drawPremiumBox(doc, margin, yPos, contentWidth, 32, "light");
        
        yPos += 10;
        doc.setFontSize(11);
        setupFont(doc, "bold");
        setColor(doc, COLORS.navy, "text");
        doc.text(`${ato.ato_number} - ${ato.title}`, margin + 5, yPos);

        yPos += 10;
        doc.setFontSize(10);
        setupFont(doc);
        setColor(doc, COLORS.success, "text");
        doc.text(formatCurrency(ato.price_impact || 0), margin + 5, yPos);
        
        if (ato.delivery_days_impact) {
          setColor(doc, COLORS.warning, "text");
          doc.text(`+${ato.delivery_days_impact} dias`, margin + 70, yPos);
        }

        yPos += 27;
      });
    }

    // TOTAIS
    function addTotals() {
      doc.addPage();
      let yPos = drawPageHeader("Totais Atualizados", pageW, margin);

      const approvedATOs = contract.atos?.filter((a: any) => a.status === "approved") || [];
      const totalATOsPrice = approvedATOs.reduce((sum: number, a: any) => sum + (a.price_impact || 0), 0);
      const maxATOsDays = approvedATOs.reduce((max: number, a: any) => Math.max(max, a.delivery_days_impact || 0), 0);

      const items = [{ label: "Preço Base", value: contract.base_price }];
      if (totalATOsPrice > 0) items.push({ label: "ATOs Aprovadas", value: totalATOsPrice });

      yPos = drawFinancialSummary(doc, items, { label: "VALOR TOTAL", value: contract.current_total_price }, margin, yPos, contentWidth);

      yPos += 25;
      doc.setFontSize(14);
      setupFont(doc, "bold");
      setColor(doc, COLORS.navy, "text");
      doc.text("Prazo de Entrega", margin, yPos);
      yPos += 5;
      drawGoldLine(doc, yPos, margin, margin + 60);

      yPos += 15;
      drawPremiumBox(doc, margin, yPos, contentWidth, 50, "info");
      yPos += 15;

      drawInfoList(doc, [
        { label: "Prazo Base", value: `${contract.base_delivery_days} dias` },
        { label: "Impacto ATOs", value: maxATOsDays > 0 ? `+${maxATOsDays} dias` : "Sem impacto" },
        { label: "Prazo Total", value: `${contract.current_total_delivery_days} dias` },
      ], yPos, margin + 10, 50);
    }

    addCoverPage();
    addContractInfo();
    addATOs();
    addTotals();
    addFootersToAllPages(doc, pageW, pageH, contract.contract_number, margin);

    const pdfData = doc.output("arraybuffer");
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfData)));

    console.log("✓ Premium Contract PDF generated");

    return new Response(JSON.stringify({ success: true, format: "pdf", data: base64Pdf }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
