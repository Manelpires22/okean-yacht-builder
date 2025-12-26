import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ===== FORMATADORES =====
function formatCurrency(value: number): string {
  if (!value && value !== 0) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDateShort(date: string): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function formatDateLong(date: string): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

// ===== CORES =====
const COLORS = {
  navy: { r: 12, g: 35, b: 64 },
  navyDark: { r: 8, g: 24, b: 48 },
  gold: { r: 197, g: 162, b: 99 },
  goldLight: { r: 218, g: 190, b: 140 },
  white: { r: 255, g: 255, b: 255 },
  textDark: { r: 30, g: 30, b: 35 },
  textMuted: { r: 100, g: 100, b: 105 },
  lightGray: { r: 240, g: 240, b: 240 },
  border: { r: 200, g: 200, b: 200 },
};

type ColorDef = { r: number; g: number; b: number };

function setColor(doc: jsPDF, color: ColorDef, type: "fill" | "text" | "draw" = "text") {
  if (type === "fill") doc.setFillColor(color.r, color.g, color.b);
  else if (type === "draw") doc.setDrawColor(color.r, color.g, color.b);
  else doc.setTextColor(color.r, color.g, color.b);
}

function setupFont(doc: jsPDF, style: "normal" | "bold" | "italic" = "normal") {
  doc.setFont("helvetica", style);
}

// ===== COMPONENTES DE LAYOUT =====

function drawPageHeader(doc: jsPDF, title: string, subtitle: string, pageW: number, margin: number): number {
  // Header background
  setColor(doc, COLORS.navy, "fill");
  doc.rect(0, 0, pageW, 40, "F");
  
  // Gold accent line
  setColor(doc, COLORS.gold, "fill");
  doc.rect(0, 38, pageW, 2, "F");
  
  // Company name
  setColor(doc, COLORS.white);
  doc.setFontSize(10);
  setupFont(doc, "bold");
  doc.text("OKEAN YACHTS", margin, 15);
  
  // Document title
  setColor(doc, COLORS.gold);
  doc.setFontSize(14);
  setupFont(doc, "bold");
  doc.text(title, margin, 28);
  
  // Subtitle
  if (subtitle) {
    setColor(doc, COLORS.white);
    doc.setFontSize(9);
    setupFont(doc, "normal");
    doc.text(subtitle, pageW - margin, 28, { align: "right" });
  }
  
  return 50;
}

function drawSectionTitle(doc: jsPDF, title: string, yPos: number, margin: number, pageW: number): number {
  setColor(doc, COLORS.navy);
  doc.setFontSize(11);
  setupFont(doc, "bold");
  doc.text(title.toUpperCase(), margin, yPos);
  
  yPos += 2;
  setColor(doc, COLORS.gold, "draw");
  doc.setLineWidth(0.8);
  doc.line(margin, yPos, margin + 50, yPos);
  
  return yPos + 10;
}

function drawInfoRow(doc: jsPDF, label: string, value: string, yPos: number, margin: number, pageW: number, labelWidth: number = 60): number {
  doc.setFontSize(10);
  setupFont(doc, "bold");
  setColor(doc, COLORS.textMuted);
  doc.text(label + ":", margin, yPos);
  
  setupFont(doc, "normal");
  setColor(doc, COLORS.textDark);
  doc.text(value || "-", margin + labelWidth, yPos);
  
  return yPos + 6;
}

function drawPriceRow(doc: jsPDF, description: string, price: number, yPos: number, margin: number, pageW: number, options?: { isTotal?: boolean; isNegative?: boolean; isSubItem?: boolean }): number {
  const contentWidth = pageW - margin * 2;
  const priceX = pageW - margin;
  
  if (options?.isTotal) {
    // Total row with highlight
    setColor(doc, COLORS.lightGray, "fill");
    doc.rect(margin - 2, yPos - 5, contentWidth + 4, 10, "F");
    
    doc.setFontSize(11);
    setupFont(doc, "bold");
    setColor(doc, COLORS.navy);
    doc.text(description, margin, yPos);
    
    setColor(doc, COLORS.navy);
    doc.text(formatCurrency(price), priceX, yPos, { align: "right" });
  } else {
    doc.setFontSize(10);
    setupFont(doc, options?.isSubItem ? "italic" : "normal");
    setColor(doc, options?.isSubItem ? COLORS.textMuted : COLORS.textDark);
    
    const textX = options?.isSubItem ? margin + 5 : margin;
    doc.text(description, textX, yPos);
    
    if (options?.isNegative) {
      setColor(doc, { r: 34, g: 140, b: 90 }); // Green for credits/discounts
      doc.text(`-${formatCurrency(Math.abs(price))}`, priceX, yPos, { align: "right" });
    } else {
      setColor(doc, COLORS.textDark);
      doc.text(formatCurrency(price), priceX, yPos, { align: "right" });
    }
  }
  
  return yPos + (options?.isTotal ? 10 : 7);
}

function drawDivider(doc: jsPDF, yPos: number, margin: number, pageW: number): number {
  setColor(doc, COLORS.border, "draw");
  doc.setLineWidth(0.3);
  doc.line(margin, yPos, pageW - margin, yPos);
  return yPos + 8;
}

function drawFooter(doc: jsPDF, pageNum: number, totalPages: number, pageW: number, pageH: number, documentRef: string, margin: number) {
  const footerY = pageH - 12;
  
  setColor(doc, COLORS.border, "draw");
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pageW - margin, footerY - 5);
  
  setColor(doc, COLORS.textMuted);
  doc.setFontSize(8);
  setupFont(doc, "normal");
  
  doc.text("OKEAN YACHTS", margin, footerY);
  doc.text(documentRef, pageW / 2, footerY, { align: "center" });
  doc.text(`${pageNum} / ${totalPages}`, pageW - margin, footerY, { align: "right" });
}

