import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ===== FORMATTERS =====
function formatCurrency(value: number): string {
  if (!value && value !== 0) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2
  }).format(value);
}

function formatDateShort(date: string): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(date));
}

// ===== CLEAN STYLE RENDERER =====
// Tipografia simples, sem cores, sem imagens, compacto

const CLEAN_COLORS = {
  black: { r: 30, g: 30, b: 35 },
  gray: { r: 100, g: 100, b: 105 },
  lightGray: { r: 180, g: 180, b: 180 },
  white: { r: 255, g: 255, b: 255 },
};

function setupFont(doc: jsPDF, style: "normal" | "bold" | "italic" = "normal") {
  doc.setFont("helvetica", style);
}

function drawCleanHeader(doc: jsPDF, pageW: number, margin: number): number {
  let yPos = 20;
  
  // Título OKEAN YACHTS
  doc.setFontSize(14);
  setupFont(doc, "bold");
  doc.setTextColor(CLEAN_COLORS.black.r, CLEAN_COLORS.black.g, CLEAN_COLORS.black.b);
  doc.text("OKEAN YACHTS", margin, yPos);
  
  // Linha fina
  yPos += 5;
  doc.setDrawColor(CLEAN_COLORS.lightGray.r, CLEAN_COLORS.lightGray.g, CLEAN_COLORS.lightGray.b);
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageW - margin, yPos);
  
  return yPos + 10;
}

function drawCleanSectionTitle(doc: jsPDF, title: string, yPos: number, margin: number, pageW: number): number {
  doc.setFontSize(11);
  setupFont(doc, "bold");
  doc.setTextColor(CLEAN_COLORS.black.r, CLEAN_COLORS.black.g, CLEAN_COLORS.black.b);
  doc.text(title.toUpperCase(), margin, yPos);
  
  // Linha abaixo do título
  yPos += 2;
  doc.setDrawColor(CLEAN_COLORS.lightGray.r, CLEAN_COLORS.lightGray.g, CLEAN_COLORS.lightGray.b);
  doc.setLineWidth(0.2);
  doc.line(margin, yPos, pageW - margin, yPos);
  
  return yPos + 8;
}

function drawCleanInfoRow(doc: jsPDF, label: string, value: string, yPos: number, margin: number, labelWidth: number = 55): number {
  doc.setFontSize(10);
  setupFont(doc, "bold");
  doc.setTextColor(CLEAN_COLORS.gray.r, CLEAN_COLORS.gray.g, CLEAN_COLORS.gray.b);
  doc.text(label + ":", margin, yPos);
  
  setupFont(doc, "normal");
  doc.setTextColor(CLEAN_COLORS.black.r, CLEAN_COLORS.black.g, CLEAN_COLORS.black.b);
  doc.text(value, margin + labelWidth, yPos);
  
  return yPos + 6;
}

function drawCleanDivider(doc: jsPDF, yPos: number, margin: number, pageW: number): number {
  doc.setDrawColor(CLEAN_COLORS.lightGray.r, CLEAN_COLORS.lightGray.g, CLEAN_COLORS.lightGray.b);
  doc.setLineWidth(0.2);
  doc.line(margin, yPos, pageW - margin, yPos);
  return yPos + 8;
}

function drawCleanFooter(doc: jsPDF, pageNum: number, totalPages: number, pageW: number, pageH: number, documentRef: string, margin: number) {
  const footerY = pageH - 12;
  
  doc.setDrawColor(CLEAN_COLORS.lightGray.r, CLEAN_COLORS.lightGray.g, CLEAN_COLORS.lightGray.b);
  doc.setLineWidth(0.2);
  doc.line(margin, footerY - 5, pageW - margin, footerY - 5);
  
  doc.setFontSize(8);
  setupFont(doc, "normal");
  doc.setTextColor(CLEAN_COLORS.gray.r, CLEAN_COLORS.gray.g, CLEAN_COLORS.gray.b);
  doc.text("OKEAN YACHTS", margin, footerY);
  doc.text(documentRef, pageW / 2, footerY, { align: "center" });
  doc.text(`${pageNum} / ${totalPages}`, pageW - margin, footerY, { align: "right" });
}

function addCleanFootersToAllPages(doc: jsPDF, pageW: number, pageH: number, documentRef: string, margin: number) {
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawCleanFooter(doc, i, totalPages, pageW, pageH, documentRef, margin);
  }
}

