import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ===== COLOR PALETTES =====
type ColorDef = { r: number; g: number; b: number };

const CLEAN_COLORS = {
  black: { r: 30, g: 30, b: 35 },
  gray: { r: 100, g: 100, b: 105 },
  lightGray: { r: 180, g: 180, b: 180 },
  white: { r: 255, g: 255, b: 255 },
};

const PREMIUM_COLORS = {
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
};

// ===== UTILITY FUNCTIONS =====
function setupFont(doc: jsPDF, style: "normal" | "bold" | "italic" = "normal") {
  doc.setFont("helvetica", style);
}

function setColor(doc: jsPDF, color: ColorDef, type: "fill" | "text" | "draw" = "text") {
  if (type === "fill") doc.setFillColor(color.r, color.g, color.b);
  else if (type === "draw") doc.setDrawColor(color.r, color.g, color.b);
  else doc.setTextColor(color.r, color.g, color.b);
}

function formatCurrency(value: number): string {
  if (!value && value !== 0) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 }).format(value);
}

function formatDate(date: string): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(date));
}

function formatDateShort(date: string): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(date));
}

function formatNumber(value: number, decimals = 2): string {
  if (!value && value !== 0) return "0";
  return value.toLocaleString("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function dedupeBy<T>(arr: T[], keyFn: (x: T) => string): T[] {
  const map = new Map<string, T>();
  for (const item of arr) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, item);
  }
  return [...map.values()];
}

// ===== CLEAN STYLE RENDERER =====
const cleanRenderer = {
  drawHeader(doc: jsPDF, pageW: number, margin: number): number {
    let yPos = 20;
    doc.setFontSize(14);
    setupFont(doc, "bold");
    setColor(doc, CLEAN_COLORS.black);
    doc.text("OKEAN YACHTS", margin, yPos);
    yPos += 5;
    setColor(doc, CLEAN_COLORS.lightGray, "draw");
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageW - margin, yPos);
    return yPos + 10;
  },
  
  drawSectionTitle(doc: jsPDF, title: string, yPos: number, margin: number, pageW: number): number {
    doc.setFontSize(11);
    setupFont(doc, "bold");
    setColor(doc, CLEAN_COLORS.black);
    doc.text(title.toUpperCase(), margin, yPos);
    yPos += 2;
    setColor(doc, CLEAN_COLORS.lightGray, "draw");
    doc.setLineWidth(0.2);
    doc.line(margin, yPos, pageW - margin, yPos);
    return yPos + 8;
  },
  
  drawInfoRow(doc: jsPDF, label: string, value: string, yPos: number, margin: number, labelWidth = 55): number {
    doc.setFontSize(10);
    setupFont(doc, "bold");
    setColor(doc, CLEAN_COLORS.gray);
    doc.text(label + ":", margin, yPos);
    setupFont(doc, "normal");
    setColor(doc, CLEAN_COLORS.black);
    doc.text(value, margin + labelWidth, yPos);
    return yPos + 6;
  },
  
  drawDivider(doc: jsPDF, yPos: number, margin: number, pageW: number): number {
    setColor(doc, CLEAN_COLORS.lightGray, "draw");
    doc.setLineWidth(0.2);
    doc.line(margin, yPos, pageW - margin, yPos);
    return yPos + 8;
  },
  
  drawFooter(doc: jsPDF, pageNum: number, totalPages: number, pageW: number, pageH: number, documentRef: string, margin: number) {
    const footerY = pageH - 12;
    setColor(doc, CLEAN_COLORS.lightGray, "draw");
    doc.setLineWidth(0.2);
    doc.line(margin, footerY - 5, pageW - margin, footerY - 5);
    doc.setFontSize(8);
    setupFont(doc, "normal");
    setColor(doc, CLEAN_COLORS.gray);
    doc.text("OKEAN YACHTS", margin, footerY);
    doc.text(documentRef, pageW / 2, footerY, { align: "center" });
    doc.text(`${pageNum} / ${totalPages}`, pageW - margin, footerY, { align: "right" });
  }
};

