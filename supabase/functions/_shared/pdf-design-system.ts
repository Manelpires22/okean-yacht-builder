// =====================================================
// OKEAN YACHTS - PDF Design System
// Sistema de design compartilhado para todos os PDFs
// =====================================================

import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

// ===== PALETA DE CORES PREMIUM =====
export const COLORS = {
  // Cores primárias da marca
  navy: { r: 12, g: 35, b: 64 },
  navyDark: { r: 8, g: 24, b: 48 },
  navyLight: { r: 20, g: 50, b: 90 },
  
  // Acentos dourados elegantes
  gold: { r: 197, g: 162, b: 99 },
  goldLight: { r: 218, g: 190, b: 140 },
  goldDark: { r: 160, g: 130, b: 70 },
  
  // Paleta neutra
  white: { r: 255, g: 255, b: 255 },
  champagne: { r: 250, g: 248, b: 244 },
  platinum: { r: 235, g: 235, b: 232 },
  silver: { r: 200, g: 200, b: 200 },
  
  // Cores de texto
  textDark: { r: 30, g: 30, b: 35 },
  textMuted: { r: 100, g: 100, b: 105 },
  textLight: { r: 255, g: 255, b: 255 },
  
  // Status
  success: { r: 34, g: 140, b: 90 },
  successLight: { r: 232, g: 245, b: 238 },
  warning: { r: 200, g: 140, b: 40 },
  warningLight: { r: 255, g: 248, b: 230 },
  error: { r: 180, g: 60, b: 60 },
  errorLight: { r: 255, g: 235, b: 235 },
  info: { r: 59, g: 130, b: 246 },
  infoLight: { r: 232, g: 244, b: 253 },
};

// Tipo para cores
type ColorDef = { r: number; g: number; b: number };

// ===== FUNÇÕES UTILITÁRIAS =====

export function setupFont(doc: jsPDF, style: "normal" | "bold" | "italic" = "normal") {
  doc.setFont("helvetica", style);
}

export function setColor(doc: jsPDF, color: ColorDef, type: "fill" | "text" | "draw" = "text") {
  if (type === "fill") {
    doc.setFillColor(color.r, color.g, color.b);
  } else if (type === "draw") {
    doc.setDrawColor(color.r, color.g, color.b);
  } else {
    doc.setTextColor(color.r, color.g, color.b);
  }
}

// ===== FORMATADORES =====

export function formatCurrency(value: number): string {
  if (!value && value !== 0) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2
  }).format(value);
}

export function formatDate(date: string): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(date));
}

export function formatDateShort(date: string): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(date));
}

// ===== COMPONENTES DE DESIGN =====

/**
 * Desenha um fundo gradiente premium
 */
