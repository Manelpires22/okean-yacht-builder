import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Executive color palette - clean and professional
const COLORS = {
  // Primary
  navy: { r: 15, g: 23, b: 42 },
  gold: { r: 180, g: 150, b: 80 },
  white: { r: 255, g: 255, b: 255 },
  
  // Grays
  lightGray: { r: 250, g: 251, b: 252 },
  borderGray: { r: 226, g: 232, b: 240 },
  textMuted: { r: 100, g: 116, b: 139 },
  textBody: { r: 51, g: 65, b: 85 },
  textDark: { r: 15, g: 23, b: 42 },
  
  // Status
  green: { r: 22, g: 163, b: 74 },
  greenBg: { r: 240, g: 253, b: 244 },
  red: { r: 185, g: 28, b: 28 },
  redBg: { r: 254, g: 242, b: 242 },
  amber: { r: 180, g: 83, b: 9 },
  amberBg: { r: 255, g: 251, b: 235 },
  blue: { r: 37, g: 99, b: 235 },
};

type ColorDef = { r: number; g: number; b: number };

function setColor(doc: jsPDF, color: ColorDef, type: "fill" | "text" | "draw" = "text") {
  if (type === "fill") doc.setFillColor(color.r, color.g, color.b);
  else if (type === "draw") doc.setDrawColor(color.r, color.g, color.b);
  else doc.setTextColor(color.r, color.g, color.b);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { 
    style: "currency", 
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function formatForeignCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { 
    style: "currency", 
    currency: currency,
    minimumFractionDigits: 0 
  }).format(value);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

function getMarginColor(percent: number): ColorDef {
  if (percent >= 25) return COLORS.green;
  if (percent >= 15) return COLORS.amber;
  return COLORS.red;
}

function getMarginBgColor(percent: number): ColorDef {
  if (percent >= 25) return COLORS.greenBg;
  if (percent >= 15) return COLORS.amberBg;
  return COLORS.redBg;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { simulationId } = await req.json();

    if (!simulationId) {
      throw new Error("simulationId é obrigatório");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: simulation, error } = await supabase
      .from("simulations")
      .select("*")
      .eq("id", simulationId)
      .single();

    if (error || !simulation) {
      throw new Error("Simulação não encontrada");
    }

    console.log("Gerando PDF executivo para:", simulation.simulation_number);

    // Create PDF
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;
    let y = 0;

    // === CALCULATED VALUES ===
    const isExporting = simulation.is_exporting ?? false;
    const hasTradeIn = simulation.has_trade_in ?? false;
    const exportCurrency = simulation.export_currency || "USD";
    const exchangeRate = exportCurrency === "USD" ? simulation.usd_rate : simulation.eur_rate;
    const valorExportacao = isExporting && exchangeRate > 0 ? simulation.faturamento_bruto / exchangeRate : 0;
    const modalidade = isExporting ? "EXPORTAÇÃO" : "MERCADO INTERNO";

    // Commission
    const cashValue = hasTradeIn 
      ? simulation.faturamento_bruto - (simulation.trade_in_entry_value || 0)
      : simulation.faturamento_bruto;
    const comissaoFinal = simulation.adjusted_commission_percent !== null
      ? simulation.adjusted_commission_percent
      : simulation.commission_percent * (1 + (simulation.commission_adjustment_factor || 0));
    const comissaoValor = (comissaoFinal / 100) * cashValue;
    
    // Costs
    const mpImportBRL = simulation.custo_mp_import_currency === "EUR" 
      ? simulation.custo_mp_import * simulation.eur_rate 
      : simulation.custo_mp_import * simulation.usd_rate;
    const custoImportValue = mpImportBRL * (simulation.tax_import_percent / 100);
    const mpTotal = mpImportBRL + simulation.custo_mp_nacional + custoImportValue + (simulation.customizacoes_estimadas || 0);
    const moTotal = simulation.custo_mo_horas * simulation.custo_mo_valor_hora;

    // Tax values
    const taxValue = simulation.faturamento_bruto * (simulation.sales_tax_percent / 100);
    const royaltiesValue = simulation.faturamento_bruto * (simulation.royalties_percent / 100);
    const warrantyValue = simulation.faturamento_bruto * (simulation.warranty_percent / 100);

    // Trade-in
    const tradeInOpPercent = simulation.trade_in_operation_cost_percent ?? 3;
    const tradeInComPercent = simulation.trade_in_commission_percent ?? 5;
    const tradeInReductionPercent = simulation.trade_in_commission_reduction_percent ?? 0.5;

    // MDC calculations
    const mdcAntesTradeIn = hasTradeIn 
      ? simulation.margem_bruta + (simulation.trade_in_total_impact || 0)
      : simulation.margem_bruta;
    const mdcAntesPercent = hasTradeIn
      ? (mdcAntesTradeIn / simulation.faturamento_liquido) * 100
      : simulation.margem_percent;

    // =========================================================================
    // HEADER - Executive banner
    // =========================================================================
    setColor(doc, COLORS.navy, "fill");
    doc.rect(0, 0, pageWidth, 28, "F");
    
    // Gold accent line
    setColor(doc, COLORS.gold, "fill");
    doc.rect(0, 28, pageWidth, 1.5, "F");
    
    // Logo text
    setColor(doc, COLORS.gold);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("OKEAN YACHTS", margin, 14);
    
    // Document number
    setColor(doc, COLORS.white);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(simulation.simulation_number, pageWidth - margin, 12, { align: "right" });
    
    // Date
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(formatDate(simulation.created_at), pageWidth - margin, 18, { align: "right" });

    y = 38;

    // =========================================================================
    // DOCUMENT TITLE & MODEL
    // =========================================================================
    setColor(doc, COLORS.textDark);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("ESTUDO DE VIABILIDADE COMERCIAL", margin, y);
    
    y += 8;
    
    // Model box
    setColor(doc, COLORS.lightGray, "fill");
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "F");
    setColor(doc, COLORS.borderGray, "draw");
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "S");
    
    setColor(doc, COLORS.textMuted);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("MODELO", margin + 4, y + 5);
    
    setColor(doc, COLORS.textDark);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(simulation.yacht_model_name, margin + 4, y + 11);
    
    // Code badge
    setColor(doc, COLORS.navy, "fill");
    doc.roundedRect(pageWidth - margin - 20, y + 4, 16, 6, 1, 1, "F");
    setColor(doc, COLORS.white);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(simulation.yacht_model_code, pageWidth - margin - 12, y + 8, { align: "center" });
    
    // Modalidade badge
    const modBadgeWidth = modalidade.length * 2 + 6;
    setColor(doc, isExporting ? COLORS.blue : COLORS.textMuted, "fill");
    doc.roundedRect(pageWidth - margin - 20 - modBadgeWidth - 4, y + 4, modBadgeWidth, 6, 1, 1, "F");
    setColor(doc, COLORS.white);
    doc.setFontSize(6);
    doc.text(modalidade, pageWidth - margin - 20 - modBadgeWidth / 2 - 4, y + 8, { align: "center" });

    y += 20;

    // =========================================================================
    // HELPER FUNCTIONS
    // =========================================================================
    const drawSectionTitle = (title: string, yPos: number): number => {
      setColor(doc, COLORS.textDark);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(title, margin, yPos);
      
      // Underline
      setColor(doc, COLORS.gold, "draw");
      doc.setLineWidth(0.5);
      doc.line(margin, yPos + 1, margin + 35, yPos + 1);
      
      return yPos + 6;
    };

    const drawTableRow = (
      label: string, 
      value: string, 
      yPos: number, 
      options?: { 
        isNegative?: boolean;
        isBold?: boolean;
        detail?: string;
        labelColor?: ColorDef;
        valueColor?: ColorDef;
      }
    ): number => {
      // Label
      setColor(doc, options?.labelColor || COLORS.textBody);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(label, margin, yPos);
      
      // Detail (smaller, below label)
      if (options?.detail) {
        setColor(doc, COLORS.textMuted);
        doc.setFontSize(6);
        doc.text(options.detail, margin + 2, yPos + 3);
      }
      
      // Value
      setColor(doc, options?.valueColor || (options?.isNegative ? COLORS.red : COLORS.textBody));
      doc.setFontSize(8);
      doc.setFont("helvetica", options?.isBold ? "bold" : "normal");
      const displayValue = options?.isNegative ? `- ${value}` : value;
      doc.text(displayValue, pageWidth - margin, yPos, { align: "right" });
      
      return yPos + (options?.detail ? 6.5 : 4.5);
    };

    const drawSubtotalRow = (
      label: string, 
      value: string, 
      yPos: number,
      options?: { bgColor?: ColorDef; textColor?: ColorDef }
    ): number => {
      const bgColor = options?.bgColor || COLORS.lightGray;
      const textColor = options?.textColor || COLORS.textDark;
      
      setColor(doc, bgColor, "fill");
      doc.roundedRect(margin, yPos - 2.5, contentWidth, 7, 1, 1, "F");
      
      setColor(doc, textColor);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(label, margin + 3, yPos + 1);
      doc.text(value, pageWidth - margin - 3, yPos + 1, { align: "right" });
      
      return yPos + 9;
    };

    const drawDivider = (yPos: number): number => {
      setColor(doc, COLORS.borderGray, "draw");
      doc.setLineWidth(0.2);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      return yPos + 3;
    };

    // =========================================================================
    // SECTION 1: FATURAMENTO
    // =========================================================================
    y = drawSectionTitle("FATURAMENTO", y);
    
    // FAT. BRUTO
    if (isExporting) {
      y = drawTableRow(
        `Faturamento Bruto (${exportCurrency})`,
        formatForeignCurrency(valorExportacao, exportCurrency),
        y,
        { isBold: true }
      );
      y = drawTableRow(
        `Conversão (1 ${exportCurrency} = R$ ${exchangeRate.toFixed(2)})`,
        formatCurrency(simulation.faturamento_bruto),
        y,
        { labelColor: COLORS.textMuted }
      );
    } else {
      y = drawTableRow("Faturamento Bruto", formatCurrency(simulation.faturamento_bruto), y, { isBold: true });
    }
    
    y = drawDivider(y);
    
    // Deductions
    y = drawTableRow(
      `Impostos (${formatPercent(simulation.sales_tax_percent)})`,
      formatCurrency(taxValue),
      y,
      { isNegative: true }
    );
    
    if (isExporting && simulation.transporte_cost > 0) {
      y = drawTableRow("Transporte", formatCurrency(simulation.transporte_cost), y, { isNegative: true });
    }
    
    const adjFactor = simulation.commission_adjustment_factor || 0;
    const comissaoDetail = simulation.adjusted_commission_percent !== null 
      ? "Valor fixo definido"
      : `Base ${simulation.commission_percent.toFixed(1)}% ${adjFactor !== 0 ? (adjFactor >= 0 ? "+" : "") + (adjFactor * 100).toFixed(1) + "% ajuste MDC" : ""}`;
    
    y = drawTableRow(
      `Comissão (${formatPercent(comissaoFinal)})`,
      formatCurrency(comissaoValor),
      y,
      { isNegative: true, detail: comissaoDetail }
    );
    
    y = drawTableRow(
      `Royalties (${formatPercent(simulation.royalties_percent)})`,
      formatCurrency(royaltiesValue),
      y,
      { isNegative: true }
    );
    
    y += 2;
    y = drawSubtotalRow("FATURAMENTO LÍQUIDO", formatCurrency(simulation.faturamento_liquido), y);
    y += 2;

    // =========================================================================
    // SECTION 2: CUSTOS
    // =========================================================================
    y = drawSectionTitle("CUSTOS", y);
    
    y = drawTableRow(
      "Matéria-Prima Importada",
      formatCurrency(mpImportBRL),
      y,
      { detail: `${formatForeignCurrency(simulation.custo_mp_import, simulation.custo_mp_import_currency === "EUR" ? "EUR" : "USD")} × R$ ${(simulation.custo_mp_import_currency === "EUR" ? simulation.eur_rate : simulation.usd_rate).toFixed(2)}` }
    );
    
    y = drawTableRow("Matéria-Prima Nacional", formatCurrency(simulation.custo_mp_nacional), y);
    
    y = drawTableRow(
      `Imposto Importação (${formatPercent(simulation.tax_import_percent)})`,
      formatCurrency(custoImportValue),
      y
    );
    
    if ((simulation.customizacoes_estimadas || 0) > 0) {
      y = drawTableRow("Customizações Estimadas", formatCurrency(simulation.customizacoes_estimadas), y);
    }
    
    y = drawDivider(y);
    
    y = drawSubtotalRow("TOTAL MATÉRIA-PRIMA", formatCurrency(mpTotal), y);
    
    y = drawTableRow(
      "Mão de Obra",
      formatCurrency(moTotal),
      y,
      { detail: `${simulation.custo_mo_horas.toLocaleString("pt-BR")} horas × ${formatCurrency(simulation.custo_mo_valor_hora)}/h` }
    );
    
    y += 2;
    y = drawSubtotalRow("CUSTO DA VENDA", formatCurrency(simulation.custo_venda), y);
    y += 2;

    // =========================================================================
    // SECTION 3: RESULTADO
    // =========================================================================
    y = drawSectionTitle("RESULTADO", y);
    
    y = drawTableRow(
      `Garantia (${formatPercent(simulation.warranty_percent)})`,
      formatCurrency(warrantyValue),
      y,
      { isNegative: true }
    );
    
    y += 3;
    
    // MDC Box - before trade-in
    const mdcColor = getMarginColor(mdcAntesPercent);
    const mdcBgColor = getMarginBgColor(mdcAntesPercent);
    
    setColor(doc, mdcBgColor, "fill");
    doc.roundedRect(margin, y - 1, contentWidth, 12, 2, 2, "F");
    setColor(doc, mdcColor, "draw");
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y - 1, contentWidth, 12, 2, 2, "S");
    
    setColor(doc, COLORS.textDark);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("MARGEM DE CONTRIBUIÇÃO (MDC)", margin + 4, y + 5);
    
    doc.setFontSize(10);
    doc.text(formatCurrency(mdcAntesTradeIn), pageWidth - margin - 35, y + 5);
    
    setColor(doc, mdcColor);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(formatPercent(mdcAntesPercent), pageWidth - margin - 4, y + 6, { align: "right" });
    
    y += 16;

    // =========================================================================
    // SECTION 4: TRADE-IN (if applicable)
    // =========================================================================
    if (hasTradeIn) {
      setColor(doc, COLORS.amberBg, "fill");
      doc.roundedRect(margin, y, contentWidth, 38, 2, 2, "F");
      setColor(doc, COLORS.amber, "draw");
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, contentWidth, 38, 2, 2, "S");
      
      y += 5;
      
      // Trade-In Title
      setColor(doc, COLORS.amber);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("IMPACTO USADO (TRADE-IN)", margin + 4, y);
      
      // Boat info
      const tradeInLabel = `${simulation.trade_in_brand || ""} ${simulation.trade_in_model || ""}${simulation.trade_in_year ? ` (${simulation.trade_in_year})` : ""}`.trim();
      setColor(doc, COLORS.textBody);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(tradeInLabel, pageWidth - margin - 4, y, { align: "right" });
      
      y += 6;
      
      // Values grid
      const col1X = margin + 4;
      const col2X = margin + contentWidth / 2;
      
      setColor(doc, COLORS.textMuted);
      doc.setFontSize(7);
      doc.text("Valor de Entrada", col1X, y);
      doc.text("Valor Real Projetado", col2X, y);
      
      y += 4;
      setColor(doc, COLORS.textDark);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(formatCurrency(simulation.trade_in_entry_value || 0), col1X, y);
      doc.text(formatCurrency(simulation.trade_in_real_value || 0), col2X, y);
      
      y += 6;
      
      // Costs breakdown
      setColor(doc, COLORS.textMuted);
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.text(`Custo Op: ${tradeInOpPercent}%  •  Comissão Usado: ${tradeInComPercent}%  •  Redução Com. Vendedor: ${tradeInReductionPercent}%`, col1X, y);
      
      y += 5;
      
      // Impact breakdown
      setColor(doc, COLORS.red);
      doc.setFontSize(7);
      doc.text(`Depreciação: ${formatCurrency(simulation.trade_in_depreciation || 0)}`, col1X, y);
      doc.text(`Custo Op: ${formatCurrency(simulation.trade_in_operation_cost || 0)}`, col1X + 45, y);
      doc.text(`Comissão: ${formatCurrency(simulation.trade_in_commission || 0)}`, col1X + 90, y);
      
      // Total impact
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(`IMPACTO TOTAL: - ${formatCurrency(simulation.trade_in_total_impact || 0)}`, pageWidth - margin - 4, y, { align: "right" });
      
      y += 6;
      
      // MDC after trade-in
      setColor(doc, COLORS.amber);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(`MDC APÓS IMPACTO: ${formatCurrency(simulation.margem_bruta)} (${formatPercent(simulation.margem_percent)})`, col1X, y);
      
      y += 10;
    }

    // =========================================================================
    // FINAL RESULT BOX
    // =========================================================================
    y += 3;
    
    const finalPercent = simulation.margem_percent;
    const finalColor = getMarginColor(finalPercent);
    
    setColor(doc, COLORS.navy, "fill");
    doc.roundedRect(margin, y, contentWidth, 16, 2, 2, "F");
    
    setColor(doc, COLORS.white);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("RENTABILIDADE FINAL", margin + 6, y + 10);
    
    // Final percentage
    setColor(doc, finalColor, "fill");
    doc.roundedRect(pageWidth - margin - 35, y + 3, 31, 10, 2, 2, "F");
    setColor(doc, COLORS.white);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(formatPercent(finalPercent), pageWidth - margin - 19.5, y + 10.5, { align: "center" });
    
    y += 22;

    // =========================================================================
    // IDENTIFICATION
    // =========================================================================
    setColor(doc, COLORS.lightGray, "fill");
    doc.roundedRect(margin, y, contentWidth, 22, 2, 2, "F");
    
    y += 5;
    
    const idCol1 = margin + 6;
    const idCol2 = margin + contentWidth / 2;
    
    setColor(doc, COLORS.textMuted);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("CLIENTE", idCol1, y);
    doc.text("VENDEDOR", idCol2, y);
    
    y += 4;
    setColor(doc, COLORS.textDark);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(simulation.client_name, idCol1, y);
    doc.text(simulation.commission_name, idCol2, y);
    
    y += 4;
    setColor(doc, COLORS.textMuted);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(`Comissão: ${formatPercent(simulation.commission_percent)}`, idCol2, y);
    
    if (simulation.notes) {
      y += 5;
      setColor(doc, COLORS.textMuted);
      doc.setFontSize(6);
      doc.text("Observações:", idCol1, y);
      const notesWidth = contentWidth - 30;
      const splitNotes = doc.splitTextToSize(simulation.notes, notesWidth);
      doc.text(splitNotes.slice(0, 2).join(" "), idCol1 + 18, y);
    }
    
    y += 10;

    // =========================================================================
    // APPROVALS
    // =========================================================================
    y += 8;
    
    setColor(doc, COLORS.textMuted);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("APROVAÇÕES", margin, y);
    
    y += 10;
    
    const signWidth = (contentWidth - 20) / 3;
    const signY = y;
    const signLabels = ["CEO", "CFO", "Diretor Comercial"];
    
    for (let i = 0; i < 3; i++) {
      const signX = margin + (signWidth + 10) * i;
      
      // Signature line
      setColor(doc, COLORS.borderGray, "draw");
      doc.setLineWidth(0.3);
      doc.line(signX, signY + 10, signX + signWidth, signY + 10);
      
      // Label
      setColor(doc, COLORS.textMuted);
      doc.setFontSize(7);
      doc.text(signLabels[i], signX + signWidth / 2, signY + 15, { align: "center" });
    }

    // =========================================================================
    // FOOTER
    // =========================================================================
    // Gold line
    setColor(doc, COLORS.gold, "fill");
    doc.rect(0, pageHeight - 12, pageWidth, 0.5, "F");
    
    // Footer bar
    setColor(doc, COLORS.navy, "fill");
    doc.rect(0, pageHeight - 11, pageWidth, 11, "F");
    
    // Footer content
    setColor(doc, COLORS.gold);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("OKEAN YACHTS", margin, pageHeight - 4);
    
    setColor(doc, COLORS.white);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(simulation.simulation_number, pageWidth / 2, pageHeight - 4, { align: "center" });
    
    setColor(doc, COLORS.textMuted);
    doc.setFontSize(6);
    doc.text("DOCUMENTO CONFIDENCIAL", pageWidth - margin, pageHeight - 4, { align: "right" });

    // =========================================================================
    // GENERATE & UPLOAD
    // =========================================================================
    const pdfOutput = doc.output("arraybuffer");
    const pdfBuffer = new Uint8Array(pdfOutput);

    const fileName = `simulation-${simulation.simulation_number}.pdf`;
    const filePath = `simulations/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("quotation-pdfs")
      .upload(filePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Erro ao fazer upload do PDF:", uploadError);
      throw new Error("Erro ao salvar PDF");
    }

    const { data: urlData } = supabase.storage
      .from("quotation-pdfs")
      .getPublicUrl(filePath);

    console.log("PDF executivo gerado com sucesso:", urlData.publicUrl);

    return new Response(
      JSON.stringify({ pdfUrl: urlData.publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
