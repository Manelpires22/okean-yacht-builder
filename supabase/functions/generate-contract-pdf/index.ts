import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ===== PALETA DE CORES PREMIUM =====
const COLORS = {
  navy: { r: 12, g: 35, b: 64 },
  navyDark: { r: 8, g: 24, b: 48 },
  navyLight: { r: 20, g: 50, b: 90 },
  gold: { r: 197, g: 162, b: 99 },
  goldLight: { r: 218, g: 190, b: 140 },
  goldDark: { r: 160, g: 130, b: 70 },
  white: { r: 255, g: 255, b: 255 },
  champagne: { r: 250, g: 248, b: 244 },
  platinum: { r: 235, g: 235, b: 232 },
  silver: { r: 200, g: 200, b: 200 },
  textDark: { r: 30, g: 30, b: 35 },
  textMuted: { r: 100, g: 100, b: 105 },
  textLight: { r: 255, g: 255, b: 255 },
  success: { r: 34, g: 140, b: 90 },
  successLight: { r: 232, g: 245, b: 238 },
  warning: { r: 200, g: 140, b: 40 },
  warningLight: { r: 255, g: 248, b: 230 },
  error: { r: 180, g: 60, b: 60 },
  errorLight: { r: 255, g: 235, b: 235 },
  info: { r: 59, g: 130, b: 246 },
  infoLight: { r: 232, g: 244, b: 253 },
};

type ColorDef = { r: number; g: number; b: number };

function setupFont(doc: jsPDF, style: "normal" | "bold" | "italic" = "normal") {
  doc.setFont("helvetica", style);
}

function setColor(doc: jsPDF, color: ColorDef, type: "fill" | "text" | "draw" = "text") {
  if (type === "fill") {
    doc.setFillColor(color.r, color.g, color.b);
  } else if (type === "draw") {
    doc.setDrawColor(color.r, color.g, color.b);
  } else {
    doc.setTextColor(color.r, color.g, color.b);
  }
}

function formatCurrency(value: number): string {
  if (!value && value !== 0) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2
  }).format(value);
}

function formatDate(date: string): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(date));
}

function formatDateShort(date: string): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(date));
}

function drawGradientBackground(doc: jsPDF, pageW: number, yStart: number = 0, yEnd: number = 297) {
  const steps = 50;
  const stepHeight = (yEnd - yStart) / steps;
  for (let i = 0; i < steps; i++) {
    const ratio = i / steps;
    const r = Math.round(COLORS.navy.r + (COLORS.navyDark.r - COLORS.navy.r) * ratio);
    const g = Math.round(COLORS.navy.g + (COLORS.navyDark.g - COLORS.navy.g) * ratio);
    const b = Math.round(COLORS.navy.b + (COLORS.navyDark.b - COLORS.navy.b) * ratio);
    doc.setFillColor(r, g, b);
    doc.rect(0, yStart + (i * stepHeight), pageW, stepHeight + 1, "F");
  }
}

function drawGoldLine(doc: jsPDF, y: number, xStart: number, xEnd: number) {
  setColor(doc, COLORS.gold, "draw");
  doc.setLineWidth(1);
  doc.line(xStart, y, xEnd, y);
}

function drawPremiumBox(doc: jsPDF, x: number, y: number, w: number, h: number, style: "light" | "dark" | "gold" | "info" | "success" | "warning" = "light") {
  if (style === "dark") {
    doc.setFillColor(COLORS.navy.r, COLORS.navy.g, COLORS.navy.b);
  } else if (style === "gold") {
    doc.setFillColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
  } else if (style === "info") {
    doc.setFillColor(COLORS.infoLight.r, COLORS.infoLight.g, COLORS.infoLight.b);
  } else if (style === "success") {
    doc.setFillColor(COLORS.successLight.r, COLORS.successLight.g, COLORS.successLight.b);
  } else if (style === "warning") {
    doc.setFillColor(COLORS.warningLight.r, COLORS.warningLight.g, COLORS.warningLight.b);
  } else {
    doc.setFillColor(COLORS.champagne.r, COLORS.champagne.g, COLORS.champagne.b);
  }
  doc.roundedRect(x, y, w, h, 3, 3, "F");
  
  if (style === "gold") {
    doc.setDrawColor(COLORS.goldDark.r, COLORS.goldDark.g, COLORS.goldDark.b);
  } else if (style === "dark") {
    doc.setDrawColor(COLORS.navyLight.r, COLORS.navyLight.g, COLORS.navyLight.b);
  } else {
    doc.setDrawColor(COLORS.platinum.r, COLORS.platinum.g, COLORS.platinum.b);
  }
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, 3, 3, "S");
}