// ===== CLEAN PDF GENERATOR =====
function generateCleanQuotationPDF(doc: jsPDF, quotation: any, memorialItems: any[]) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageW - (margin * 2);
  
  let yPos = cleanRenderer.drawHeader(doc, pageW, margin);
  
  // Document Title
  doc.setFontSize(16);
  setupFont(doc, "bold");
  setColor(doc, CLEAN_COLORS.black);
  doc.text("PROPOSTA COMERCIAL", margin, yPos);
  yPos += 6;
  doc.setFontSize(12);
  setupFont(doc, "normal");
  doc.text(quotation.quotation_number, margin, yPos);
  yPos += 10;
  yPos = cleanRenderer.drawDivider(doc, yPos, margin, pageW);
  
  // Client Info
  yPos = cleanRenderer.drawSectionTitle(doc, "Cliente", yPos, margin, pageW);
  yPos = cleanRenderer.drawInfoRow(doc, "Nome", quotation.clients?.name || quotation.client_name || "N/A", yPos, margin);
  if (quotation.clients?.email || quotation.client_email) {
    yPos = cleanRenderer.drawInfoRow(doc, "Email", quotation.clients?.email || quotation.client_email, yPos, margin);
  }
  if (quotation.clients?.phone || quotation.client_phone) {
    yPos = cleanRenderer.drawInfoRow(doc, "Telefone", quotation.clients?.phone || quotation.client_phone, yPos, margin);
  }
  yPos += 4;
  yPos = cleanRenderer.drawDivider(doc, yPos, margin, pageW);
  
  // Yacht Model
  yPos = cleanRenderer.drawSectionTitle(doc, "Embarcação", yPos, margin, pageW);
  yPos = cleanRenderer.drawInfoRow(doc, "Modelo", quotation.yacht_models?.name || "N/A", yPos, margin);
  if (quotation.yacht_models?.code) {
    yPos = cleanRenderer.drawInfoRow(doc, "Código", quotation.yacht_models.code, yPos, margin);
  }
  yPos = cleanRenderer.drawInfoRow(doc, "Prazo de Entrega", `${quotation.total_delivery_days || quotation.base_delivery_days} dias`, yPos, margin);
  yPos += 4;
  yPos = cleanRenderer.drawDivider(doc, yPos, margin, pageW);
  
  // Technical Specs (if available)
  const model = quotation.yacht_models;
  if (model) {
    const specs: Array<{label: string, value: string}> = [];
    if (model.length_overall) specs.push({ label: "Comprimento", value: `${formatNumber(model.length_overall)} m` });
    if (model.beam) specs.push({ label: "Boca", value: `${formatNumber(model.beam)} m` });
    if (model.cabins) specs.push({ label: "Cabines", value: `${model.cabins}` });
    if (model.bathrooms) specs.push({ label: "Banheiros", value: `${model.bathrooms}` });
    if (model.max_speed) specs.push({ label: "Velocidade Máx.", value: `${formatNumber(model.max_speed, 0)} nós` });
    if (model.engines) specs.push({ label: "Motorização", value: model.engines });
    
    if (specs.length > 0) {
      yPos = cleanRenderer.drawSectionTitle(doc, "Especificações Técnicas", yPos, margin, pageW);
      specs.forEach(spec => {
        yPos = cleanRenderer.drawInfoRow(doc, spec.label, spec.value, yPos, margin);
      });
      yPos += 4;
      yPos = cleanRenderer.drawDivider(doc, yPos, margin, pageW);
    }
  }
  
  // Check if need new page for financial section
  if (yPos > pageH - 80) {
    doc.addPage();
    yPos = cleanRenderer.drawHeader(doc, pageW, margin);
  }
  
  // Financial Summary
  yPos = cleanRenderer.drawSectionTitle(doc, "Resumo Financeiro", yPos, margin, pageW);
  yPos = cleanRenderer.drawInfoRow(doc, "Valor Base", formatCurrency(quotation.base_price), yPos, margin);
  
  if (quotation.base_discount_percentage && quotation.base_discount_percentage > 0) {
    const discountValue = quotation.base_price - quotation.final_base_price;
    yPos = cleanRenderer.drawInfoRow(doc, `Desconto (${formatNumber(quotation.base_discount_percentage)}%)`, `- ${formatCurrency(discountValue)}`, yPos, margin);
  }
  
  // Options
  if (quotation.quotation_options?.length > 0) {
    yPos += 4;
    yPos = cleanRenderer.drawInfoRow(doc, "Opcionais", `${quotation.quotation_options.length} item(ns)`, yPos, margin);
    yPos = cleanRenderer.drawInfoRow(doc, "Valor Opcionais", formatCurrency(quotation.total_options_price || 0), yPos, margin);
    
    if (quotation.options_discount_percentage && quotation.options_discount_percentage > 0) {
      const optDiscountValue = (quotation.total_options_price || 0) - (quotation.final_options_price || 0);
      yPos = cleanRenderer.drawInfoRow(doc, `Desconto (${formatNumber(quotation.options_discount_percentage)}%)`, `- ${formatCurrency(optDiscountValue)}`, yPos, margin);
    }
  }
  
  // Upgrades
  if (quotation.quotation_upgrades?.length > 0) {
    const upgradesTotal = quotation.quotation_upgrades.reduce((sum: number, u: any) => sum + (u.price || 0), 0);
    yPos += 4;
    yPos = cleanRenderer.drawInfoRow(doc, "Upgrades", `${quotation.quotation_upgrades.length} item(ns)`, yPos, margin);
    yPos = cleanRenderer.drawInfoRow(doc, "Valor Upgrades", formatCurrency(upgradesTotal), yPos, margin);
  }
  
  // Total
  yPos += 6;
  yPos = cleanRenderer.drawDivider(doc, yPos, margin, pageW);
  doc.setFontSize(12);
  setupFont(doc, "bold");
  setColor(doc, CLEAN_COLORS.black);
  doc.text("VALOR TOTAL:", margin, yPos);
  doc.text(formatCurrency(quotation.final_price), pageW - margin, yPos, { align: "right" });
  yPos += 10;
  
  // Validity
  doc.setFontSize(9);
  setupFont(doc, "italic");
  setColor(doc, CLEAN_COLORS.gray);
  doc.text(`Proposta válida até ${formatDate(quotation.valid_until)}`, margin, yPos);
  yPos += 10;
  
  // Options Details (new page if needed)
  if (quotation.quotation_options?.length > 0) {
    doc.addPage();
    yPos = cleanRenderer.drawHeader(doc, pageW, margin);
    yPos = cleanRenderer.drawSectionTitle(doc, "Opcionais Selecionados", yPos, margin, pageW);
    
    quotation.quotation_options.forEach((qo: any) => {
      if (yPos > pageH - 30) {
        doc.addPage();
        yPos = cleanRenderer.drawHeader(doc, pageW, margin);
        yPos = cleanRenderer.drawSectionTitle(doc, "Opcionais (continuação)", yPos, margin, pageW);
      }
      
      const optName = qo.options?.name || "Item";
      const optCode = qo.options?.code || "";
      
      doc.setFontSize(10);
      setupFont(doc, "normal");
      setColor(doc, CLEAN_COLORS.black);
      doc.text(`• ${optName}${optCode ? ` (${optCode})` : ""}`, margin, yPos);
      
      const priceText = qo.quantity > 1 
        ? `${qo.quantity}x ${formatCurrency(qo.unit_price)} = ${formatCurrency(qo.total_price)}`
        : formatCurrency(qo.total_price);
      doc.text(priceText, pageW - margin, yPos, { align: "right" });
      yPos += 6;
    });
    yPos += 4;
  }
  
  // Memorial Descritivo (new page)
  if (memorialItems?.length > 0) {
    doc.addPage();
    yPos = cleanRenderer.drawHeader(doc, pageW, margin);
    yPos = cleanRenderer.drawSectionTitle(doc, "Memorial Descritivo", yPos, margin, pageW);
    
    let currentCategory = "";
    
    memorialItems.forEach((item: any) => {
      if (yPos > pageH - 25) {
        doc.addPage();
        yPos = cleanRenderer.drawHeader(doc, pageW, margin);
        yPos = cleanRenderer.drawSectionTitle(doc, "Memorial (continuação)", yPos, margin, pageW);
      }
      
      const category = item.memorial_categories?.label || "Outros";
      
      if (category !== currentCategory) {
        yPos += 3;
        doc.setFontSize(9);
        setupFont(doc, "bold");
        setColor(doc, CLEAN_COLORS.black);
        doc.text(category.toUpperCase(), margin, yPos);
        yPos += 5;
        currentCategory = category;
      }
      
      doc.setFontSize(9);
      setupFont(doc, "normal");
      setColor(doc, CLEAN_COLORS.gray);
      
      const details: string[] = [];
      if (item.brand) details.push(item.brand);
      if (item.model) details.push(item.model);
      
      const itemText = `• ${item.item_name}${details.length > 0 ? ` (${details.join(", ")})` : ""}`;
      const lines = doc.splitTextToSize(itemText, contentWidth);
      doc.text(lines[0], margin + 5, yPos);
      yPos += 5;
    });
  }
  
  // Add footers
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    cleanRenderer.drawFooter(doc, i, totalPages, pageW, pageH, quotation.quotation_number, margin);
  }
  
  // Draft watermark
  if (quotation.status === "draft") {
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(72);
      setupFont(doc, "bold");
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.10 }));
      doc.text("RASCUNHO", pageW / 2, pageH / 2, { angle: 45, align: "center" });
      doc.restoreGraphicsState();
    }
  }
}

