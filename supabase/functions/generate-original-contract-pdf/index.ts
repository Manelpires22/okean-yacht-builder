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
    console.log("=== Generate Premium Original Contract PDF Started ===");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) throw new Error("Unauthorized");

    const { contract_id } = await req.json();
    if (!contract_id) throw new Error("contract_id is required");

    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select(`*, client:clients(*), yacht_model:yacht_models(*), quotation:quotations(*)`)
      .eq("id", contract_id)
      .single();

    if (contractError || !contract) throw new Error("Contract not found");

    const baseSnapshot = contract.base_snapshot as any;
    if (!baseSnapshot) throw new Error("No base snapshot available");

    console.log("Contract found:", contract.contract_number);

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageW - (margin * 2);

    // CAPA
    function addCoverPage() {
      drawPremiumCover(doc, pageW, pageH, {
        title: "Contrato Original",
        subtitle: "Como aprovado pelo cliente",
        documentNumber: contract.contract_number,
        clientName: contract.client?.name,
        modelName: contract.yacht_model?.name,
        totalValue: contract.base_price,
        date: formatDate(contract.signed_at),
        badgeText: "Documento Original",
        badgeStatus: "info",
      });
    }

    // INFO
    function addContractInfo() {
      doc.addPage();
      let yPos = drawPageHeader("Informações do Contrato Original", pageW, margin);

      drawPremiumBox(doc, margin, yPos, contentWidth, 75, "light");
      yPos += 15;

      drawInfoList(doc, [
        { label: "Contrato", value: contract.contract_number },
        { label: "Assinatura", value: formatDateShort(contract.signed_at) },
        { label: "Cliente", value: contract.client?.name || "N/A" },
        { label: "Email", value: contract.signed_by_email || "N/A" },
        { label: "Modelo", value: contract.yacht_model?.name || "N/A" },
      ], yPos, margin + 10, 50);
    }

    // OPCIONAIS
    function addSelectedOptions() {
      const options = baseSnapshot.selectedOptions || [];
      if (options.length === 0) return;

      doc.addPage();
      let yPos = drawPageHeader("Opcionais Selecionados (Original)", pageW, margin);

      options.forEach((opt: any) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = drawPageHeader("Opcionais (cont.)", pageW, margin);
        }

        drawPremiumBox(doc, margin, yPos, contentWidth, 22, "light");
        yPos += 10;
        
        doc.setFontSize(10);
        setupFont(doc, "bold");
        setColor(doc, COLORS.textDark, "text");
        doc.text(`• ${opt.name || "N/A"}`, margin + 5, yPos);

        if (opt.total_price) {
          setColor(doc, COLORS.navy, "text");
          doc.text(formatCurrency(opt.total_price), pageW - margin - 5, yPos, { align: "right" });
        }

        yPos += 17;
      });
    }

    // FINANCEIRO
    function addFinancialSummary() {
      doc.addPage();
      let yPos = drawPageHeader("Resumo Financeiro Original", pageW, margin);

      const items = [{ label: "Preço Base", value: contract.base_price }];
      if (baseSnapshot.totalOptionsPrice) {
        items.push({ label: "Opcionais", value: baseSnapshot.totalOptionsPrice });
      }

      yPos = drawFinancialSummary(doc, items, { label: "TOTAL ORIGINAL", value: contract.base_price }, margin, yPos, contentWidth);

      yPos += 25;
      drawPremiumBox(doc, margin, yPos, contentWidth, 30, "info");
      yPos += 18;
      doc.setFontSize(12);
      setupFont(doc);
      setColor(doc, COLORS.textDark, "text");
      doc.text("Prazo de Entrega:", margin + 15, yPos);
      setupFont(doc, "bold");
      doc.text(`${contract.base_delivery_days} dias`, pageW - margin - 15, yPos, { align: "right" });
    }

    // ASSINATURA
    function addSignature() {
      doc.addPage();
      let yPos = drawPageHeader("Assinatura do Cliente", pageW, margin);

      yPos += 40;
      if (contract.signed_by_name) {
        setColor(doc, COLORS.textMuted, "draw");
        doc.setLineWidth(0.5);
        doc.line(pageW / 2 - 50, yPos, pageW / 2 + 50, yPos);

        yPos += 8;
        doc.setFontSize(14);
        setupFont(doc, "bold");
        setColor(doc, COLORS.textDark, "text");
        doc.text(contract.signed_by_name, pageW / 2, yPos, { align: "center" });

        yPos += 8;
        doc.setFontSize(10);
        setupFont(doc);
        setColor(doc, COLORS.textMuted, "text");
        doc.text(contract.signed_by_email || "", pageW / 2, yPos, { align: "center" });

        yPos += 10;
        doc.text(`Assinado em: ${formatDateShort(contract.signed_at)}`, pageW / 2, yPos, { align: "center" });
      }
    }

    addCoverPage();
    addContractInfo();
    addSelectedOptions();
    addFinancialSummary();
    addSignature();
    addFootersToAllPages(doc, pageW, pageH, `Contrato Original - ${contract.contract_number}`, margin);

    const pdfData = doc.output("arraybuffer");
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfData)));

    console.log("✓ Premium Original Contract PDF generated");

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