export function drawGradientBackground(
  doc: jsPDF, 
  pageW: number, 
  yStart: number = 0, 
  yEnd: number = 297
) {
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

/**
 * Desenha um divisor dourado elegante com diamante central
 */
export function drawGoldDivider(
  doc: jsPDF, 
  y: number, 
  pageW: number,
  width: number = 170, 
  centered: boolean = true
) {
  const margin = 20;
  const x = centered ? (pageW - width) / 2 : margin;
  
  setColor(doc, COLORS.gold, "draw");
  doc.setLineWidth(0.8);
  doc.line(x, y, x + width, y);
  
  // Diamante decorativo central
  const centerX = x + width / 2;
  doc.setLineWidth(0.5);
  doc.line(centerX - 4, y, centerX, y - 2);
  doc.line(centerX, y - 2, centerX + 4, y);
  doc.line(centerX + 4, y, centerX, y + 2);
  doc.line(centerX, y + 2, centerX - 4, y);
}

/**
 * Desenha uma linha simples dourada
 */
export function drawGoldLine(
  doc: jsPDF, 
  y: number, 
  xStart: number, 
  xEnd: number
) {
  setColor(doc, COLORS.gold, "draw");
  doc.setLineWidth(1);
  doc.line(xStart, y, xEnd, y);
}

/**
 * Desenha uma caixa premium com sombra
 */
export function drawPremiumBox(
  doc: jsPDF, 
  x: number, 
  y: number, 
  w: number, 
  h: number, 
  style: "light" | "dark" | "gold" | "info" | "success" | "warning" = "light"
) {
  // Sombra sutil
  doc.setFillColor(0, 0, 0);
  // @ts-ignore - GState existe no jsPDF
  doc.saveGraphicsState();
  // @ts-ignore
  doc.setGState(new doc.GState({ opacity: 0.08 }));
  doc.roundedRect(x + 2, y + 2, w, h, 3, 3, "F");
  // @ts-ignore
  doc.restoreGraphicsState();
  
  // Preenchimento da caixa
  if (style === "dark") {
    setColor(doc, COLORS.navy, "fill");
  } else if (style === "gold") {
    setColor(doc, COLORS.gold, "fill");
  } else if (style === "info") {
    setColor(doc, COLORS.infoLight, "fill");
  } else if (style === "success") {
    setColor(doc, COLORS.successLight, "fill");
  } else if (style === "warning") {
    setColor(doc, COLORS.warningLight, "fill");
  } else {
    setColor(doc, COLORS.champagne, "fill");
  }
  doc.roundedRect(x, y, w, h, 3, 3, "F");
  
  // Borda
  if (style === "gold") {
    setColor(doc, COLORS.goldDark, "draw");
  } else if (style === "dark") {
    setColor(doc, COLORS.navyLight, "draw");
  } else {
    setColor(doc, COLORS.platinum, "draw");
  }
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, w, h, 3, 3, "S");
}

/**
 * Desenha um badge de status
 */
export function drawStatusBadge(
  doc: jsPDF, 
  text: string, 
  x: number, 
  y: number, 
  status: "approved" | "pending" | "rejected" | "info" = "info"
) {
  const width = doc.getTextWidth(text) + 10;
  const height = 7;
  
  let bgColor: ColorDef;
  let textColor: ColorDef = COLORS.white;
  
  switch (status) {
    case "approved":
      bgColor = COLORS.success;
      break;
    case "rejected":
      bgColor = COLORS.error;
      break;
    case "pending":
      bgColor = COLORS.warning;
      break;
    default:
      bgColor = COLORS.navy;
  }
  
  setColor(doc, bgColor, "fill");
  doc.roundedRect(x - width / 2, y - height + 2, width, height, 2, 2, "F");
  
  setColor(doc, textColor, "text");
  doc.setFontSize(8);
  setupFont(doc, "bold");
  doc.text(text, x, y, { align: "center" });
}

/**
 * Desenha o header premium de uma página
 */
export function drawPageHeader(
  doc: jsPDF, 
  title: string, 
  pageW: number, 
  margin: number = 20
): number {
  // Background do header
  setColor(doc, COLORS.navy, "fill");
  doc.rect(0, 0, pageW, 45, "F");
  
  // Linha de acento dourada
  setColor(doc, COLORS.gold, "fill");
  doc.rect(0, 43, pageW, 2, "F");
  
  // Nome da empresa
  setColor(doc, COLORS.textLight, "text");
  doc.setFontSize(10);
  setupFont(doc, "bold");
  doc.text("OKEAN YACHTS", margin, 18);
  
  // Título da página
  setColor(doc, COLORS.gold, "text");
  doc.setFontSize(18);
  setupFont(doc, "bold");
  doc.text(title, margin, 32);
  
  return 55; // Retorna Y para início do conteúdo
}

/**
 * Desenha o footer premium de uma página
 */
export function drawPageFooter(
  doc: jsPDF, 
  pageNum: number, 
  totalPages: number, 
  pageW: number, 
  pageH: number,
  documentRef: string = "",
  margin: number = 20
) {
  const footerY = pageH - 15;
  
  // Linha acima do footer
  setColor(doc, COLORS.platinum, "draw");
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pageW - margin, footerY - 5);
  
  // Textos do footer
  setColor(doc, COLORS.textMuted, "text");
  doc.setFontSize(8);
  setupFont(doc);
  
  doc.text("OKEAN YACHTS", margin, footerY);
  if (documentRef) {
    doc.text(documentRef, pageW / 2, footerY, { align: "center" });
  }
  doc.text(`${pageNum} / ${totalPages}`, pageW - margin, footerY, { align: "right" });
  
  // Nota de confidencialidade
  doc.setFontSize(7);
  doc.text("Documento confidencial - Uso exclusivo do destinatário", pageW / 2, footerY + 4, { align: "center" });
}