// ===== CLEAN PDF GENERATOR =====
function generateCleanContractPDF(doc: jsPDF, contract: any) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 20;
  
  let yPos = drawCleanHeader(doc, pageW, margin);
  
  // TÍTULO DO DOCUMENTO
  doc.setFontSize(16);
  setupFont(doc, "bold");
  doc.setTextColor(CLEAN_COLORS.black.r, CLEAN_COLORS.black.g, CLEAN_COLORS.black.b);
  doc.text("RESUMO DO CONTRATO", margin, yPos);
  yPos += 5;
  
  doc.setFontSize(12);
  setupFont(doc, "normal");
  doc.text(contract.contract_number, margin, yPos);
  yPos += 12;
  
  yPos = drawCleanDivider(doc, yPos, margin, pageW);
  
  // INFORMAÇÕES DO CONTRATO
  yPos = drawCleanSectionTitle(doc, "Informações", yPos, margin, pageW);
  
  yPos = drawCleanInfoRow(doc, "Número do Contrato", contract.contract_number, yPos, margin);
  yPos = drawCleanInfoRow(doc, "Cliente", contract.client?.name || "N/A", yPos, margin);
  yPos = drawCleanInfoRow(doc, "Modelo do Iate", contract.yacht_model?.name || "N/A", yPos, margin);
  yPos = drawCleanInfoRow(doc, "Data de Assinatura", formatDateShort(contract.signed_at), yPos, margin);
  yPos = drawCleanInfoRow(doc, "Assinado por", contract.signed_by_name || "N/A", yPos, margin);
  
  const statusText = contract.status === "active" ? "Ativo" : 
                     contract.status === "completed" ? "Concluído" : "Cancelado";
  yPos = drawCleanInfoRow(doc, "Status", statusText, yPos, margin);
  yPos += 6;
  
  yPos = drawCleanDivider(doc, yPos, margin, pageW);
  
  // VALORES CONTRATUAIS
  yPos = drawCleanSectionTitle(doc, "Valores Contratuais", yPos, margin, pageW);
  
  yPos = drawCleanInfoRow(doc, "Preço Base", formatCurrency(contract.base_price), yPos, margin);
  yPos = drawCleanInfoRow(doc, "Prazo Base", `${contract.base_delivery_days} dias`, yPos, margin);
  yPos += 6;
  
  // ATOs APROVADAS
  const approvedATOs = contract.atos?.filter((a: any) => a.status === "approved") || [];
  
  if (approvedATOs.length > 0) {
    yPos = drawCleanDivider(doc, yPos, margin, pageW);
    yPos = drawCleanSectionTitle(doc, "ATOs Aprovadas", yPos, margin, pageW);
    
    let totalATOsPrice = 0;
    let maxDeliveryImpact = 0;
    
    approvedATOs.forEach((ato: any) => {
      // Verificar se precisa nova página
      if (yPos > pageH - 40) {
        doc.addPage();
        yPos = drawCleanHeader(doc, pageW, margin);
        yPos = drawCleanSectionTitle(doc, "ATOs Aprovadas (continuação)", yPos, margin, pageW);
      }
      
      const priceImpact = ato.price_impact || 0;
      const daysImpact = ato.delivery_days_impact || 0;
      totalATOsPrice += priceImpact;
      maxDeliveryImpact = Math.max(maxDeliveryImpact, daysImpact);
      
      doc.setFontSize(10);
      setupFont(doc, "normal");
      doc.setTextColor(CLEAN_COLORS.black.r, CLEAN_COLORS.black.g, CLEAN_COLORS.black.b);
      
      const atoText = `• ${ato.ato_number} - ${ato.title}`;
      doc.text(atoText, margin, yPos);
      
      // Valores à direita
      const impactText = daysImpact > 0 
        ? `${formatCurrency(priceImpact)} (+${daysImpact} dias)`
        : formatCurrency(priceImpact);
      doc.text(impactText, pageW - margin, yPos, { align: "right" });
      
      yPos += 6;
    });
    
    yPos += 6;
  }
  
  // TOTAIS ATUALIZADOS
  yPos = drawCleanDivider(doc, yPos, margin, pageW);
  yPos = drawCleanSectionTitle(doc, "Totais Atualizados", yPos, margin, pageW);
  
  yPos = drawCleanInfoRow(doc, "Valor Total", formatCurrency(contract.current_total_price), yPos, margin);
  yPos = drawCleanInfoRow(doc, "Prazo Total", `${contract.current_total_delivery_days} dias`, yPos, margin);
  
  // Footer
  addCleanFootersToAllPages(doc, pageW, pageH, contract.contract_number, margin);
}

// ===== MAIN SERVER =====
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== Generate Contract PDF Started ===");

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

    const { contract_id, style } = await req.json();
    if (!contract_id) throw new Error("contract_id is required");

    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select(`*, client:clients(*), yacht_model:yacht_models(*), atos:additional_to_orders(*)`)
      .eq("id", contract_id)
      .single();

    if (contractError || !contract) throw new Error("Contract not found");

    console.log("Contract found:", contract.contract_number);
    console.log("Style requested:", style || "clean (default)");

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    // Por padrão usar estilo CLEAN (limpo, sem cores)
    // Estilo 'premium' pode ser implementado depois se necessário
    generateCleanContractPDF(doc, contract);

    const pdfData = doc.output("arraybuffer");
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfData)));

    console.log("✓ Clean Contract PDF generated successfully");

    return new Response(JSON.stringify({ success: true, format: "pdf", data: base64Pdf }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating contract PDF:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
