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

interface ATOPDFRequest {
  ato_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== Generate Premium ATO PDF Started ===");

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

    const { ato_id }: ATOPDFRequest = await req.json();
    if (!ato_id) throw new Error("ato_id is required");

    const { data: ato, error: atoError } = await supabase
      .from("additional_to_orders")
      .select(`
        *,
        contract:contracts(
          *,
          client:clients(*),
          yacht_model:yacht_models(*)
        )
      `)
      .eq("id", ato_id)
      .single();

    if (atoError || !ato) throw new Error("ATO not found");

    const { data: configurations } = await supabase
      .from("ato_configurations")
      .select("*")
      .eq("ato_id", ato_id);

    console.log("ATO found:", ato.ato_number);

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    setupFont(doc);

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageW - (margin * 2);

    // ===== CAPA PREMIUM =====
    function addCoverPage() {
      let badgeText = "Pendente";
      let badgeStatus: "approved" | "pending" | "rejected" = "pending";
      
      if (ato.status === "approved") {
        badgeText = "Aprovado";
        badgeStatus = "approved";
      } else if (ato.status === "rejected") {
        badgeText = "Rejeitado";
        badgeStatus = "rejected";
      }

      drawPremiumCover(doc, pageW, pageH, {
        title: "Aditivo ao Contrato",
        subtitle: ato.title,
        documentNumber: ato.ato_number,
        clientName: ato.contract?.client?.name,
        modelName: ato.contract?.yacht_model?.name,
        totalValue: ato.price_impact ? (ato.price_impact * (1 - (ato.discount_percentage || 0) / 100)) : undefined,
        date: formatDate(ato.requested_at || ato.created_at),
        badgeText: badgeText,
        badgeStatus: badgeStatus,
      });

      let yPos = pageH - 30;
      setColor(doc, COLORS.textMuted, "text");
      doc.setFontSize(9);
      setupFont(doc);
      doc.text(`Ref. Contrato: ${ato.contract?.contract_number || "N/A"}`, pageW / 2, yPos, { align: "center" });
    }

    // ===== INFORMAÇÕES DA ATO =====
    function addATOInfoPage() {
      doc.addPage();
      let yPos = drawPageHeader(doc, "Informações do Aditivo", pageW, margin);

      drawPremiumBox(doc, margin, yPos, contentWidth, 50, "light");
      
      yPos += 15;
      const infoItems = [
        { label: "Número da ATO", value: ato.ato_number },
        { label: "Data de Solicitação", value: formatDateShort(ato.requested_at || ato.created_at) },
        { label: "Status", value: ato.status === "approved" ? "Aprovado" : ato.status === "rejected" ? "Rejeitado" : "Pendente" },
      ];

      if (ato.approved_at) {
        infoItems.push({ label: "Data de Aprovação", value: formatDateShort(ato.approved_at) });
      }

      yPos = drawInfoList(doc, infoItems, yPos, margin + 10, 55);

      yPos += 20;
      doc.setFontSize(14);
      setupFont(doc, "bold");
      setColor(doc, COLORS.navy, "text");
      doc.text("Referência ao Contrato", margin, yPos);
      
      yPos += 5;
      drawGoldLine(doc, yPos, margin, margin + 80);
      
      yPos += 15;
      drawPremiumBox(doc, margin, yPos, contentWidth, 40, "info");
      
      yPos += 12;
      const contractInfo = [
        { label: "Contrato", value: ato.contract?.contract_number || "N/A" },
        { label: "Cliente", value: ato.contract?.client?.name || "N/A" },
        { label: "Modelo", value: ato.contract?.yacht_model?.name || "N/A" },
      ];
      drawInfoList(doc, contractInfo, yPos, margin + 10, 45);

      yPos += 55;
      doc.setFontSize(14);
      setupFont(doc, "bold");
      setColor(doc, COLORS.navy, "text");
      doc.text("Descrição do Aditivo", margin, yPos);
      
      yPos += 5;
      drawGoldLine(doc, yPos, margin, margin + 70);

      yPos += 15;
      doc.setFontSize(16);
      setupFont(doc, "bold");
      setColor(doc, COLORS.textDark, "text");
      doc.text(ato.title, margin, yPos);

      if (ato.description) {
        yPos += 10;
        doc.setFontSize(11);
        setupFont(doc);
        setColor(doc, COLORS.textMuted, "text");
        const lines = doc.splitTextToSize(ato.description, contentWidth);
        lines.forEach((line: string) => {
          doc.text(line, margin, yPos);
          yPos += 6;
        });
      }

      if (ato.notes) {
        yPos += 10;
        drawPremiumBox(doc, margin, yPos, contentWidth, 30, "light");
        yPos += 10;
        doc.setFontSize(9);
        setupFont(doc, "italic");
        setColor(doc, COLORS.textMuted, "text");
        const notesLines = doc.splitTextToSize(`Observações: ${ato.notes}`, contentWidth - 20);
        notesLines.forEach((line: string) => {
          doc.text(line, margin + 10, yPos);
          yPos += 5;
        });
      }
    }