// ===== PREMIUM PDF GENERATOR (existing logic, simplified) =====
async function generatePremiumQuotationPDF(doc: jsPDF, quotation: any, memorialItems: any[], supabase: any) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageW - (margin * 2);

  // Helper functions
  function drawGradientBackground(yStart = 0, yEnd = pageH) {
    const steps = 50;
    const stepHeight = (yEnd - yStart) / steps;
    for (let i = 0; i < steps; i++) {
      const ratio = i / steps;
      const r = Math.round(PREMIUM_COLORS.navy.r + (PREMIUM_COLORS.navyDark.r - PREMIUM_COLORS.navy.r) * ratio);
      const g = Math.round(PREMIUM_COLORS.navy.g + (PREMIUM_COLORS.navyDark.g - PREMIUM_COLORS.navy.g) * ratio);
      const b = Math.round(PREMIUM_COLORS.navy.b + (PREMIUM_COLORS.navyDark.b - PREMIUM_COLORS.navy.b) * ratio);
      doc.setFillColor(r, g, b);
      doc.rect(0, yStart + (i * stepHeight), pageW, stepHeight + 1, "F");
    }
  }

  function drawGoldDivider(y: number, width: number = contentWidth, centered = true) {
    const x = centered ? (pageW - width) / 2 : margin;
    setColor(doc, PREMIUM_COLORS.gold, "draw");
    doc.setLineWidth(0.8);
    doc.line(x, y, x + width, y);
  }

  function drawPremiumBox(x: number, y: number, w: number, h: number, style: "light" | "dark" | "gold" = "light") {
    if (style === "dark") setColor(doc, PREMIUM_COLORS.navy, "fill");
    else if (style === "gold") setColor(doc, PREMIUM_COLORS.gold, "fill");
    else setColor(doc, PREMIUM_COLORS.champagne, "fill");
    doc.roundedRect(x, y, w, h, 3, 3, "F");
    setColor(doc, PREMIUM_COLORS.platinum, "draw");
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, 3, 3, "S");
  }

  function drawPageHeader(title: string): number {
    setColor(doc, PREMIUM_COLORS.navy, "fill");
    doc.rect(0, 0, pageW, 45, "F");
    setColor(doc, PREMIUM_COLORS.gold, "fill");
    doc.rect(0, 43, pageW, 2, "F");
    setColor(doc, PREMIUM_COLORS.textLight);
    doc.setFontSize(10);
    setupFont(doc, "bold");
    doc.text("OKEAN YACHTS", margin, 18);
    setColor(doc, PREMIUM_COLORS.gold);
    doc.setFontSize(18);
    setupFont(doc, "bold");
    doc.text(title, margin, 32);
    return 55;
  }

  function drawPageFooter(pageNum: number, totalPages: number) {
    const footerY = pageH - 15;
    setColor(doc, PREMIUM_COLORS.platinum, "draw");
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 5, pageW - margin, footerY - 5);
    setColor(doc, PREMIUM_COLORS.textMuted);
    doc.setFontSize(8);
    setupFont(doc);
    doc.text("OKEAN YACHTS", margin, footerY);
    doc.text(`Proposta ${quotation.quotation_number}`, pageW / 2, footerY, { align: "center" });
    doc.text(`${pageNum} / ${totalPages}`, pageW - margin, footerY, { align: "right" });
  }

  function addDraftWatermark() {
    if (quotation.status !== "draft") return;
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(72);
    setupFont(doc, "bold");
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.10 }));
    doc.text("RASCUNHO", pageW / 2, pageH / 2, { angle: 45, align: "center" });
    doc.restoreGraphicsState();
  }

  // Page 1: Cover
  drawGradientBackground();
  
  let yPos = 50;
  setColor(doc, PREMIUM_COLORS.textLight);
  doc.setFontSize(14);
  setupFont(doc);
  doc.setCharSpace(8);
  doc.text("OKEAN YACHTS", pageW / 2, yPos, { align: "center" });
  doc.setCharSpace(0);
  
  yPos += 15;
  setColor(doc, PREMIUM_COLORS.gold, "draw");
  doc.setLineWidth(0.8);
  doc.line(pageW / 2 - 40, yPos, pageW / 2 + 40, yPos);
  
  yPos = pageH / 2 - 30;
  setColor(doc, PREMIUM_COLORS.textLight);
  doc.setFontSize(38);
  setupFont(doc, "bold");
  doc.text((quotation.yacht_models?.name || "Modelo").toUpperCase(), pageW / 2, yPos, { align: "center" });
  
  yPos = pageH - 100;
  setColor(doc, PREMIUM_COLORS.goldLight);
  doc.setFontSize(10);
  setupFont(doc);
  doc.setCharSpace(3);
  doc.text("PROPOSTA COMERCIAL", pageW / 2, yPos, { align: "center" });
  doc.setCharSpace(0);
  
  yPos += 12;
  setColor(doc, PREMIUM_COLORS.textLight);
  doc.setFontSize(20);
  setupFont(doc, "bold");
  doc.text(`Nº ${quotation.quotation_number}`, pageW / 2, yPos, { align: "center" });
  
  yPos += 15;
  doc.setFontSize(12);
  setupFont(doc);
  doc.text(`Preparada para: ${quotation.clients?.name || quotation.client_name || "Cliente"}`, pageW / 2, yPos, { align: "center" });
  
  yPos += 20;
  const priceBoxWidth = 140;
  const priceBoxX = (pageW - priceBoxWidth) / 2;
  setColor(doc, PREMIUM_COLORS.gold, "draw");
  doc.setLineWidth(1);
  doc.roundedRect(priceBoxX, yPos - 8, priceBoxWidth, 24, 2, 2, "S");
  setColor(doc, PREMIUM_COLORS.gold);
  doc.setFontSize(22);
  setupFont(doc, "bold");
  doc.text(formatCurrency(quotation.final_price), pageW / 2, yPos + 7, { align: "center" });
  
  addDraftWatermark();

  // Page 2: Financial Summary
  doc.addPage();
  let startY = drawPageHeader("Resumo Financeiro");
  yPos = startY + 5;
  
  drawPremiumBox(margin, yPos, contentWidth, 50);
  setColor(doc, PREMIUM_COLORS.navy);
  doc.setFontSize(11);
  setupFont(doc, "bold");
  doc.text("EMBARCAÇÃO BASE", margin + 10, yPos + 12);
  setColor(doc, PREMIUM_COLORS.textMuted);
  doc.setFontSize(9);
  setupFont(doc);
  doc.text(quotation.yacht_models?.name || "Modelo", margin + 10, yPos + 22);
  setColor(doc, PREMIUM_COLORS.textDark);
  doc.setFontSize(10);
  doc.text("Valor Base:", margin + 10, yPos + 35);
  doc.text(formatCurrency(quotation.base_price), margin + contentWidth - 10, yPos + 35, { align: "right" });
  
  yPos += 60;
  
  // Options
  if (quotation.quotation_options?.length > 0) {
    drawPremiumBox(margin, yPos, contentWidth, 40);
    setColor(doc, PREMIUM_COLORS.navy);
    doc.setFontSize(11);
    setupFont(doc, "bold");
    doc.text("OPCIONAIS", margin + 10, yPos + 12);
    setColor(doc, PREMIUM_COLORS.textMuted);
    doc.setFontSize(9);
    setupFont(doc);
    doc.text(`${quotation.quotation_options.length} item(ns)`, margin + 10, yPos + 22);
    setColor(doc, PREMIUM_COLORS.textDark);
    doc.setFontSize(10);
    doc.text(formatCurrency(quotation.total_options_price || 0), margin + contentWidth - 10, yPos + 28, { align: "right" });
    yPos += 50;
  }
  
  // Total box
  yPos += 10;
  setColor(doc, PREMIUM_COLORS.navy, "fill");
  doc.roundedRect(margin, yPos, contentWidth, 45, 4, 4, "F");
  setColor(doc, PREMIUM_COLORS.gold, "draw");
  doc.setLineWidth(2);
  doc.roundedRect(margin, yPos, contentWidth, 45, 4, 4, "S");
  setColor(doc, PREMIUM_COLORS.goldLight);
  doc.setFontSize(11);
  setupFont(doc);
  doc.text("VALOR TOTAL DA PROPOSTA", margin + 15, yPos + 15);
  setColor(doc, PREMIUM_COLORS.gold);
  doc.setFontSize(24);
  setupFont(doc, "bold");
  doc.text(formatCurrency(quotation.final_price), margin + 15, yPos + 35);
  
  yPos += 55;
  setColor(doc, PREMIUM_COLORS.textMuted);
  doc.setFontSize(9);
  setupFont(doc, "italic");
  doc.text(`Proposta válida até ${formatDate(quotation.valid_until)}`, pageW / 2, yPos, { align: "center" });
  
  addDraftWatermark();
  
  // Add footers
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    if (i > 1) drawPageFooter(i, totalPages);
  }
}

