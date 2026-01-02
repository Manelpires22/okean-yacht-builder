import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Colors matching MDC panel
const COLORS = {
  navy: { r: 15, g: 23, b: 42 },
  gold: { r: 212, g: 175, b: 55 },
  white: { r: 255, g: 255, b: 255 },
  lightGray: { r: 248, g: 250, b: 252 },
  mediumGray: { r: 100, g: 116, b: 139 },
  darkText: { r: 30, g: 41, b: 59 },
  green: { r: 22, g: 163, b: 74 },
  greenLight: { r: 220, g: 252, b: 231 },
  red: { r: 220, g: 38, b: 38 },
  amber: { r: 217, g: 119, b: 6 },
  amberLight: { r: 254, g: 243, b: 199 },
  blue: { r: 59, g: 130, b: 246 },
  mutedBg: { r: 241, g: 245, b: 249 },
};

type ColorDef = { r: number; g: number; b: number };

function setColor(doc: jsPDF, color: ColorDef, type: "fill" | "text" | "draw" = "text") {
  if (type === "fill") doc.setFillColor(color.r, color.g, color.b);
  else if (type === "draw") doc.setDrawColor(color.r, color.g, color.b);
  else doc.setTextColor(color.r, color.g, color.b);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
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

function getMarginColor(percent: number): ColorDef {
  if (percent >= 25) return COLORS.green;
  if (percent >= 15) return COLORS.amber;
  return COLORS.red;
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

    // Buscar simulação
    const { data: simulation, error } = await supabase
      .from("simulations")
      .select("*")
      .eq("id", simulationId)
      .single();

    if (error || !simulation) {
      throw new Error("Simulação não encontrada");
    }

    console.log("Gerando PDF para simulação:", simulation.simulation_number);

    // Criar PDF A4
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // Helper: Calculate values
    const isExporting = simulation.is_exporting ?? false;
    const hasTradeIn = simulation.has_trade_in ?? false;
    const exportCurrency = simulation.export_currency || "USD";
    const exchangeRate = exportCurrency === "USD" ? simulation.usd_rate : simulation.eur_rate;
    const valorExportacao = isExporting && exchangeRate > 0 ? simulation.faturamento_bruto / exchangeRate : 0;
    const modalidade = isExporting ? "CIF" : "FOB";

    // Commission calculations
    const cashValue = hasTradeIn 
      ? simulation.faturamento_bruto - (simulation.trade_in_entry_value || 0)
      : simulation.faturamento_bruto;
    const comissaoFinal = simulation.adjusted_commission_percent !== null
      ? simulation.adjusted_commission_percent
      : simulation.commission_percent * (1 + (simulation.commission_adjustment_factor || 0));
    const comissaoValor = (comissaoFinal / 100) * cashValue;
    const marginColor = getMarginColor(simulation.margem_percent);

    // Costs calculations
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

    // Trade-in percentages (use saved values or defaults)
    const tradeInOpPercent = simulation.trade_in_operation_cost_percent ?? 3;
    const tradeInComPercent = simulation.trade_in_commission_percent ?? 5;
    const tradeInReductionPercent = simulation.trade_in_commission_reduction_percent ?? 0.5;

    // === HEADER ===
    setColor(doc, COLORS.navy, "fill");
    doc.rect(0, 0, pageWidth, 32, "F");
    
    setColor(doc, COLORS.gold);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("OKEAN YACHTS", margin, 12);
    
    doc.setFontSize(10);
    doc.text("SIMULAÇÃO DE VIABILIDADE", margin, 19);
    
    setColor(doc, COLORS.white);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(simulation.simulation_number, pageWidth - margin, 12, { align: "right" });
    doc.setFontSize(8);
    doc.text(formatDate(simulation.created_at), pageWidth - margin, 19, { align: "right" });

    // Badges no header
    let badgeX = margin;
    
    // Margin badge
    setColor(doc, marginColor, "fill");
    doc.roundedRect(badgeX, 24, 18, 5, 1, 1, "F");
    setColor(doc, COLORS.white);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(`${simulation.margem_percent.toFixed(1)}%`, badgeX + 9, 27.5, { align: "center" });
    badgeX += 20;

    // CIF/FOB badge
    setColor(doc, isExporting ? COLORS.blue : COLORS.mediumGray, "fill");
    doc.roundedRect(badgeX, 24, 10, 5, 1, 1, "F");
    setColor(doc, COLORS.white);
    doc.text(modalidade, badgeX + 5, 27.5, { align: "center" });
    badgeX += 12;

    // Trade-In badge
    if (hasTradeIn) {
      setColor(doc, COLORS.amber, "fill");
      doc.roundedRect(badgeX, 24, 16, 5, 1, 1, "F");
      setColor(doc, COLORS.white);
      doc.text("Trade-In", badgeX + 8, 27.5, { align: "center" });
    }

    y = 38;

    // === MODEL HIGHLIGHT BOX ===
    setColor(doc, COLORS.lightGray, "fill");
    doc.roundedRect(margin, y, contentWidth, 12, 2, 2, "F");
    setColor(doc, COLORS.navy, "draw");
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, 12, 2, 2, "S");
    
    setColor(doc, COLORS.mediumGray);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("MODELO:", margin + 3, y + 4);
    
    setColor(doc, COLORS.navy);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${simulation.yacht_model_name} (${simulation.yacht_model_code})`, margin + 20, y + 8);
    
    y = 54;

    // Helper functions
    const drawSectionHeader = (title: string, yPos: number): number => {
      setColor(doc, COLORS.navy);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(title.toUpperCase(), margin, yPos);
      setColor(doc, COLORS.gold, "draw");
      doc.setLineWidth(0.4);
      doc.line(margin, yPos + 1.5, margin + contentWidth, yPos + 1.5);
      return yPos + 5;
    };

    const drawLine = (label: string, value: string, yPos: number, options?: { 
      valueColor?: ColorDef, 
      detail?: string,
      negative?: boolean,
      bold?: boolean 
    }): number => {
      setColor(doc, COLORS.darkText);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(label, margin, yPos);
      
      if (options?.detail) {
        setColor(doc, COLORS.mediumGray);
        doc.setFontSize(6);
        doc.text(options.detail, margin + 2, yPos + 3);
      }
      
      setColor(doc, options?.valueColor || COLORS.darkText);
      doc.setFontSize(8);
      doc.setFont("helvetica", options?.bold ? "bold" : "normal");
      const displayValue = options?.negative ? `- ${value}` : value;
      doc.text(displayValue, pageWidth - margin, yPos, { align: "right" });
      
      return yPos + (options?.detail ? 6 : 4);
    };

    const drawSubtotal = (label: string, value: string, yPos: number, options?: { 
      bgColor?: ColorDef,
      textColor?: ColorDef 
    }): number => {
      const bgColor = options?.bgColor || COLORS.mutedBg;
      const textColor = options?.textColor || COLORS.darkText;
      
      setColor(doc, bgColor, "fill");
      doc.roundedRect(margin, yPos - 2.5, contentWidth, 7, 1, 1, "F");
      
      setColor(doc, textColor);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(label, margin + 2, yPos + 1);
      doc.text(value, pageWidth - margin - 2, yPos + 1, { align: "right" });
      
      return yPos + 8;
    };

    // === FATURAMENTO ===
    y = drawSectionHeader("Faturamento", y);
    
    // FAT. BRUTO with export currency
    if (isExporting) {
      setColor(doc, COLORS.darkText);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`FAT. BRUTO (${exportCurrency})`, margin, y);
      doc.setFont("helvetica", "bold");
      doc.text(formatForeignCurrency(valorExportacao, exportCurrency), pageWidth - margin, y, { align: "right" });
      y += 4;
      
      setColor(doc, COLORS.mediumGray);
      doc.setFontSize(7);
      doc.text(`Taxa: 1 ${exportCurrency} = R$ ${exchangeRate.toFixed(2)}`, margin, y);
      doc.text(`≈ ${formatCurrency(simulation.faturamento_bruto)}`, pageWidth - margin, y, { align: "right" });
      y += 5;
    } else {
      y = drawLine("FAT. BRUTO (BRL)", formatCurrency(simulation.faturamento_bruto), y, { bold: true });
    }
    
    y += 1;

    // TAX
    y = drawLine(`TAX (${simulation.sales_tax_percent.toFixed(2)}%)`, formatCurrency(taxValue), y, { 
      negative: taxValue > 0,
      valueColor: taxValue > 0 ? COLORS.red : COLORS.darkText 
    });

    // TRANSPORTE (only for export)
    if (isExporting) {
      y = drawLine("TRANSPORTE", formatCurrency(simulation.transporte_cost || 0), y, { 
        negative: true,
        valueColor: COLORS.red 
      });
    }

    // COMISSÃO with details
    const adjFactor = simulation.commission_adjustment_factor || 0;
    const comissaoDetail = simulation.adjusted_commission_percent !== null 
      ? "valor fixo (ajuste MDC ignorado)"
      : `base: ${simulation.commission_percent.toFixed(2)}%, ajuste: ${adjFactor >= 0 ? "+" : ""}${(adjFactor * 100).toFixed(2)}%`;
    
    y = drawLine(`COMISSÃO (${comissaoFinal.toFixed(2)}%)`, formatCurrency(comissaoValor), y, { 
      negative: true,
      valueColor: COLORS.red,
      detail: comissaoDetail
    });
    y += 1;

    // ROYALTIES
    y = drawLine(`ROYALTIES (${simulation.royalties_percent.toFixed(2)}%)`, formatCurrency(royaltiesValue), y, { 
      negative: true,
      valueColor: COLORS.red 
    });
    
    y += 2;
    
    // FATURAMENTO LÍQUIDO subtotal
    y = drawSubtotal("FATURAMENTO LÍQ.", formatCurrency(simulation.faturamento_liquido), y);
    y += 2;

    // === CUSTOS ===
    y = drawSectionHeader("Custos", y);
    
    // MATÉRIA PRIMA LIQ.
    const mpSymbol = simulation.custo_mp_import_currency === "EUR" ? "€" : "$";
    y = drawLine("MATÉRIA PRIMA LIQ.", formatCurrency(mpImportBRL + simulation.custo_mp_nacional), y, {
      detail: `MP Import (${formatCurrency(mpImportBRL)}) + MP Nacional (${formatCurrency(simulation.custo_mp_nacional)})`
    });
    y += 1;

    // CUSTO IMPORT
    y = drawLine(`CUSTO IMPORT (${simulation.tax_import_percent.toFixed(2)}%)`, formatCurrency(custoImportValue), y);

    // CUSTOMIZAÇÕES EST.
    y = drawLine("CUSTOMIZAÇÕES EST.", formatCurrency(simulation.customizacoes_estimadas || 0), y);
    
    y += 2;
    
    // MATÉRIA PRIMA TOTAL subtotal
    y = drawSubtotal("MATÉRIA PRIMA TOTAL", formatCurrency(mpTotal), y);

    // MÃO-DE-OBRA
    y = drawLine("MÃO-DE-OBRA", formatCurrency(moTotal), y, {
      detail: `${simulation.custo_mo_horas.toLocaleString()}h × ${formatCurrency(simulation.custo_mo_valor_hora)}`
    });
    y += 3;
    
    // CUSTO DA VENDA subtotal
    y = drawSubtotal("CUSTO DA VENDA", formatCurrency(simulation.custo_venda), y);
    y += 2;

    // === RESULTADO ===
    y = drawSectionHeader("Resultado", y);

    // GARANTIA
    y = drawLine(`GARANTIA (${simulation.warranty_percent.toFixed(2)}%)`, formatCurrency(warrantyValue), y, { 
      negative: true,
      valueColor: COLORS.red 
    });
    y += 2;

    // MARGEM BRUTA (MDC) - highlighted box
    setColor(doc, COLORS.mutedBg, "fill");
    doc.roundedRect(margin, y - 1, contentWidth, 10, 1, 1, "F");
    
    setColor(doc, COLORS.darkText);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("MARGEM BRUTA (MDC)", margin + 3, y + 4);
    
    doc.setFontSize(10);
    doc.text(formatCurrency(simulation.margem_bruta), pageWidth - margin - 40, y + 4);
    
    setColor(doc, marginColor);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`${simulation.margem_percent.toFixed(2)}%`, pageWidth - margin - 3, y + 5, { align: "right" });
    
    y += 13;

    // === TRADE-IN ===
    if (hasTradeIn) {
      setColor(doc, COLORS.amberLight, "fill");
      doc.roundedRect(margin, y, contentWidth, 32, 2, 2, "F");
      setColor(doc, COLORS.amber, "draw");
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, contentWidth, 32, 2, 2, "S");
      
      y += 4;
      setColor(doc, COLORS.amber);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("TRADE-IN", margin + 3, y);
      
      // Boat info
      const tradeInLabel = `${simulation.trade_in_brand || ""} ${simulation.trade_in_model || ""}${simulation.trade_in_year ? ` (${simulation.trade_in_year})` : ""}`;
      setColor(doc, COLORS.darkText);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(tradeInLabel, margin + 25, y);
      
      y += 5;
      
      // Valores - Entrada e Real Projetado
      setColor(doc, COLORS.darkText);
      doc.setFontSize(7);
      doc.text("Valor de Entrada:", margin + 3, y);
      doc.setFont("helvetica", "bold");
      doc.text(formatCurrency(simulation.trade_in_entry_value || 0), margin + 35, y);
      
      doc.setFont("helvetica", "normal");
      doc.text("Valor Real Projetado:", margin + 75, y);
      doc.setFont("helvetica", "bold");
      doc.text(formatCurrency(simulation.trade_in_real_value || 0), margin + 115, y);
      
      y += 5;
      
      // Regras Aplicadas
      setColor(doc, COLORS.mediumGray);
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.text(`Custo Op: ${tradeInOpPercent}%  |  Comissão Usado: ${tradeInComPercent}%  |  Redução Com. Vendedor: ${tradeInReductionPercent}%`, margin + 3, y);
      
      y += 5;
      
      // Impacto
      setColor(doc, COLORS.red);
      doc.setFontSize(7);
      doc.text(`Depreciação: ${formatCurrency(simulation.trade_in_depreciation || 0)}`, margin + 3, y);
      doc.text(`Op: ${formatCurrency(simulation.trade_in_operation_cost || 0)}`, margin + 50, y);
      doc.text(`Com: ${formatCurrency(simulation.trade_in_commission || 0)}`, margin + 85, y);
      
      doc.setFont("helvetica", "bold");
      doc.text(`IMPACTO TOTAL: - ${formatCurrency(simulation.trade_in_total_impact || 0)}`, margin + 115, y);
      
      y += 5;
      
      // MDC após impacto
      const mdcAposImpacto = simulation.margem_bruta - (simulation.trade_in_total_impact || 0);
      const mdcAposPercent = (mdcAposImpacto / simulation.faturamento_liquido) * 100;
      setColor(doc, COLORS.amber);
      doc.setFontSize(7);
      doc.text(`MDC APÓS IMPACTO: ${formatCurrency(mdcAposImpacto)} (${mdcAposPercent.toFixed(2)}%)`, margin + 3, y);
      
      y += 8;
    }

    // === BOX FINAL - % Margem sobre Faturamento Líquido ===
    y += 2;
    const finalMarginPercent = hasTradeIn 
      ? ((simulation.margem_bruta - (simulation.trade_in_total_impact || 0)) / simulation.faturamento_liquido) * 100
      : simulation.margem_percent;
    const finalMarginColor = getMarginColor(finalMarginPercent);
    
    setColor(doc, finalMarginColor === COLORS.green ? COLORS.greenLight : COLORS.mutedBg, "fill");
    doc.roundedRect(margin, y, contentWidth, 12, 2, 2, "F");
    setColor(doc, finalMarginColor, "draw");
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, y, contentWidth, 12, 2, 2, "S");
    
    setColor(doc, finalMarginColor);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("% MARGEM SOBRE FATURAMENTO LÍQUIDO", margin + 5, y + 7);
    
    doc.setFontSize(14);
    doc.text(`${finalMarginPercent.toFixed(2)}%`, pageWidth - margin - 5, y + 8, { align: "right" });
    
    y += 17;

    // === IDENTIFICAÇÃO ===
    setColor(doc, COLORS.lightGray, "fill");
    doc.roundedRect(margin, y, contentWidth, 18, 1, 1, "F");
    y += 4;
    
    setColor(doc, COLORS.mediumGray);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Cliente", margin + 3, y);
    doc.text("Vendedor", margin + 70, y);
    
    setColor(doc, COLORS.darkText);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(simulation.client_name, margin + 3, y + 4);
    doc.text(`${simulation.commission_name} (${simulation.commission_percent}%)`, margin + 70, y + 4);
    
    if (simulation.notes) {
      y += 8;
      setColor(doc, COLORS.mediumGray);
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.text("Obs:", margin + 3, y);
      const notesWidth = contentWidth - 15;
      const splitNotes = doc.splitTextToSize(simulation.notes, notesWidth);
      doc.text(splitNotes.slice(0, 2).join(" "), margin + 12, y); // Max 2 lines
    }
    
    y += 8;

    // === ÁREA DE ASSINATURAS ===
    y += 5;
    
    setColor(doc, COLORS.mediumGray);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("APROVAÇÕES", margin, y);
    
    y += 8;
    
    const signWidth = (contentWidth - 10) / 3;
    const signY = y;
    
    // Três linhas de assinatura
    for (let i = 0; i < 3; i++) {
      const signX = margin + (signWidth + 5) * i;
      setColor(doc, COLORS.mediumGray, "draw");
      doc.setLineWidth(0.2);
      doc.line(signX, signY + 8, signX + signWidth, signY + 8);
    }
    
    setColor(doc, COLORS.mediumGray);
    doc.setFontSize(7);
    doc.text("CEO", margin + signWidth / 2, signY + 12, { align: "center" });
    doc.text("CFO", margin + signWidth + 5 + signWidth / 2, signY + 12, { align: "center" });
    doc.text("Dir. Comercial", margin + (signWidth + 5) * 2 + signWidth / 2, signY + 12, { align: "center" });

    // === FOOTER ===
    setColor(doc, COLORS.navy, "fill");
    doc.rect(0, pageHeight - 10, pageWidth, 10, "F");
    
    setColor(doc, COLORS.gold);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("OKEAN YACHTS", margin, pageHeight - 4);
    
    setColor(doc, COLORS.white);
    doc.setFont("helvetica", "normal");
    doc.text(simulation.simulation_number, pageWidth / 2, pageHeight - 4, { align: "center" });
    
    setColor(doc, COLORS.mediumGray);
    doc.text("Documento Confidencial", pageWidth - margin, pageHeight - 4, { align: "right" });

    // Gerar PDF
    const pdfOutput = doc.output("arraybuffer");
    const pdfBuffer = new Uint8Array(pdfOutput);

    // Upload para storage
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

    // Gerar URL pública
    const { data: urlData } = supabase.storage
      .from("quotation-pdfs")
      .getPublicUrl(filePath);

    console.log("PDF gerado com sucesso:", urlData.publicUrl);

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