function drawStatusBadge(doc: jsPDF, text: string, x: number, y: number, status: "approved" | "pending" | "rejected" | "info" = "info") {
  const width = doc.getTextWidth(text) + 10;
  const height = 7;
  let bgColor: ColorDef;
  const textColor: ColorDef = COLORS.white;
  switch (status) {
    case "approved": bgColor = COLORS.success; break;
    case "rejected": bgColor = COLORS.error; break;
    case "pending": bgColor = COLORS.warning; break;
    default: bgColor = COLORS.navy;
  }
  setColor(doc, bgColor, "fill");
  doc.roundedRect(x - width / 2, y - height + 2, width, height, 2, 2, "F");
  setColor(doc, textColor, "text");
  doc.setFontSize(8);
  setupFont(doc, "bold");
  doc.text(text, x, y, { align: "center" });
}

function drawPageHeader(doc: jsPDF, title: string, pageW: number, margin: number = 20): number {
  setColor(doc, COLORS.navy, "fill");
  doc.rect(0, 0, pageW, 45, "F");
  setColor(doc, COLORS.gold, "fill");
  doc.rect(0, 43, pageW, 2, "F");
  setColor(doc, COLORS.textLight, "text");
  doc.setFontSize(10);
  setupFont(doc, "bold");
  doc.text("OKEAN YACHTS", margin, 18);
  setColor(doc, COLORS.gold, "text");
  doc.setFontSize(18);
  setupFont(doc, "bold");
  doc.text(title, margin, 32);
  return 55;
}

function drawPageFooter(doc: jsPDF, pageNum: number, totalPages: number, pageW: number, pageH: number, documentRef: string = "", margin: number = 20) {
  const footerY = pageH - 15;
  setColor(doc, COLORS.platinum, "draw");
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pageW - margin, footerY - 5);
  setColor(doc, COLORS.textMuted, "text");
  doc.setFontSize(8);
  setupFont(doc);
  doc.text("OKEAN YACHTS", margin, footerY);
  if (documentRef) doc.text(documentRef, pageW / 2, footerY, { align: "center" });
  doc.text(`${pageNum} / ${totalPages}`, pageW - margin, footerY, { align: "right" });
  doc.setFontSize(7);
  doc.text("Documento confidencial - Uso exclusivo do destinatário", pageW / 2, footerY + 4, { align: "center" });
}

function addFootersToAllPages(doc: jsPDF, pageW: number, pageH: number, documentRef: string = "", margin: number = 20) {
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawPageFooter(doc, i, totalPages, pageW, pageH, documentRef, margin);
  }
}

function drawPremiumCover(doc: jsPDF, pageW: number, pageH: number, options: {
  title: string; subtitle?: string; documentNumber: string; clientName?: string;
  modelName?: string; totalValue?: number; date?: string;
  badgeText?: string; badgeStatus?: "approved" | "pending" | "rejected" | "info";
}) {
  drawGradientBackground(doc, pageW, 0, pageH);
  doc.setDrawColor(20, 45, 75);
  doc.setLineWidth(0.3);
  for (let i = 0; i < 15; i++) doc.line(0, i * 25, pageW, i * 25 + 40);
  
  let yPos = 50;
  setColor(doc, COLORS.textLight, "text");
  doc.setFontSize(14);
  setupFont(doc);
  doc.setCharSpace(8);
  doc.text("OKEAN YACHTS", pageW / 2, yPos, { align: "center" });
  doc.setCharSpace(0);
  
  yPos += 15;
  setColor(doc, COLORS.gold, "draw");
  doc.setLineWidth(0.8);
  doc.line(pageW / 2 - 40, yPos, pageW / 2 + 40, yPos);
  
  yPos += 12;
  doc.setFontSize(9);
  setupFont(doc, "italic");
  setColor(doc, COLORS.goldLight, "text");
  doc.text("Excelência em Embarcações de Luxo", pageW / 2, yPos, { align: "center" });
  
  yPos = pageH / 2 - 40;
  if (options.title) {
    setColor(doc, COLORS.textLight, "text");
    doc.setFontSize(32);
    setupFont(doc, "bold");
    doc.text(options.title.toUpperCase(), pageW / 2, yPos, { align: "center" });
  }
  if (options.subtitle) {
    yPos += 15;
    doc.setFontSize(14);
    setupFont(doc);
    setColor(doc, COLORS.gold, "text");
    doc.text(options.subtitle, pageW / 2, yPos, { align: "center" });
  }
  if (options.badgeText) {
    yPos += 20;
    drawStatusBadge(doc, options.badgeText.toUpperCase(), pageW / 2, yPos, options.badgeStatus || "info");
  }
  
  yPos = pageH - 110;
  setColor(doc, COLORS.goldLight, "text");
  doc.setFontSize(10);
  setupFont(doc);
  doc.setCharSpace(3);
  doc.text("DOCUMENTO", pageW / 2, yPos, { align: "center" });
  doc.setCharSpace(0);
  
  yPos += 12;
  setColor(doc, COLORS.textLight, "text");
  doc.setFontSize(20);
  setupFont(doc, "bold");
  doc.text(options.documentNumber, pageW / 2, yPos, { align: "center" });
  
  if (options.clientName) {
    yPos += 15;
    doc.setFontSize(12);
    setupFont(doc);
    doc.text(`Preparado para: ${options.clientName}`, pageW / 2, yPos, { align: "center" });
  }
  if (options.modelName) {
    yPos += 10;
    setColor(doc, COLORS.gold, "text");
    doc.text(options.modelName, pageW / 2, yPos, { align: "center" });
  }
  if (options.date) {
    yPos += 10;
    doc.setFontSize(10);
    setColor(doc, COLORS.silver, "text");
    doc.text(options.date, pageW / 2, yPos, { align: "center" });
  }
  if (options.totalValue !== undefined) {
    yPos += 20;
    const priceBoxWidth = 140;
    const priceBoxX = (pageW - priceBoxWidth) / 2;
    setColor(doc, COLORS.gold, "draw");
    doc.setLineWidth(1);
    doc.roundedRect(priceBoxX, yPos - 8, priceBoxWidth, 24, 2, 2, "S");
    setColor(doc, COLORS.gold, "text");
    doc.setFontSize(22);
    setupFont(doc, "bold");
    doc.text(formatCurrency(options.totalValue), pageW / 2, yPos + 7, { align: "center" });
  }
}