// ===== MAIN SERVER =====
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== Generate Quotation PDF Started ===");
    
    const { quotationId } = await req.json();
    if (!quotationId) throw new Error("quotationId is required");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch quotation
    const { data: quotation, error: fetchError } = await supabase
      .from("quotations")
      .select(`
        *,
        yacht_models (*),
        clients (*),
        users!quotations_sales_representative_id_fkey (id, full_name, email, department),
        quotation_options (*, options (id, code, name, description, base_price, category_id, memorial_categories:category_id (label))),
        quotation_customizations (*),
        quotation_upgrades (*, memorial_upgrades (id, name, code, price), memorial_items (item_name, memorial_categories (label)))
      `)
      .eq("id", quotationId)
      .single();

    if (fetchError || !quotation) throw new Error("Quotation not found: " + fetchError?.message);
    console.log("Quotation found:", quotation.quotation_number);

    // Fetch memorial items
    const { data: memorialItems } = await supabase
      .from("memorial_items")
      .select(`*, memorial_categories!inner (id, label, icon, display_order)`)
      .eq("yacht_model_id", quotation.yacht_model_id)
      .eq("is_active", true)
      .order("category_display_order")
      .order("display_order");

    const memorialClean = memorialItems ? dedupeBy(memorialItems, (item: any) =>
      `${item.memorial_categories?.label || 'Outros'}|${item.item_name}|${item.brand || ''}|${item.model || ''}`
    ) : [];
    
    memorialClean.sort((a: any, b: any) => {
      const catOrder = (a.memorial_categories?.display_order ?? 999) - (b.memorial_categories?.display_order ?? 999);
      if (catOrder !== 0) return catOrder;
      return (a.display_order ?? 999) - (b.display_order ?? 999);
    });

    // Fetch active template
    const { data: template } = await supabase
      .from("pdf_templates")
      .select("*")
      .eq("document_type", "quotation")
      .eq("status", "active")
      .eq("is_default", true)
      .single();

    const pdfStyle = (template?.template_json as any)?.settings?.style || 'clean';
    console.log(`Using style: ${pdfStyle} (template: ${template?.name || 'default'})`);

    // Create PDF
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    
    if (pdfStyle === 'premium') {
      await generatePremiumQuotationPDF(doc, quotation, memorialClean, supabase);
    } else {
      generateCleanQuotationPDF(doc, quotation, memorialClean);
    }

    // Upload PDF
    const pdfData = doc.output("arraybuffer");
    const fileName = `quotation-${quotation.quotation_number}-${Date.now()}.pdf`;
    
    const { error: uploadError } = await supabase.storage
      .from("quotation-pdfs")
      .upload(`${quotation.id}/${fileName}`, new Uint8Array(pdfData), {
        contentType: "application/pdf",
        upsert: true
      });

    if (uploadError) throw uploadError;
    console.log(`✓ Quotation PDF generated (style: ${pdfStyle})`);

    return new Response(
      JSON.stringify({ success: true, fileName }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Error generating PDF:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
