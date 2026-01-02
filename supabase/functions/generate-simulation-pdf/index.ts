import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Colors
const COLORS = {
  navy: { r: 15, g: 23, b: 42 },
  gold: { r: 212, g: 175, b: 55 },
  white: { r: 255, g: 255, b: 255 },
  lightGray: { r: 248, g: 250, b: 252 },
  mediumGray: { r: 100, g: 116, b: 139 },
  darkText: { r: 30, g: 41, b: 59 },
  green: { r: 22, g: 163, b: 74 },
  red: { r: 220, g: 38, b: 38 },
  amber: { r: 217, g: 119, b: 6 },
  blue: { r: 59, g: 130, b: 246 },
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
    minimumFractionDigits: 2 
  }).format(value);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

    // === HEADER ===
    setColor(doc, COLORS.navy, "fill");
    doc.rect(0, 0, pageWidth, 35, "F");
    
    setColor(doc, COLORS.gold);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("OKEAN YACHTS", margin, 15);
    
    doc.setFontSize(11);
    doc.text("SIMULAÇÃO DE VIABILIDADE", margin, 23);
    
    setColor(doc, COLORS.white);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(simulation.simulation_number, pageWidth - margin, 15, { align: "right" });
    doc.setFontSize(9);
    doc.text(formatDate(simulation.created_at), pageWidth - margin, 22, { align: "right" });

    // Badges no header
    const marginPercent = simulation.margem_percent;
    const marginColor = getMarginColor(marginPercent);
    const isExporting = simulation.is_exporting ?? false;
    const modalidade = isExporting ? "CIF" : "FOB";

    // Margin badge
    setColor(doc, marginColor, "fill");
    doc.roundedRect(margin, 27, 25, 6, 1, 1, "F");
    setColor(doc, COLORS.white);
    doc.setFontSize(8);
    doc.text(`${marginPercent.toFixed(1)}%`, margin + 12.5, 31, { align: "center" });

    // CIF/FOB badge
    setColor(doc, isExporting ? COLORS.blue : COLORS.mediumGray, "fill");
    doc.roundedRect(margin + 28, 27, 12, 6, 1, 1, "F");
    setColor(doc, COLORS.white);
    doc.text(modalidade, margin + 34, 31, { align: "center" });

    // Trade-In badge
    if (simulation.has_trade_in) {
      setColor(doc, COLORS.amber, "fill");
      doc.roundedRect(margin + 43, 27, 18, 6, 1, 1, "F");
      setColor(doc, COLORS.white);
      doc.text("Trade-In", margin + 52, 31, { align: "center" });
    }

    y = 42;

    // Helper function para seções
    const drawSectionHeader = (title: string, yPos: number): number => {
      setColor(doc, COLORS.navy);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(title.toUpperCase(), margin, yPos);
      setColor(doc, COLORS.gold, "draw");
      doc.setLineWidth(0.5);
      doc.line(margin, yPos + 1.5, margin + contentWidth, yPos + 1.5);
      return yPos + 6;
    };

    const drawLabelValue = (label: string, value: string, x: number, yPos: number, valueColor?: ColorDef): number => {
      setColor(doc, COLORS.mediumGray);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(label, x, yPos);
      
      setColor(doc, valueColor || COLORS.darkText);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(value, x, yPos + 4);
      return yPos + 9;
    };

    // === IDENTIFICAÇÃO ===
    y = drawSectionHeader("Identificação", y);
    const col1 = margin;
    const col2 = margin + contentWidth / 2;

    drawLabelValue("Cliente", simulation.client_name, col1, y);
    drawLabelValue("Modelo", `${simulation.yacht_model_code} - ${simulation.yacht_model_name}`, col2, y);
    y += 10;
    drawLabelValue("Vendedor", `${simulation.commission_name} (${simulation.commission_percent}%)`, col1, y);
    drawLabelValue("Data", formatDate(simulation.created_at), col2, y);
    y += 12;

    // === VALOR DE VENDA ===
    y = drawSectionHeader("Valor de Venda", y);
    
    drawLabelValue("Faturamento Bruto (BRL)", formatCurrency(simulation.faturamento_bruto), col1, y);
    
    if (isExporting) {
      const exportCurrency = simulation.export_currency || "USD";
      const exchangeRate = exportCurrency === "USD" ? simulation.usd_rate : simulation.eur_rate;
      const valorExportacao = simulation.faturamento_bruto / exchangeRate;
      drawLabelValue(
        `Valor em ${exportCurrency} (câmbio: ${exchangeRate.toFixed(4)})`,
        formatForeignCurrency(valorExportacao, exportCurrency),
        col2, y
      );
    } else {
      drawLabelValue("Modalidade", "FOB (transporte não incluído)", col2, y);
    }
    y += 10;

    if (isExporting && simulation.export_country) {
      drawLabelValue("País Destino", simulation.export_country, col1, y);
      drawLabelValue("Modalidade", "CIF (transporte incluído)", col2, y);
      y += 10;
    }
    y += 2;

    // === COMISSÃO FINAL ===
    setColor(doc, COLORS.lightGray, "fill");
    doc.roundedRect(margin, y, contentWidth, 22, 2, 2, "F");
    y += 2;
    y = drawSectionHeader("Comissão Final a Pagar", y);

    const hasTradeIn = simulation.has_trade_in ?? false;
    const cashValue = hasTradeIn 
      ? simulation.faturamento_bruto - (simulation.trade_in_entry_value || 0)
      : simulation.faturamento_bruto;

    const comissaoFinal = simulation.adjusted_commission_percent !== null
      ? simulation.adjusted_commission_percent
      : simulation.commission_percent * (1 + (simulation.commission_adjustment_factor || 0));
    const comissaoValor = (comissaoFinal / 100) * cashValue;

    const col3 = margin + contentWidth * 2 / 3;
    
    drawLabelValue("Comissão Base", `${simulation.commission_percent.toFixed(2)}%`, col1, y);
    
    if (simulation.adjusted_commission_percent !== null) {
      drawLabelValue("Ajuste MDC", "Manual (fixo)", col2, y, COLORS.amber);
    } else {
      const adjFactor = simulation.commission_adjustment_factor || 0;
      const adjColor = adjFactor >= 0 ? COLORS.green : COLORS.red;
      drawLabelValue("Ajuste MDC", `${adjFactor >= 0 ? "+" : ""}${(adjFactor * 100).toFixed(1)}%`, col2, y, adjColor);
    }
    
    setColor(doc, COLORS.mediumGray);
    doc.setFontSize(7);
    doc.text("COMISSÃO FINAL", col3, y);
    setColor(doc, COLORS.navy);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`${comissaoFinal.toFixed(2)}%`, col3, y + 5);
    doc.setFontSize(9);
    doc.text(formatCurrency(comissaoValor), col3, y + 10);
    
    if (hasTradeIn) {
      setColor(doc, COLORS.amber);
      doc.setFontSize(7);
      doc.text(`(sobre cash: ${formatCurrency(cashValue)})`, col3, y + 14);
    }
    
    y += 20;

    // === TAXAS E CUSTOS (duas colunas) ===
    y = drawSectionHeader("Taxas Aplicadas", y);
    
    const taxCol1 = margin;
    const taxCol2 = margin + 35;
    const taxCol3 = margin + 70;
    const taxCol4 = margin + 105;
    
    setColor(doc, COLORS.mediumGray);
    doc.setFontSize(7);
    doc.text("Imposto Venda", taxCol1, y);
    doc.text("Garantia", taxCol2, y);
    doc.text("Royalties", taxCol3, y);
    doc.text("Tax Importação", taxCol4, y);
    
    setColor(doc, COLORS.darkText);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`${simulation.sales_tax_percent}%`, taxCol1, y + 4);
    doc.text(`${simulation.warranty_percent}%`, taxCol2, y + 4);
    doc.text(`${simulation.royalties_percent}%`, taxCol3, y + 4);
    doc.text(`${simulation.tax_import_percent}%`, taxCol4, y + 4);
    
    y += 12;

    // === CUSTOS DO MODELO ===
    y = drawSectionHeader("Custos do Modelo", y);
    
    const mpSymbol = simulation.custo_mp_import_currency === "EUR" ? "€" : "$";
    drawLabelValue(
      `MP Importada (${simulation.custo_mp_import_currency})`,
      `${mpSymbol} ${simulation.custo_mp_import.toLocaleString()}`,
      col1, y
    );
    drawLabelValue("MP Nacional", formatCurrency(simulation.custo_mp_nacional), col2, y);
    y += 10;
    
    drawLabelValue(
      "Mão de Obra",
      `${simulation.custo_mo_horas}h × ${formatCurrency(simulation.custo_mo_valor_hora)}`,
      col1, y
    );
    drawLabelValue(
      "Câmbio",
      `EUR: ${simulation.eur_rate.toFixed(2)} | USD: ${simulation.usd_rate.toFixed(2)}`,
      col2, y
    );
    y += 10;
    
    if (simulation.transporte_cost || simulation.customizacoes_estimadas) {
      drawLabelValue("Transporte", formatCurrency(simulation.transporte_cost || 0), col1, y);
      drawLabelValue("Customizações Est.", formatCurrency(simulation.customizacoes_estimadas || 0), col2, y);
      y += 10;
    }
    y += 2;

    // === TRADE-IN ===
    if (hasTradeIn) {
      setColor(doc, { r: 254, g: 243, b: 199 }, "fill"); // amber-100
      doc.roundedRect(margin, y, contentWidth, 28, 2, 2, "F");
      setColor(doc, COLORS.amber, "draw");
      doc.roundedRect(margin, y, contentWidth, 28, 2, 2, "S");
      
      y += 3;
      setColor(doc, COLORS.amber);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("TRADE-IN DE BARCO USADO", margin + 3, y + 3);
      y += 6;

      const tradeInLabel = `${simulation.trade_in_brand || ""} ${simulation.trade_in_model || ""}${simulation.trade_in_year ? ` (${simulation.trade_in_year})` : ""}`;
      
      setColor(doc, COLORS.darkText);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`Barco: ${tradeInLabel}`, margin + 3, y + 3);
      doc.text(`Entrada: ${formatCurrency(simulation.trade_in_entry_value || 0)}`, margin + 80, y + 3);
      doc.text(`Real: ${formatCurrency(simulation.trade_in_real_value || 0)}`, margin + 130, y + 3);
      y += 7;

      setColor(doc, COLORS.red);
      doc.setFontSize(7);
      doc.text(`Deprec: ${formatCurrency(simulation.trade_in_depreciation || 0)}`, margin + 3, y + 3);
      doc.text(`Op(3%): ${formatCurrency(simulation.trade_in_operation_cost || 0)}`, margin + 45, y + 3);
      doc.text(`Com(5%): ${formatCurrency(simulation.trade_in_commission || 0)}`, margin + 85, y + 3);
      doc.setFont("helvetica", "bold");
      doc.text(`IMPACTO: ${formatCurrency(simulation.trade_in_total_impact || 0)}`, margin + 125, y + 3);
      
      y += 15;
    }

    // === RESULTADO ===
    setColor(doc, COLORS.navy, "fill");
    doc.roundedRect(margin, y, contentWidth, 30, 2, 2, "F");
    y += 3;
    
    setColor(doc, COLORS.gold);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("RESULTADO FINANCEIRO", margin + 3, y + 4);
    y += 8;

    const resCol1 = margin + 5;
    const resCol2 = margin + 50;
    const resCol3 = margin + 95;
    const resCol4 = margin + 140;

    setColor(doc, COLORS.mediumGray);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Fat. Líquido", resCol1, y);
    doc.text("Custo Venda", resCol2, y);
    doc.text("Margem Bruta", resCol3, y);
    doc.text("Margem %", resCol4, y);
    
    setColor(doc, COLORS.white);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(simulation.faturamento_liquido), resCol1, y + 5);
    doc.text(formatCurrency(simulation.custo_venda), resCol2, y + 5);
    doc.text(formatCurrency(simulation.margem_bruta), resCol3, y + 5);
    
    setColor(doc, marginColor);
    doc.setFontSize(14);
    doc.text(`${simulation.margem_percent.toFixed(1)}%`, resCol4, y + 6);
    
    y += 20;

    // === OBSERVAÇÕES ===
    if (simulation.notes) {
      y += 3;
      y = drawSectionHeader("Observações", y);
      setColor(doc, COLORS.darkText);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const splitNotes = doc.splitTextToSize(simulation.notes, contentWidth);
      doc.text(splitNotes, margin, y);
      y += splitNotes.length * 4;
    }

    // === FOOTER ===
    setColor(doc, COLORS.lightGray, "fill");
    doc.rect(0, pageHeight - 12, pageWidth, 12, "F");
    
    setColor(doc, COLORS.mediumGray);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("OKEAN YACHTS", margin, pageHeight - 5);
    doc.text(simulation.simulation_number, pageWidth / 2, pageHeight - 5, { align: "center" });
    doc.text("Documento Confidencial", pageWidth - margin, pageHeight - 5, { align: "right" });

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