function addFootersToAllPages(doc: jsPDF, pageW: number, pageH: number, documentRef: string, margin: number) {
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, i, totalPages, pageW, pageH, documentRef, margin);
  }
}

function checkPageBreak(doc: jsPDF, yPos: number, pageH: number, margin: number, reservedHeight: number = 50): number {
  if (yPos > pageH - reservedHeight) {
    doc.addPage();
    return margin + 10;
  }
  return yPos;
}

// ===== RENDERIZAÇÃO DO CONTRATO ORIGINAL =====

async function renderOriginalContract(
  doc: jsPDF,
  contract: any,
  pageW: number,
  pageH: number,
  margin: number
): Promise<void> {
  let yPos = drawPageHeader(doc, "CONTRATO ORIGINAL", contract.contract_number, pageW, margin);
  
  // Informações básicas
  yPos = drawSectionTitle(doc, "Informações do Contrato", yPos, margin, pageW);
  yPos = drawInfoRow(doc, "Número", contract.contract_number, yPos, margin, pageW);
  yPos = drawInfoRow(doc, "Cliente", contract.client?.name || "-", yPos, margin, pageW);
  yPos = drawInfoRow(doc, "Modelo", contract.yacht_model?.name || "-", yPos, margin, pageW);
  if (contract.hull_number?.hull_number) {
    yPos = drawInfoRow(doc, "Matrícula", contract.hull_number.hull_number, yPos, margin, pageW);
  }
  yPos = drawInfoRow(doc, "Assinado em", formatDateLong(contract.signed_at), yPos, margin, pageW);
  yPos = drawInfoRow(doc, "Assinado por", `${contract.signed_by_name || "-"} <${contract.signed_by_email || ""}>`, yPos, margin, pageW);
  
  yPos = drawDivider(doc, yPos + 5, margin, pageW);
  
  // Modelo Base
  const baseSnapshot = contract.base_snapshot || {};
  const modelBasePrice = baseSnapshot.base_price || contract.yacht_model?.base_price || 0;
  const baseDiscountPercent = baseSnapshot.discount_percentage || baseSnapshot.base_discount_percentage || 0;
  const baseDiscountAmount = modelBasePrice * (baseDiscountPercent / 100);
  
  yPos = checkPageBreak(doc, yPos, pageH, margin);
  yPos = drawSectionTitle(doc, "Modelo Base", yPos, margin, pageW);
  yPos = drawPriceRow(doc, contract.yacht_model?.name || "Modelo", modelBasePrice, yPos, margin, pageW);
  if (baseDiscountAmount > 0) {
    yPos = drawPriceRow(doc, `Desconto (${baseDiscountPercent}%)`, baseDiscountAmount, yPos, margin, pageW, { isNegative: true, isSubItem: true });
  }
  
  // Upgrades
  const upgrades = baseSnapshot.selected_upgrades || [];
  if (upgrades.length > 0) {
    yPos = checkPageBreak(doc, yPos, pageH, margin);
    yPos = drawDivider(doc, yPos, margin, pageW);
    yPos = drawSectionTitle(doc, "Upgrades Selecionados", yPos, margin, pageW);
    
    for (const upgrade of upgrades) {
      yPos = checkPageBreak(doc, yPos, pageH, margin, 30);
      const upgradeName = upgrade.upgrade?.name || upgrade.upgrade_name || upgrade.name || "Upgrade";
      const replaces = upgrade.memorial_item?.item_name || upgrade.memorial_item_name || "";
      const description = replaces ? `${upgradeName} (substitui: ${replaces})` : upgradeName;
      yPos = drawPriceRow(doc, description, upgrade.price || 0, yPos, margin, pageW);
    }
  }
  
  // Opcionais
  const options = baseSnapshot.selected_options || [];
  if (options.length > 0) {
    yPos = checkPageBreak(doc, yPos, pageH, margin);
    yPos = drawDivider(doc, yPos, margin, pageW);
    yPos = drawSectionTitle(doc, "Opcionais Inclusos", yPos, margin, pageW);
    
    // Agrupar por categoria (se disponível)
    for (const option of options) {
      yPos = checkPageBreak(doc, yPos, pageH, margin, 30);
      const optionName = option.option?.name || option.name || "Opcional";
      const code = option.option?.code || option.code || "";
      const description = code ? `${optionName} (${code})` : optionName;
      yPos = drawPriceRow(doc, description, option.total_price || option.unit_price || 0, yPos, margin, pageW);
    }
  }
  
  // Customizações
  const customizations = baseSnapshot.customizations || [];
  if (customizations.length > 0) {
    yPos = checkPageBreak(doc, yPos, pageH, margin);
    yPos = drawDivider(doc, yPos, margin, pageW);
    yPos = drawSectionTitle(doc, "Customizações Aprovadas", yPos, margin, pageW);
    
    for (const cust of customizations) {
      yPos = checkPageBreak(doc, yPos, pageH, margin, 30);
      const custName = cust.item_name || "Customização";
      const custPrice = cust.pm_final_price || cust.additional_cost || 0;
      yPos = drawPriceRow(doc, custName, custPrice, yPos, margin, pageW);
    }
  }
  
  // Resumo Financeiro
  yPos = checkPageBreak(doc, yPos, pageH, margin, 80);
  yPos = drawDivider(doc, yPos + 5, margin, pageW);
  yPos = drawSectionTitle(doc, "Resumo Financeiro", yPos, margin, pageW);
  
  const upgradesTotal = upgrades.reduce((sum: number, u: any) => sum + (u.price || 0), 0);
  const optionsTotal = options.reduce((sum: number, o: any) => sum + (o.total_price || o.unit_price || 0), 0);
  const customizationsTotal = customizations.reduce((sum: number, c: any) => sum + (c.pm_final_price || c.additional_cost || 0), 0);
  
  yPos = drawPriceRow(doc, "Modelo Base", modelBasePrice, yPos, margin, pageW);
  if (upgradesTotal > 0) {
    yPos = drawPriceRow(doc, "Upgrades", upgradesTotal, yPos, margin, pageW);
  }
  if (optionsTotal > 0) {
    yPos = drawPriceRow(doc, "Opcionais", optionsTotal, yPos, margin, pageW);
  }
  if (customizationsTotal > 0) {
    yPos = drawPriceRow(doc, "Customizações", customizationsTotal, yPos, margin, pageW);
  }
  if (baseDiscountAmount > 0) {
    yPos = drawPriceRow(doc, "Desconto Comercial", baseDiscountAmount, yPos, margin, pageW, { isNegative: true });
  }
  
  yPos += 5;
  yPos = drawPriceRow(doc, "VALOR TOTAL CONTRATO ORIGINAL", contract.base_price, yPos, margin, pageW, { isTotal: true });
  
  yPos += 10;
  yPos = drawInfoRow(doc, "Prazo de Entrega", `${contract.base_delivery_days} dias`, yPos, margin, pageW);
  if (contract.hull_number?.estimated_delivery_date) {
    yPos = drawInfoRow(doc, "Previsão de Entrega", formatDateLong(contract.hull_number.estimated_delivery_date), yPos, margin, pageW);
  }
}

