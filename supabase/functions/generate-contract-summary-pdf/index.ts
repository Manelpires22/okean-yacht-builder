import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ===== SISTEMA DE TIPOGRAFIA PADRONIZADA =====
const TYPOGRAPHY = {
  title: 14,           // Título do documento (header)
  sectionTitle: 11,    // Títulos de seção (INFORMAÇÕES DO CONTRATO)
  subsectionTitle: 10, // Subtítulos (Dimensões Principais)
  body: 9,             // Texto normal (labels e valores)
  small: 8,            // Texto menor (notas, rodapé, specs)
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

// ===== CONVERSÃO DE UNIDADES =====
function metersToFeet(meters: number): string {
  const feet = meters * 3.28084;
  return `${feet.toFixed(2)} ft`;
}

function formatNumberWithUnit(value: number | string | null | undefined, unit: string): string {
  if (value === null || value === undefined || value === "") return "-";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "-";
  return `${num.toLocaleString("pt-BR")} ${unit}`;
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
  doc.setFontSize(TYPOGRAPHY.subsectionTitle);
  setupFont(doc, "bold");
  doc.text("OKEAN YACHTS", margin, 15);
  
  // Document title
  setColor(doc, COLORS.gold);
  doc.setFontSize(TYPOGRAPHY.title);
  setupFont(doc, "bold");
  doc.text(title, margin, 28);
  
  // Subtitle
  if (subtitle) {
    setColor(doc, COLORS.white);
    doc.setFontSize(TYPOGRAPHY.body);
    setupFont(doc, "normal");
    doc.text(subtitle, pageW - margin, 28, { align: "right" });
  }
  
  return 50;
}

function drawSectionTitle(doc: jsPDF, title: string, yPos: number, margin: number, pageW: number): number {
  setColor(doc, COLORS.navy);
  doc.setFontSize(TYPOGRAPHY.sectionTitle);
  setupFont(doc, "bold");
  doc.text(title.toUpperCase(), margin, yPos);
  
  yPos += 2;
  setColor(doc, COLORS.gold, "draw");
  doc.setLineWidth(0.8);
  doc.line(margin, yPos, margin + 50, yPos);
  
  return yPos + 10;
}

function drawInfoRow(doc: jsPDF, label: string, value: string, yPos: number, margin: number, pageW: number, labelWidth: number = 60): number {
  doc.setFontSize(TYPOGRAPHY.body);
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
    
    doc.setFontSize(TYPOGRAPHY.sectionTitle);
    setupFont(doc, "bold");
    setColor(doc, COLORS.navy);
    doc.text(description, margin, yPos);
    
    setColor(doc, COLORS.navy);
    doc.text(formatCurrency(price), priceX, yPos, { align: "right" });
  } else {
    const lineHeight = 4.5;
    const priceColWidth = 80;
    const textX = options?.isSubItem ? margin + 8 : margin;
    const maxTextWidth = pageW - margin - priceColWidth - (options?.isSubItem ? 8 : 0);
    
    doc.setFontSize(TYPOGRAPHY.body);
    setupFont(doc, options?.isSubItem ? "italic" : "normal");
    setColor(doc, options?.isSubItem ? COLORS.textMuted : COLORS.textDark);
    
    const lines: string[] = doc.splitTextToSize(description, maxTextWidth);
    
    lines.forEach((line: string, index: number) => {
      doc.text(line, textX, yPos + (index * lineHeight));
    });
    
    if (options?.isNegative) {
      setColor(doc, { r: 34, g: 140, b: 90 });
      doc.text(`-${formatCurrency(Math.abs(price))}`, priceX, yPos, { align: "right" });
    } else {
      setColor(doc, COLORS.textDark);
      doc.text(formatCurrency(price), priceX, yPos, { align: "right" });
    }
    
    const totalHeight = lines.length * lineHeight;
    return yPos + Math.max(totalHeight, 7) + 3;
  }
  
  return yPos + 10;
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
  doc.setFontSize(TYPOGRAPHY.small);
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

// ===== ESPECIFICAÇÕES TÉCNICAS DO IATE (DUAS COLUNAS) =====

function drawSpecSubsectionCol(doc: jsPDF, title: string, yPos: number, startX: number): number {
  doc.setFontSize(TYPOGRAPHY.body);
  setupFont(doc, "bold");
  setColor(doc, COLORS.gold);
  doc.text(title, startX, yPos);
  return yPos + 6;
}

function drawSpecRowCol(
  doc: jsPDF, 
  label: string, 
  value: string, 
  yPos: number, 
  startX: number,
  colWidth: number
): number {
  if (!value || value === "-") return yPos;
  
  doc.setFontSize(TYPOGRAPHY.small);
  setupFont(doc, "normal");
  setColor(doc, COLORS.textMuted);
  doc.text(label + ":", startX + 3, yPos);
  
  setColor(doc, COLORS.textDark);
  const valueX = startX + colWidth * 0.45;
  const maxWidth = colWidth * 0.52;
  const lines = doc.splitTextToSize(value, maxWidth);
  doc.text(lines[0], valueX, yPos);
  
  return yPos + 5;
}

function renderYachtSpecifications(
  doc: jsPDF,
  yachtModel: any,
  yPos: number,
  pageW: number,
  pageH: number,
  margin: number
): number {
  if (!yachtModel) return yPos;
  
  yPos = drawSectionTitle(doc, "Especificações Técnicas", yPos, margin, pageW);
  
  const contentWidth = pageW - (margin * 2);
  const colWidth = (contentWidth - 10) / 2;
  const leftColX = margin;
  const rightColX = margin + colWidth + 10;
  
  let leftY = yPos;
  let rightY = yPos;
  
  // COLUNA ESQUERDA: Dimensões + Pesos/Capacidades
  leftY = drawSpecSubsectionCol(doc, "Dimensões Principais", leftY, leftColX);
  
  if (yachtModel.length_overall) {
    const loa = parseFloat(yachtModel.length_overall);
    leftY = drawSpecRowCol(doc, "Comprimento Total (LOA)", `${loa.toFixed(2)} m (${metersToFeet(loa)})`, leftY, leftColX, colWidth);
  }
  if (yachtModel.hull_length) {
    const hull = parseFloat(yachtModel.hull_length);
    leftY = drawSpecRowCol(doc, "Comprimento do Casco", `${hull.toFixed(2)} m (${metersToFeet(hull)})`, leftY, leftColX, colWidth);
  }
  if (yachtModel.beam) {
    const beam = parseFloat(yachtModel.beam);
    leftY = drawSpecRowCol(doc, "Boca (Beam)", `${beam.toFixed(2)} m (${metersToFeet(beam)})`, leftY, leftColX, colWidth);
  }
  if (yachtModel.draft) {
    const draft = parseFloat(yachtModel.draft);
    leftY = drawSpecRowCol(doc, "Calado (Draft)", `${draft.toFixed(2)} m (${metersToFeet(draft)})`, leftY, leftColX, colWidth);
  }
  
  leftY += 4;
  
  leftY = drawSpecSubsectionCol(doc, "Pesos e Capacidades", leftY, leftColX);
  
  if (yachtModel.displacement_loaded) {
    leftY = drawSpecRowCol(doc, "Deslocamento Carregado", formatNumberWithUnit(yachtModel.displacement_loaded, "kg"), leftY, leftColX, colWidth);
  }
  if (yachtModel.dry_weight) {
    leftY = drawSpecRowCol(doc, "Peso Seco", formatNumberWithUnit(yachtModel.dry_weight, "kg"), leftY, leftColX, colWidth);
  }
  if (yachtModel.fuel_capacity) {
    leftY = drawSpecRowCol(doc, "Capacidade Combustível", formatNumberWithUnit(yachtModel.fuel_capacity, "L"), leftY, leftColX, colWidth);
  }
  if (yachtModel.water_capacity) {
    leftY = drawSpecRowCol(doc, "Capacidade de Água", formatNumberWithUnit(yachtModel.water_capacity, "L"), leftY, leftColX, colWidth);
  }
  
  // COLUNA DIREITA: Acomodações + Performance + Acabamento
  const hasCabins = yachtModel.cabins !== null && yachtModel.cabins !== undefined;
  const hasBathrooms = yachtModel.bathrooms !== null && yachtModel.bathrooms !== undefined;
  const hasPassengers = yachtModel.passengers_capacity !== null && yachtModel.passengers_capacity !== undefined;
  
  if (hasCabins || hasBathrooms || hasPassengers) {
    rightY = drawSpecSubsectionCol(doc, "Acomodações", rightY, rightColX);
    
    if (hasCabins) {
      rightY = drawSpecRowCol(doc, "Camarotes", String(yachtModel.cabins), rightY, rightColX, colWidth);
    }
    if (hasBathrooms) {
      rightY = drawSpecRowCol(doc, "Banheiros", String(yachtModel.bathrooms), rightY, rightColX, colWidth);
    }
    if (hasPassengers) {
      rightY = drawSpecRowCol(doc, "Capacidade Passageiros", String(yachtModel.passengers_capacity), rightY, rightColX, colWidth);
    }
    
    rightY += 4;
  }
  
  const hasEngines = yachtModel.engines;
  const hasMaxSpeed = yachtModel.max_speed !== null && yachtModel.max_speed !== undefined;
  const hasCruiseSpeed = yachtModel.cruise_speed !== null && yachtModel.cruise_speed !== undefined;
  const hasRange = yachtModel.range_nautical_miles !== null && yachtModel.range_nautical_miles !== undefined;
  
  if (hasEngines || hasMaxSpeed || hasCruiseSpeed || hasRange) {
    rightY = drawSpecSubsectionCol(doc, "Performance", rightY, rightColX);
    
    if (hasEngines) {
      rightY = drawSpecRowCol(doc, "Motorização", yachtModel.engines, rightY, rightColX, colWidth);
    }
    if (hasMaxSpeed) {
      rightY = drawSpecRowCol(doc, "Velocidade Máxima", `${yachtModel.max_speed} nós`, rightY, rightColX, colWidth);
    }
    if (hasCruiseSpeed) {
      rightY = drawSpecRowCol(doc, "Velocidade Cruzeiro", `${yachtModel.cruise_speed} nós`, rightY, rightColX, colWidth);
    }
    if (hasRange) {
      rightY = drawSpecRowCol(doc, "Autonomia", `${yachtModel.range_nautical_miles} mn`, rightY, rightColX, colWidth);
    }
    
    rightY += 4;
  }
  
  if (yachtModel.hull_color) {
    rightY = drawSpecSubsectionCol(doc, "Acabamento", rightY, rightColX);
    rightY = drawSpecRowCol(doc, "Cor do Casco", yachtModel.hull_color, rightY, rightColX, colWidth);
  }
  
  return Math.max(leftY, rightY) + 5;
}

// ===== MEMORIAL DESCRITIVO (DUAS COLUNAS SINCRONIZADAS) =====

interface MemorialItem {
  id: string;
  item_name: string;
  brand?: string | null;
  model?: string | null;
  quantity?: number | null;
  unit?: string | null;
  memorial_categories: {
    id: string;
    label: string;
    display_order: number;
  };
}

interface CategoryData {
  label: string;
  order: number;
  items: MemorialItem[];
}

// Estimar altura de uma categoria (título + itens)
function estimateCategoryHeight(doc: jsPDF, cat: CategoryData, colWidth: number): number {
  let height = 8; // Título + linha decorativa
  
  for (const item of cat.items) {
    let itemText = `• ${item.item_name}`;
    if (item.quantity && item.quantity > 1) {
      const unitStr = item.unit ? ` ${item.unit}` : "";
      itemText = `• (${item.quantity}${unitStr}) ${item.item_name}`;
    }
    const details: string[] = [];
    if (item.brand) details.push(item.brand);
    if (item.model) details.push(item.model);
    if (details.length > 0) {
      itemText += ` - ${details.join(" ")}`;
    }
    
    const lines = doc.splitTextToSize(itemText, colWidth - 8);
    height += lines.length * 3.5;
  }
  
  return height + 6; // Espaço após categoria
}

// Desenhar uma categoria e seus itens
function drawMemorialCategory(
  doc: jsPDF,
  cat: CategoryData,
  yPos: number,
  xPos: number,
  colWidth: number
): number {
  // Título da categoria em dourado
  doc.setFontSize(TYPOGRAPHY.body);
  setupFont(doc, "bold");
  setColor(doc, COLORS.gold);
  
  const titleLines = doc.splitTextToSize(cat.label.toUpperCase(), colWidth - 5);
  for (let i = 0; i < titleLines.length; i++) {
    doc.text(titleLines[i], xPos, yPos + (i * 4));
  }
  yPos += (titleLines.length * 4) + 2;
  
  // Linha decorativa sob o título
  setColor(doc, COLORS.gold, "draw");
  doc.setLineWidth(0.3);
  doc.line(xPos, yPos, xPos + 30, yPos);
  yPos += 4;
  
  // Itens da categoria
  for (const item of cat.items) {
    doc.setFontSize(TYPOGRAPHY.small);
    setupFont(doc, "normal");
    setColor(doc, COLORS.textDark);
    
    // Construir texto do item
    let itemText = `• ${item.item_name}`;
    
    // Adicionar quantidade se > 1
    if (item.quantity && item.quantity > 1) {
      const unitStr = item.unit ? ` ${item.unit}` : "";
      itemText = `• (${item.quantity}${unitStr}) ${item.item_name}`;
    }
    
    // Adicionar marca/modelo se disponível
    const details: string[] = [];
    if (item.brand) details.push(item.brand);
    if (item.model) details.push(item.model);
    
    if (details.length > 0) {
      itemText += ` - ${details.join(" ")}`;
    }
    
    // Quebrar texto longo
    const lines = doc.splitTextToSize(itemText, colWidth - 8);
    for (let i = 0; i < lines.length; i++) {
      doc.text(lines[i], xPos + 2, yPos);
      yPos += 3.5;
    }
  }
  
  return yPos + 4; // Espaço entre categorias
}

function renderMemorialDescritivo(
  doc: jsPDF,
  memorialItems: MemorialItem[],
  pageW: number,
  pageH: number,
  margin: number
): void {
  if (!memorialItems?.length) return;
  
  doc.addPage();
  let yPos = drawPageHeader(doc, "MEMORIAL DESCRITIVO", "Equipamentos de Série", pageW, margin);
  
  // Agrupar por categoria
  const grouped: Record<string, CategoryData> = {};
  
  for (const item of memorialItems) {
    const catId = item.memorial_categories?.id;
    if (!catId) continue;
    
    if (!grouped[catId]) {
      grouped[catId] = {
        label: item.memorial_categories.label,
        order: item.memorial_categories.display_order,
        items: []
      };
    }
    grouped[catId].items.push(item);
  }
  
  // Ordenar categorias por display_order
  const sortedCategories = Object.values(grouped).sort((a, b) => a.order - b.order);
  
  if (sortedCategories.length === 0) return;
  
  // Layout em duas colunas
  const contentWidth = pageW - (margin * 2);
  const colGap = 10;
  const colWidth = (contentWidth - colGap) / 2;
  const leftColX = margin;
  const rightColX = margin + colWidth + colGap;
  
  // Criar pares de categorias (esquerda + direita) para renderizar lado a lado
  const pairs: Array<{ left: CategoryData | null; right: CategoryData | null }> = [];
  for (let i = 0; i < sortedCategories.length; i += 2) {
    pairs.push({
      left: sortedCategories[i] || null,
      right: sortedCategories[i + 1] || null
    });
  }
  
  // Renderizar pares de categorias lado a lado
  for (const pair of pairs) {
    // Estimar altura do par
    const leftHeight = pair.left ? estimateCategoryHeight(doc, pair.left, colWidth) : 0;
    const rightHeight = pair.right ? estimateCategoryHeight(doc, pair.right, colWidth) : 0;
    const pairHeight = Math.max(leftHeight, rightHeight);
    
    // Verificar se o par cabe na página atual
    if (yPos + pairHeight > pageH - 25) {
      doc.addPage();
      yPos = margin + 10;
    }
    
    // Renderizar lado a lado na mesma posição Y inicial
    let leftY = yPos;
    let rightY = yPos;
    
    if (pair.left) {
      leftY = drawMemorialCategory(doc, pair.left, yPos, leftColX, colWidth);
    }
    
    if (pair.right) {
      rightY = drawMemorialCategory(doc, pair.right, yPos, rightColX, colWidth);
    }
    
    // Sincronizar Y para o próximo par (usar o maior)
    yPos = Math.max(leftY, rightY) + 2;
  }
}

// ===== RENDERIZAÇÃO DO CONTRATO ORIGINAL =====

async function renderOriginalContract(
  doc: jsPDF,
  contract: any,
  memorialItems: MemorialItem[],
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
  
  // Matrícula
  if (contract.hull_number?.hull_number) {
    yPos = drawInfoRow(doc, "Matrícula", contract.hull_number.hull_number, yPos, margin, pageW);
  }
  
  // NOVA POSIÇÃO: Previsão de Entrega logo após Matrícula
  if (contract.hull_number?.estimated_delivery_date) {
    yPos = drawInfoRow(doc, "Previsão de Entrega", formatDateLong(contract.hull_number.estimated_delivery_date), yPos, margin, pageW);
  }
  
  yPos = drawInfoRow(doc, "Assinado em", formatDateLong(contract.signed_at), yPos, margin, pageW);
  yPos = drawInfoRow(doc, "Assinado por", `${contract.signed_by_name || "-"} <${contract.signed_by_email || ""}>`, yPos, margin, pageW);
  
  yPos = drawDivider(doc, yPos + 5, margin, pageW);
  
  // Especificações Técnicas do Modelo
  if (contract.yacht_model) {
    yPos = renderYachtSpecifications(doc, contract.yacht_model, yPos, pageW, pageH, margin);
    yPos = drawDivider(doc, yPos + 2, margin, pageW);
  }
  
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
  
  // Resumo Financeiro - CALCULAR ALTURA PARA NUNCA DIVIDIR
  const upgradesTotal = upgrades.reduce((sum: number, u: any) => sum + (u.price || 0), 0);
  const optionsTotal = options.reduce((sum: number, o: any) => sum + (o.total_price || o.unit_price || 0), 0);
  const customizationsTotal = customizations.reduce((sum: number, c: any) => sum + (c.pm_final_price || c.additional_cost || 0), 0);
  
  // Calcular altura exata do bloco de resumo financeiro
  let resumoLineCount = 2; // Título + Modelo Base (sempre presentes)
  if (upgradesTotal > 0) resumoLineCount++;
  if (optionsTotal > 0) resumoLineCount++;
  if (customizationsTotal > 0) resumoLineCount++;
  if (baseDiscountAmount > 0) resumoLineCount++;
  resumoLineCount += 2; // Espaço + Total
  
  const resumoHeight = 15 + (resumoLineCount * 10) + 20; // divider + título + linhas + total com destaque
  
  // FORÇAR nova página se o bloco inteiro não couber
  if (yPos + resumoHeight > pageH - 25) {
    doc.addPage();
    yPos = margin + 10;
  }
  
  yPos = drawDivider(doc, yPos + 5, margin, pageW);
  yPos = drawSectionTitle(doc, "Resumo Financeiro", yPos, margin, pageW);
  
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
  
  // REMOVIDO: Prazo de 365 dias - agora apenas mostramos a data de entrega no início
  
  // Memorial Descritivo ao final
  if (memorialItems?.length > 0) {
    renderMemorialDescritivo(doc, memorialItems, pageW, pageH, margin);
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
    doc.setFontSize(TYPOGRAPHY.body);
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
      doc.setFontSize(TYPOGRAPHY.body);
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
        doc.setFontSize(TYPOGRAPHY.body);
        setupFont(doc, "italic");
        setColor(doc, COLORS.textMuted);
        doc.text(`Motivo: ${config.reversal_reason}`, margin + 5, yPos);
        yPos += 6;
      }
      
      // Subtotal do item
      setupFont(doc, "bold");
      setColor(doc, COLORS.textDark);
      doc.setFontSize(TYPOGRAPHY.body);
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
  memorialItems: MemorialItem[],
  pageW: number,
  pageH: number,
  margin: number
): Promise<void> {
  // Primeiro: Contrato Original (sem memorial - adicionamos no final)
  let yPos = drawPageHeader(doc, "CONTRATO ORIGINAL", contract.contract_number, pageW, margin);
  
  // Informações básicas
  yPos = drawSectionTitle(doc, "Informações do Contrato", yPos, margin, pageW);
  yPos = drawInfoRow(doc, "Número", contract.contract_number, yPos, margin, pageW);
  yPos = drawInfoRow(doc, "Cliente", contract.client?.name || "-", yPos, margin, pageW);
  yPos = drawInfoRow(doc, "Modelo", contract.yacht_model?.name || "-", yPos, margin, pageW);
  
  if (contract.hull_number?.hull_number) {
    yPos = drawInfoRow(doc, "Matrícula", contract.hull_number.hull_number, yPos, margin, pageW);
  }
  
  // Calcular data de entrega com impacto das ATOs
  if (contract.hull_number?.estimated_delivery_date) {
    const baseDate = new Date(contract.hull_number.estimated_delivery_date);
    const totalDeliveryImpact = approvedATOs.reduce((sum, ato) => sum + (ato.delivery_days_impact || 0), 0);
    baseDate.setDate(baseDate.getDate() + totalDeliveryImpact);
    yPos = drawInfoRow(doc, "Previsão de Entrega", formatDateLong(baseDate.toISOString()), yPos, margin, pageW);
  }
  
  yPos = drawInfoRow(doc, "Assinado em", formatDateLong(contract.signed_at), yPos, margin, pageW);
  yPos = drawInfoRow(doc, "Assinado por", `${contract.signed_by_name || "-"} <${contract.signed_by_email || ""}>`, yPos, margin, pageW);
  
  yPos = drawDivider(doc, yPos + 5, margin, pageW);
  
  // Especificações Técnicas
  if (contract.yacht_model) {
    yPos = renderYachtSpecifications(doc, contract.yacht_model, yPos, pageW, pageH, margin);
    yPos = drawDivider(doc, yPos + 2, margin, pageW);
  }
  
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
  
  // Resumo Financeiro - CALCULAR ALTURA PARA NUNCA DIVIDIR
  const upgradesTotal = upgrades.reduce((sum: number, u: any) => sum + (u.price || 0), 0);
  const optionsTotal = options.reduce((sum: number, o: any) => sum + (o.total_price || o.unit_price || 0), 0);
  const customizationsTotal = customizations.reduce((sum: number, c: any) => sum + (c.pm_final_price || c.additional_cost || 0), 0);
  
  // Calcular altura exata do bloco de resumo financeiro
  let resumoLineCount = 2; // Título + Modelo Base (sempre presentes)
  if (upgradesTotal > 0) resumoLineCount++;
  if (optionsTotal > 0) resumoLineCount++;
  if (customizationsTotal > 0) resumoLineCount++;
  if (baseDiscountAmount > 0) resumoLineCount++;
  resumoLineCount += 2; // Espaço + Total
  
  const resumoHeight = 15 + (resumoLineCount * 10) + 20; // divider + título + linhas + total com destaque
  
  // FORÇAR nova página se o bloco inteiro não couber
  if (yPos + resumoHeight > pageH - 25) {
    doc.addPage();
    yPos = margin + 10;
  }
  
  yPos = drawDivider(doc, yPos + 5, margin, pageW);
  yPos = drawSectionTitle(doc, "Resumo Financeiro", yPos, margin, pageW);
  
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
  
  // Se houver ATOs, adicionar seção de resumo
  if (approvedATOs.length > 0) {
    doc.addPage();
    yPos = drawPageHeader(doc, "RESUMO DAS ALTERAÇÕES", "ATOs Aprovadas", pageW, margin);
    
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
        doc.setFontSize(TYPOGRAPHY.body);
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
    
    yPos = drawPriceRow(doc, "Contrato Original", contract.base_price, yPos, margin, pageW);
    
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
    
    // Previsão de entrega consolidada
    yPos += 10;
    if (contract.hull_number?.estimated_delivery_date) {
      const baseDate = new Date(contract.hull_number.estimated_delivery_date);
      const totalImpact = approvedATOs.reduce((sum, ato) => sum + (ato.delivery_days_impact || 0), 0);
      baseDate.setDate(baseDate.getDate() + totalImpact);
      yPos = drawInfoRow(doc, "Previsão de Entrega Atual", formatDateLong(baseDate.toISOString()), yPos, margin, pageW);
    }
  }
  
  // Memorial Descritivo ao final
  if (memorialItems?.length > 0) {
    renderMemorialDescritivo(doc, memorialItems, pageW, pageH, margin);
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

    // Buscar Memorial Descritivo do modelo (para contrato original e total)
    let memorialItems: MemorialItem[] = [];
    if (export_type === "original" || export_type === "total") {
      const { data: items, error: memorialError } = await supabase
        .from("memorial_items")
        .select(`
          id,
          item_name,
          brand,
          model,
          quantity,
          unit,
          display_order,
          memorial_categories!inner (
            id,
            label,
            display_order
          )
        `)
        .eq("yacht_model_id", contract.yacht_model_id)
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      
      if (!memorialError && items) {
        memorialItems = items as unknown as MemorialItem[];
        console.log(`Found ${memorialItems.length} memorial items`);
      }
    }

    // Criar PDF
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Gerar conteúdo baseado no tipo de exportação
    switch (export_type) {
      case "original":
        await renderOriginalContract(doc, contract, memorialItems, pageW, pageH, margin);
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
        await renderTotalContract(doc, contract, approvedATOs, atoConfigurations, memorialItems, pageW, pageH, margin);
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