    // ===== CONFIGURAÇÕES =====
    function addConfigurationsPage() {
      if (!configurations || configurations.length === 0) return;

      doc.addPage();
      let yPos = drawPageHeader(doc, "Itens Configurados", pageW, margin);

      configurations.forEach((config: any) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = drawPageHeader(doc, "Itens Configurados (cont.)", pageW, margin);
        }

        let typeName = "ITEM";
        let typeColor = COLORS.navy;
        
        if (config.item_type === "option") {
          typeName = "OPCIONAL";
          typeColor = COLORS.gold;
        } else if (config.item_type === "memorial") {
          typeName = "MEMORIAL";
          typeColor = COLORS.info;
        } else if (config.item_type === "customization") {
          typeName = "CUSTOMIZAÇÃO";
          typeColor = COLORS.success;
        } else if (config.item_type === "upgrade") {
          typeName = "UPGRADE";
          typeColor = COLORS.warning;
        }

        const cardHeight = config.sub_items ? 45 : 35;
        drawPremiumBox(doc, margin, yPos, contentWidth, cardHeight, "light");

        yPos += 8;
        setColor(doc, typeColor, "fill");
        doc.roundedRect(margin + 5, yPos - 5, 28, 7, 2, 2, "F");
        setColor(doc, COLORS.white, "text");
        doc.setFontSize(7);
        setupFont(doc, "bold");
        doc.text(typeName, margin + 19, yPos, { align: "center" });

        yPos += 10;
        doc.setFontSize(11);
        setupFont(doc, "bold");
        setColor(doc, COLORS.textDark, "text");
        const itemName = config.configuration_details?.name || 
                        config.configuration_details?.item_name || 
                        "Item não especificado";
        doc.text(itemName, margin + 5, yPos);

        if (config.calculated_price) {
          doc.setFontSize(11);
          setupFont(doc, "bold");
          setColor(doc, COLORS.navy, "text");
          doc.text(formatCurrency(config.calculated_price), pageW - margin - 5, yPos, { align: "right" });
        }

        if (config.sub_items) {
          try {
            const subItems = typeof config.sub_items === 'string' 
              ? JSON.parse(config.sub_items) 
              : config.sub_items;
            
            if (Array.isArray(subItems) && subItems.length > 0) {
              yPos += 8;
              doc.setFontSize(8);
              setupFont(doc);
              setColor(doc, COLORS.textMuted, "text");
              
              const subItemsText = subItems.slice(0, 3).map((sub: any) => {
                const label = sub.label || sub.name || "";
                const value = sub.value || sub.selectedValue || "";
                return `${label}: ${value}`;
              }).join(" • ");
              
              doc.text(subItemsText, margin + 5, yPos);
            }
          } catch (e) {
            console.error("Error parsing sub_items:", e);
          }
        }

        if (config.delivery_impact_days) {
          yPos += 8;
          doc.setFontSize(8);
          setupFont(doc);
          setColor(doc, COLORS.warning, "text");
          doc.text(`+${config.delivery_impact_days} dias no prazo`, margin + 5, yPos);
        }

        yPos += cardHeight - 20;
      });
    }

    // ===== IMPACTO FINANCEIRO =====
    function addFinancialImpactPage() {
      doc.addPage();
      let yPos = drawPageHeader(doc, "Impacto Financeiro", pageW, margin);

      const financialItems: Array<{ label: string; value: number; highlight?: boolean; negative?: boolean }> = [];
      
      if (ato.original_price_impact || ato.price_impact) {
        financialItems.push({
          label: "Valor Base da ATO",
          value: ato.original_price_impact || ato.price_impact || 0
        });
      }

      if (ato.discount_percentage && ato.discount_percentage > 0) {
        const discountAmount = (ato.original_price_impact || ato.price_impact || 0) * (ato.discount_percentage / 100);
        financialItems.push({
          label: `Desconto (${ato.discount_percentage}%)`,
          value: discountAmount,
          negative: true
        });
      }

      const finalPrice = (ato.price_impact || 0);
      
      if (financialItems.length > 0) {
        yPos = drawFinancialSummary(
          doc,
          financialItems,
          { label: "VALOR FINAL DA ATO", value: finalPrice },
          margin,
          yPos,
          contentWidth
        );
      } else {
        drawPremiumBox(doc, margin, yPos, contentWidth, 40, "info");
        yPos += 25;
        doc.setFontSize(12);
        setupFont(doc);
        setColor(doc, COLORS.textMuted, "text");
        doc.text("Sem impacto financeiro", pageW / 2, yPos, { align: "center" });
        yPos += 40;
      }

      yPos += 20;
      doc.setFontSize(14);
      setupFont(doc, "bold");
      setColor(doc, COLORS.navy, "text");
      doc.text("Impacto no Prazo de Entrega", margin, yPos);
      
      yPos += 5;
      drawGoldLine(doc, yPos, margin, margin + 90);

      yPos += 15;
      if (ato.delivery_days_impact && ato.delivery_days_impact > 0) {
        drawPremiumBox(doc, margin, yPos, contentWidth, 35, "warning");
        
        yPos += 15;
        doc.setFontSize(12);
        setupFont(doc);
        setColor(doc, COLORS.textDark, "text");
        doc.text("Dias adicionais:", margin + 15, yPos);
        
        doc.setFontSize(18);
        setupFont(doc, "bold");
        setColor(doc, COLORS.warning, "text");
        doc.text(`+${ato.delivery_days_impact} dias`, pageW - margin - 15, yPos, { align: "right" });
      } else {
        drawPremiumBox(doc, margin, yPos, contentWidth, 30, "success");
        
        yPos += 18;
        doc.setFontSize(12);
        setupFont(doc);
        setColor(doc, COLORS.success, "text");
        doc.text("✓ Sem impacto no prazo de entrega", pageW / 2, yPos, { align: "center" });
      }

      if (ato.status === "approved" && ato.approved_at) {
        yPos += 50;
        doc.setFontSize(14);
        setupFont(doc, "bold");
        setColor(doc, COLORS.navy, "text");
        doc.text("Timeline de Aprovação", margin, yPos);
        
        yPos += 5;
        drawGoldLine(doc, yPos, margin, margin + 80);

        yPos += 20;
        
        setColor(doc, COLORS.info, "fill");
        doc.circle(margin + 10, yPos, 5, "F");
        setColor(doc, COLORS.info, "draw");
        doc.setLineWidth(0.5);
        doc.line(margin + 10, yPos + 5, margin + 10, yPos + 25);
        
        doc.setFontSize(10);
        setupFont(doc, "bold");
        setColor(doc, COLORS.textDark, "text");
        doc.text("Solicitação", margin + 20, yPos - 2);
        doc.setFontSize(9);
        setupFont(doc);
        setColor(doc, COLORS.textMuted, "text");
        doc.text(formatDateShort(ato.requested_at || ato.created_at), margin + 20, yPos + 6);

        yPos += 30;
        
        setColor(doc, COLORS.success, "fill");
        doc.circle(margin + 10, yPos, 5, "F");
        
        doc.setFontSize(10);
        setupFont(doc, "bold");
        setColor(doc, COLORS.textDark, "text");
        doc.text("Aprovado", margin + 20, yPos - 2);
        doc.setFontSize(9);
        setupFont(doc);
        setColor(doc, COLORS.textMuted, "text");
        doc.text(formatDateShort(ato.approved_at), margin + 20, yPos + 6);
      }
    }

    // Build PDF
    addCoverPage();
    addATOInfoPage();
    addConfigurationsPage();
    addFinancialImpactPage();
    addFootersToAllPages(doc, pageW, pageH, `ATO ${ato.ato_number}`, margin);

    const pdfData = doc.output("arraybuffer");
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfData)));

    console.log("✓ Premium ATO PDF generated successfully");

    return new Response(
      JSON.stringify({
        success: true,
        format: "pdf",
        data: base64Pdf,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error generating ATO PDF:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