// ===== RENDERIZAÇÃO DE ATO =====

async function renderATO(
  doc: jsPDF,
  ato: any,
  configurations: any[],
  contract: any,
  pageW: number,
  pageH: number,
  margin: number,
  isFirstPage: boolean = true
): Promise<void> {
  let yPos: number;
  
  if (isFirstPage) {
    yPos = drawPageHeader(doc, "ADDITION TO ORDER (ATO)", ato.ato_number, pageW, margin);
  } else {
    doc.addPage();
    yPos = drawPageHeader(doc, "ADDITION TO ORDER (ATO)", ato.ato_number, pageW, margin);
  }
  
  // Informações da ATO
  yPos = drawSectionTitle(doc, "Informações da ATO", yPos, margin, pageW);
  yPos = drawInfoRow(doc, "Número", ato.ato_number, yPos, margin, pageW);
  yPos = drawInfoRow(doc, "Título", ato.title, yPos, margin, pageW);
  yPos = drawInfoRow(doc, "Contrato", contract.contract_number, yPos, margin, pageW);
  yPos = drawInfoRow(doc, "Cliente", contract.client?.name || "-", yPos, margin, pageW);
  yPos = drawInfoRow(doc, "Modelo", contract.yacht_model?.name || "-", yPos, margin, pageW);
  yPos = drawInfoRow(doc, "Data Aprovação", formatDateLong(ato.approved_at), yPos, margin, pageW);
  
  if (ato.description) {
    yPos += 3;
    doc.setFontSize(10);
    setupFont(doc, "italic");
    setColor(doc, COLORS.textMuted);
    const descLines = doc.splitTextToSize(ato.description, pageW - margin * 2);
    descLines.forEach((line: string) => {
      yPos = checkPageBreak(doc, yPos, pageH, margin, 20);
      doc.text(line, margin, yPos);
      yPos += 5;
    });
  }
  
  yPos = drawDivider(doc, yPos + 5, margin, pageW);
  
  // Itens da ATO
  if (configurations.length > 0) {
    yPos = drawSectionTitle(doc, "Itens Inclusos", yPos, margin, pageW);
    
    for (const config of configurations) {
      yPos = checkPageBreak(doc, yPos, pageH, margin, 40);
      
      const itemType = config.item_type === "upgrade" ? "[UPGRADE]" 
        : config.item_type === "option" ? "[OPCIONAL]" 
        : config.item_type === "reversal" ? "[ESTORNO]"
        : "[CUSTOMIZAÇÃO]";
      
      const itemName = config.configuration_details?.name 
        || config.configuration_details?.item_name 
        || config.item_name 
        || "Item";
      
      const originalPrice = config.original_price || config.configuration_details?.price || 0;
      const discountPercent = config.discount_percentage || 0;
      const discountAmount = originalPrice * (discountPercent / 100);
      const calculatedPrice = config.calculated_price ?? (originalPrice - discountAmount);
      
      // Item header
      doc.setFontSize(10);
      setupFont(doc, "bold");
      setColor(doc, COLORS.navy);
      doc.text(`${itemType} ${itemName}`, margin, yPos);
      yPos += 7;
      
      // Preço original
      yPos = drawPriceRow(doc, "Valor", originalPrice, yPos, margin, pageW, { isSubItem: true });
      
      // Desconto (se houver)
      if (discountAmount > 0) {
        yPos = drawPriceRow(doc, `Desconto (${discountPercent}%)`, discountAmount, yPos, margin, pageW, { isNegative: true, isSubItem: true });
      }
      
      // Substituição/estorno (se houver)
      if (config.is_reversal && config.reversal_reason) {
        doc.setFontSize(9);
        setupFont(doc, "italic");
        setColor(doc, COLORS.textMuted);
        doc.text(`Motivo: ${config.reversal_reason}`, margin + 5, yPos);
        yPos += 6;
      }
      
      // Subtotal do item
      setupFont(doc, "bold");
      setColor(doc, COLORS.textDark);
      doc.setFontSize(10);
      doc.text("Subtotal:", margin + 5, yPos);
      const subtotalColor = calculatedPrice < 0 ? { r: 180, g: 130, b: 40 } : COLORS.textDark;
      setColor(doc, subtotalColor);
      const subtotalText = calculatedPrice < 0 ? `-${formatCurrency(Math.abs(calculatedPrice))}` : formatCurrency(calculatedPrice);
      doc.text(subtotalText, pageW - margin, yPos, { align: "right" });
      yPos += 10;
    }
  }
  
  // Impacto Financeiro
  yPos = checkPageBreak(doc, yPos, pageH, margin, 60);
  yPos = drawDivider(doc, yPos, margin, pageW);
  yPos = drawSectionTitle(doc, "Impacto Financeiro", yPos, margin, pageW);
  
  const totalBruto = ato.original_price_impact || ato.price_impact || 0;
  const discountAmount = ato.discount_amount || 0;
  const totalLiquido = ato.price_impact || 0;
  
  yPos = drawPriceRow(doc, "Valor Bruto", totalBruto, yPos, margin, pageW);
  if (discountAmount > 0) {
    yPos = drawPriceRow(doc, `Desconto (${ato.discount_percentage || 0}%)`, discountAmount, yPos, margin, pageW, { isNegative: true });
  }
  
  yPos += 5;
  const isCredit = totalLiquido < 0;
  const totalLabel = isCredit ? "TOTAL LÍQUIDO (CRÉDITO)" : "TOTAL LÍQUIDO ATO";
  yPos = drawPriceRow(doc, totalLabel, Math.abs(totalLiquido), yPos, margin, pageW, { isTotal: true });
  
  yPos += 10;
  if (ato.delivery_days_impact > 0) {
    yPos = drawInfoRow(doc, "Impacto no Prazo", `+${ato.delivery_days_impact} dias`, yPos, margin, pageW);
  }
}