/**
 * Adiciona footers em todas as páginas
 */
export function addFootersToAllPages(
  doc: jsPDF, 
  pageW: number, 
  pageH: number, 
  documentRef: string = "",
  margin: number = 20
) {
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawPageFooter(doc, i, totalPages, pageW, pageH, documentRef, margin);
  }
}

/**
 * Adiciona marca d'água de rascunho
 */
export function addDraftWatermark(doc: jsPDF, pageW: number, pageH: number) {
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(72);
  setupFont(doc, "bold");
  // @ts-ignore
  doc.saveGraphicsState();
  // @ts-ignore
  doc.setGState(new doc.GState({ opacity: 0.10 }));
  doc.text("RASCUNHO", pageW / 2, pageH / 2, { angle: 45, align: "center" });
  // @ts-ignore
  doc.restoreGraphicsState();
}

/**
 * Desenha capa premium com gradiente
 */
export function drawPremiumCover(
  doc: jsPDF,
  pageW: number,
  pageH: number,
  options: {
    title: string;
    subtitle?: string;
    documentNumber: string;
    clientName?: string;
    modelName?: string;
    totalValue?: number;
    date?: string;
    badgeText?: string;
    badgeStatus?: "approved" | "pending" | "rejected" | "info";
    heroImageUrl?: string;
  }
) {
  // Fundo gradiente
  drawGradientBackground(doc, pageW, 0, pageH);
  
  // Padrão sutil de linhas
  // @ts-ignore
  doc.saveGraphicsState();
  // @ts-ignore
  doc.setGState(new doc.GState({ opacity: 0.03 }));
  setColor(doc, COLORS.white, "draw");
  doc.setLineWidth(0.5);
  for (let i = 0; i < 20; i++) {
    doc.line(0, i * 20, pageW, i * 20 + 50);
  }
  // @ts-ignore
  doc.restoreGraphicsState();
  
  let yPos = 50;
  
  // Nome da empresa com espaçamento elegante
  setColor(doc, COLORS.textLight, "text");
  doc.setFontSize(14);
  setupFont(doc);
  doc.setCharSpace(8);
  doc.text("OKEAN YACHTS", pageW / 2, yPos, { align: "center" });
  doc.setCharSpace(0);
  
  // Divisor dourado
  yPos += 15;
  setColor(doc, COLORS.gold, "draw");
  doc.setLineWidth(0.8);
  doc.line(pageW / 2 - 40, yPos, pageW / 2 + 40, yPos);
  
  // Tagline
  yPos += 12;
  doc.setFontSize(9);
  setupFont(doc, "italic");
  setColor(doc, COLORS.goldLight, "text");
  doc.text("Excelência em Embarcações de Luxo", pageW / 2, yPos, { align: "center" });
  
  // Seção central - Título do documento
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
  
  // Badge de status
  if (options.badgeText) {
    yPos += 20;
    drawStatusBadge(doc, options.badgeText.toUpperCase(), pageW / 2, yPos, options.badgeStatus || "info");
  }
  
  // Seção inferior - Informações do documento
  yPos = pageH - 110;
  
  // Label do documento
  setColor(doc, COLORS.goldLight, "text");
  doc.setFontSize(10);
  setupFont(doc);
  doc.setCharSpace(3);
  doc.text("DOCUMENTO", pageW / 2, yPos, { align: "center" });
  doc.setCharSpace(0);
  
  // Número do documento
  yPos += 12;
  setColor(doc, COLORS.textLight, "text");
  doc.setFontSize(20);
  setupFont(doc, "bold");
  doc.text(options.documentNumber, pageW / 2, yPos, { align: "center" });
  
  // Nome do cliente
  if (options.clientName) {
    yPos += 15;
    doc.setFontSize(12);
    setupFont(doc);
    doc.text(`Preparado para: ${options.clientName}`, pageW / 2, yPos, { align: "center" });
  }
  
  // Modelo
  if (options.modelName) {
    yPos += 10;
    setColor(doc, COLORS.gold, "text");
    doc.text(options.modelName, pageW / 2, yPos, { align: "center" });
  }
  
  // Data
  if (options.date) {
    yPos += 10;
    doc.setFontSize(10);
    setColor(doc, COLORS.silver, "text");
    doc.text(options.date, pageW / 2, yPos, { align: "center" });
  }
  
  // Valor total em caixa dourada
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

/**
 * Desenha seção de informações em formato de lista
 */
export function drawInfoList(
  doc: jsPDF,
  items: Array<{ label: string; value: string }>,
  startY: number,
  margin: number = 20,
  labelWidth: number = 60
): number {
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

/**
 * Desenha uma seção de resumo financeiro premium
 */
export function drawFinancialSummary(
  doc: jsPDF,
  items: Array<{ label: string; value: number; highlight?: boolean; negative?: boolean }>,
  total: { label: string; value: number },
  x: number,
  y: number,
  width: number
): number {
  let yPos = y;
  const padding = 15;
  const innerWidth = width - (padding * 2);
  
  // Calcular altura necessária
  const itemHeight = 12;
  const separatorHeight = 15;
  const totalHeight = 20;
  const boxHeight = (items.length * itemHeight) + separatorHeight + totalHeight + (padding * 2);
  
  // Caixa de fundo
  drawPremiumBox(doc, x, y, width, boxHeight, "info");
  
  yPos += padding;
  doc.setFontSize(12);
  
  // Itens
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
  
  // Linha separadora
  yPos += 5;
  setColor(doc, COLORS.navy, "draw");
  doc.setLineWidth(0.5);
  doc.line(x + padding, yPos, x + width - padding, yPos);
  yPos += 10;
  
  // Total
  doc.setFontSize(16);
  setColor(doc, COLORS.gold, "text");
  setupFont(doc, "bold");
  doc.text(total.label, x + padding, yPos);
  doc.text(formatCurrency(total.value), x + width - padding, yPos, { align: "right" });
  
  return y + boxHeight;
}

/**
 * Desenha um card de item
 */
export function drawItemCard(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  title: string,
  subtitle?: string,
  value?: number,
  badge?: { text: string; status: "approved" | "pending" | "rejected" | "info" }
): number {
  const height = subtitle ? 28 : 22;
  
  drawPremiumBox(doc, x, y, width, height, "light");
  
  // Título
  doc.setFontSize(10);
  setupFont(doc, "bold");
  setColor(doc, COLORS.textDark, "text");
  doc.text(title, x + 5, y + 8);
  
  // Subtítulo
  if (subtitle) {
    doc.setFontSize(8);
    setupFont(doc);
    setColor(doc, COLORS.textMuted, "text");
    doc.text(subtitle, x + 5, y + 16);
  }
  
  // Valor
  if (value !== undefined) {
    doc.setFontSize(10);
    setupFont(doc, "bold");
    setColor(doc, COLORS.navy, "text");
    doc.text(formatCurrency(value), x + width - 5, y + (subtitle ? 12 : 8), { align: "right" });
  }
  
  // Badge
  if (badge) {
    const badgeY = y + (subtitle ? 20 : 14);
    drawStatusBadge(doc, badge.text, x + width - 25, badgeY, badge.status);
  }
  
  return y + height + 5;
}

// Exportar tudo como default também para facilitar importação
export default {
  COLORS,
  setupFont,
  setColor,
  formatCurrency,
  formatDate,
  formatDateShort,
  drawGradientBackground,
  drawGoldDivider,
  drawGoldLine,
  drawPremiumBox,
  drawStatusBadge,
  drawPageHeader,
  drawPageFooter,
  addFootersToAllPages,
  addDraftWatermark,
  drawPremiumCover,
  drawInfoList,
  drawFinancialSummary,
  drawItemCard,
};