function drawInfoList(doc: jsPDF, items: Array<{ label: string; value: string }>, startY: number, margin: number = 20, labelWidth: number = 60): number {
  let yPos = startY;
  doc.setFontSize(12);
  items.forEach((item) => {
    setupFont(doc, "bold");
    setColor(doc, COLORS.textMuted, "text");
    doc.text(item.label + ":", margin, yPos);
    setupFont(doc);
    setColor(doc, COLORS.textDark, "text");
    doc.text(item.value, margin + labelWidth, yPos);
    yPos += 12;
  });
  return yPos;
}

function drawFinancialSummary(doc: jsPDF, items: Array<{ label: string; value: number; highlight?: boolean; negative?: boolean }>, total: { label: string; value: number }, x: number, y: number, width: number): number {
  let yPos = y;
  const padding = 15;
  const itemHeight = 12;
  const separatorHeight = 15;
  const totalHeight = 20;
  const boxHeight = (items.length * itemHeight) + separatorHeight + totalHeight + (padding * 2);
  
  drawPremiumBox(doc, x, y, width, boxHeight, "info");
  yPos += padding;
  doc.setFontSize(12);
  
  items.forEach((item) => {
    setupFont(doc);
    setColor(doc, item.highlight ? COLORS.navy : COLORS.textDark, "text");
    doc.text(item.label, x + padding, yPos);
    setupFont(doc, "bold");
    if (item.negative) {
      setColor(doc, COLORS.success, "text");
      doc.text(`-${formatCurrency(item.value)}`, x + width - padding, yPos, { align: "right" });
    } else {
      doc.text(formatCurrency(item.value), x + width - padding, yPos, { align: "right" });
    }
    yPos += itemHeight;
  });
  
  yPos += 5;
  setColor(doc, COLORS.navy, "draw");
  doc.setLineWidth(0.5);
  doc.line(x + padding, yPos, x + width - padding, yPos);
  yPos += 10;
  
  doc.setFontSize(16);
  setColor(doc, COLORS.gold, "text");
  setupFont(doc, "bold");
  doc.text(total.label, x + padding, yPos);
  doc.text(formatCurrency(total.value), x + width - padding, yPos, { align: "right" });
  
  return y + boxHeight;
}

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
      let yPos = drawPageHeader(doc, "Informações do Contrato", pageW, margin);

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
      let yPos = drawPageHeader(doc, "ATOs Aprovadas", pageW, margin);

      approvedATOs.forEach((ato: any) => {
        if (yPos > 240) {
          doc.addPage();
          yPos = drawPageHeader(doc, "ATOs Aprovadas (cont.)", pageW, margin);
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
      let yPos = drawPageHeader(doc, "Totais Atualizados", pageW, margin);

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