// ===== RENDERIZAÇÃO DO CONTRATO TOTAL =====

async function renderTotalContract(
  doc: jsPDF,
  contract: any,
  approvedATOs: any[],
  atoConfigurations: Map<string, any[]>,
  pageW: number,
  pageH: number,
  margin: number
): Promise<void> {
  // Primeiro: Contrato Original
  await renderOriginalContract(doc, contract, pageW, pageH, margin);
  
  // Se houver ATOs, adicionar seção de resumo
  if (approvedATOs.length > 0) {
    doc.addPage();
    let yPos = drawPageHeader(doc, "RESUMO DAS ALTERAÇÕES", "ATOs Aprovadas", pageW, margin);
    
    yPos = drawSectionTitle(doc, "ATOs Incorporadas ao Contrato", yPos, margin, pageW);
    
    let totalATOsPrice = 0;
    let maxATODelivery = 0;
    
    for (const ato of approvedATOs) {
      yPos = checkPageBreak(doc, yPos, pageH, margin, 30);
      
      const isCredit = ato.price_impact < 0;
      yPos = drawPriceRow(
        doc, 
        `${ato.ato_number} - ${ato.title}`, 
        Math.abs(ato.price_impact || 0), 
        yPos, 
        margin, 
        pageW,
        { isNegative: isCredit }
      );
      
      if (ato.delivery_days_impact > 0) {
        doc.setFontSize(9);
        setupFont(doc, "italic");
        setColor(doc, COLORS.textMuted);
        doc.text(`(+${ato.delivery_days_impact} dias)`, pageW - margin - 80, yPos - 5);
      }
      
      totalATOsPrice += ato.price_impact || 0;
      maxATODelivery = Math.max(maxATODelivery, ato.delivery_days_impact || 0);
    }
    
    yPos = drawDivider(doc, yPos + 5, margin, pageW);
    yPos = drawPriceRow(
      doc, 
      "TOTAL ATOs", 
      Math.abs(totalATOsPrice), 
      yPos, 
      margin, 
      pageW, 
      { isTotal: true }
    );
    
    if (maxATODelivery > 0) {
      yPos += 5;
      yPos = drawInfoRow(doc, "Impacto Máximo no Prazo", `+${maxATODelivery} dias`, yPos, margin, pageW);
    }
    
    // Cada ATO detalhada
    for (const ato of approvedATOs) {
      const configs = atoConfigurations.get(ato.id) || [];
      await renderATO(doc, ato, configs, contract, pageW, pageH, margin, false);
    }
    
    // Página final: Resumo Consolidado
    doc.addPage();
    yPos = drawPageHeader(doc, "CONTRATO CONSOLIDADO", contract.contract_number, pageW, margin);
    
    yPos = drawSectionTitle(doc, "Resumo Final", yPos, margin, pageW);
    
    const finalPrice = contract.base_price + totalATOsPrice;
    const finalDelivery = contract.base_delivery_days + maxATODelivery;
    
    yPos = drawPriceRow(doc, "Contrato Original", contract.base_price, yPos, margin, pageW);
    
    const atosSign = totalATOsPrice >= 0 ? "" : "-";
    yPos = drawPriceRow(
      doc, 
      `Total ATOs (${approvedATOs.length})`, 
      Math.abs(totalATOsPrice), 
      yPos, 
      margin, 
      pageW,
      { isNegative: totalATOsPrice < 0 }
    );
    
    yPos += 5;
    yPos = drawPriceRow(doc, "VALOR TOTAL ATUAL", finalPrice, yPos, margin, pageW, { isTotal: true });
    
    yPos += 15;
    yPos = drawSectionTitle(doc, "Prazos", yPos, margin, pageW);
    yPos = drawInfoRow(doc, "Prazo Original", `${contract.base_delivery_days} dias`, yPos, margin, pageW);
    if (maxATODelivery > 0) {
      yPos = drawInfoRow(doc, "Impacto ATOs", `+${maxATODelivery} dias`, yPos, margin, pageW);
    }
    yPos = drawInfoRow(doc, "Prazo Total", `${finalDelivery} dias`, yPos, margin, pageW);
    
    if (contract.hull_number?.estimated_delivery_date) {
      const baseDate = new Date(contract.hull_number.estimated_delivery_date);
      baseDate.setDate(baseDate.getDate() + maxATODelivery);
      yPos = drawInfoRow(doc, "Previsão de Entrega", formatDateLong(baseDate.toISOString()), yPos, margin, pageW);
    }
  }
}

// ===== SERVIDOR PRINCIPAL =====

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== Generate Contract Summary PDF Started ===");

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

    const { contract_id, export_type, ato_id } = await req.json();
    
    if (!contract_id) throw new Error("contract_id is required");
    if (!export_type) throw new Error("export_type is required");
    
    console.log(`Export type: ${export_type}, Contract: ${contract_id}, ATO: ${ato_id || "all"}`);

    // Buscar dados do contrato
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select(`
        *,
        client:clients(*),
        yacht_model:yacht_models(*),
        hull_number:hull_numbers!contracts_hull_number_id_fkey(*)
      `)
      .eq("id", contract_id)
      .single();

    if (contractError || !contract) {
      throw new Error("Contract not found: " + contractError?.message);
    }
    
    console.log("Contract found:", contract.contract_number);

    // Buscar ATOs aprovadas
    const { data: allATOs } = await supabase
      .from("additional_to_orders")
      .select("*")
      .eq("contract_id", contract_id)
      .eq("status", "approved")
      .order("sequence_number", { ascending: true });

    const approvedATOs = allATOs || [];
    console.log(`Found ${approvedATOs.length} approved ATOs`);

    // Buscar configurações das ATOs
    const atoConfigurations = new Map<string, any[]>();
    for (const ato of approvedATOs) {
      const { data: configs } = await supabase
        .from("ato_configurations")
        .select("*")
        .eq("ato_id", ato.id);
      atoConfigurations.set(ato.id, configs || []);
    }

    // Criar PDF
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Gerar conteúdo baseado no tipo de exportação
    switch (export_type) {
      case "original":
        await renderOriginalContract(doc, contract, pageW, pageH, margin);
        break;
        
      case "ato":
        if (ato_id) {
          // ATO individual
          const ato = approvedATOs.find(a => a.id === ato_id);
          if (!ato) throw new Error("ATO not found");
          const configs = atoConfigurations.get(ato_id) || [];
          await renderATO(doc, ato, configs, contract, pageW, pageH, margin, true);
        } else {
          // Todas as ATOs
          if (approvedATOs.length === 0) {
            throw new Error("No approved ATOs found");
          }
          for (let i = 0; i < approvedATOs.length; i++) {
            const ato = approvedATOs[i];
            const configs = atoConfigurations.get(ato.id) || [];
            await renderATO(doc, ato, configs, contract, pageW, pageH, margin, i === 0);
          }
        }
        break;
        
      case "total":
        await renderTotalContract(doc, contract, approvedATOs, atoConfigurations, pageW, pageH, margin);
        break;
        
      default:
        throw new Error("Invalid export_type");
    }

    // Adicionar footers
    const documentRef = export_type === "ato" && ato_id 
      ? approvedATOs.find(a => a.id === ato_id)?.ato_number || contract.contract_number
      : contract.contract_number;
    addFootersToAllPages(doc, pageW, pageH, documentRef, margin);

    // Converter para base64
    const pdfOutput = doc.output("arraybuffer");
    const pdfBase64 = btoa(
      new Uint8Array(pdfOutput).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    console.log("PDF generated successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        pdf_base64: pdfBase64 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error generating PDF:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
