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
  gold: { r: 197, g: 162, b: 99 },
  goldLight: { r: 218, g: 190, b: 140 },
  white: { r: 255, g: 255, b: 255 },
  champagne: { r: 250, g: 248, b: 244 },
  platinum: { r: 235, g: 235, b: 232 },
  textDark: { r: 30, g: 30, b: 35 },
  textMuted: { r: 100, g: 100, b: 105 },
  textLight: { r: 255, g: 255, b: 255 },
};

function setupFont(doc: jsPDF, style: "normal" | "bold" | "italic" = "normal") {
  doc.setFont("helvetica", style);
}

function setColor(doc: jsPDF, color: ColorDef, type: "fill" | "text" | "draw" = "text") {
  if (type === "fill") doc.setFillColor(color.r, color.g, color.b);
  else if (type === "draw") doc.setDrawColor(color.r, color.g, color.b);
  else doc.setTextColor(color.r, color.g, color.b);
}

// ===== CLEAN STYLE RENDERER =====
interface CleanRenderer {
  drawHeader(doc: jsPDF, pageW: number, margin: number): number;
  drawSectionTitle(doc: jsPDF, title: string, yPos: number, margin: number, pageW: number): number;
  drawInfoRow(doc: jsPDF, label: string, value: string, yPos: number, margin: number, labelWidth?: number): number;
  drawDivider(doc: jsPDF, yPos: number, margin: number, pageW: number): number;
  drawFooter(doc: jsPDF, pageNum: number, totalPages: number, pageW: number, pageH: number, documentRef: string, margin: number): void;
}

const cleanRenderer: CleanRenderer = {
  drawHeader(doc, pageW, margin) {
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
  
  drawSectionTitle(doc, title, yPos, margin, pageW) {
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
  
  drawInfoRow(doc, label, value, yPos, margin, labelWidth = 55) {
    doc.setFontSize(10);
    setupFont(doc, "bold");
    setColor(doc, CLEAN_COLORS.gray);
    doc.text(label + ":", margin, yPos);
    setupFont(doc, "normal");
    setColor(doc, CLEAN_COLORS.black);
    doc.text(value, margin + labelWidth, yPos);
    return yPos + 6;
  },
  
  drawDivider(doc, yPos, margin, pageW) {
    setColor(doc, CLEAN_COLORS.lightGray, "draw");
    doc.setLineWidth(0.2);
    doc.line(margin, yPos, pageW - margin, yPos);
    return yPos + 8;
  },
  
  drawFooter(doc, pageNum, totalPages, pageW, pageH, documentRef, margin) {
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

// ===== PREMIUM STYLE RENDERER =====
interface PremiumRenderer {
  drawHeader(doc: jsPDF, title: string, pageW: number, margin: number): number;
  drawSectionTitle(doc: jsPDF, title: string, yPos: number, margin: number): number;
  drawInfoRow(doc: jsPDF, label: string, value: string, yPos: number, margin: number, labelWidth?: number): number;
  drawBox(doc: jsPDF, x: number, y: number, w: number, h: number, style?: string): void;
  drawFooter(doc: jsPDF, pageNum: number, totalPages: number, pageW: number, pageH: number, documentRef: string, margin: number): void;
}

const premiumRenderer: PremiumRenderer = {
  drawHeader(doc, title, pageW, margin) {
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
  },
  
  drawSectionTitle(doc, title, yPos, margin) {
    doc.setFontSize(14);
    setupFont(doc, "bold");
    setColor(doc, PREMIUM_COLORS.navy);
    doc.text(title, margin, yPos);
    yPos += 5;
    setColor(doc, PREMIUM_COLORS.gold, "draw");
    doc.setLineWidth(0.8);
    doc.line(margin, yPos, margin + 60, yPos);
    return yPos + 10;
  },
  
  drawInfoRow(doc, label, value, yPos, margin, labelWidth = 55) {
    doc.setFontSize(11);
    setupFont(doc, "bold");
    setColor(doc, PREMIUM_COLORS.textMuted);
    doc.text(label + ":", margin, yPos);
    setupFont(doc, "normal");
    setColor(doc, PREMIUM_COLORS.textDark);
    doc.text(value, margin + labelWidth, yPos);
    return yPos + 8;
  },
  
  drawBox(doc, x, y, w, h, style = "light") {
    if (style === "dark") setColor(doc, PREMIUM_COLORS.navy, "fill");
    else setColor(doc, PREMIUM_COLORS.champagne, "fill");
    doc.roundedRect(x, y, w, h, 3, 3, "F");
    setColor(doc, PREMIUM_COLORS.platinum, "draw");
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, 3, 3, "S");
  },
  
  drawFooter(doc, pageNum, totalPages, pageW, pageH, documentRef, margin) {
    const footerY = pageH - 15;
    setColor(doc, PREMIUM_COLORS.platinum, "draw");
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 5, pageW - margin, footerY - 5);
    setColor(doc, PREMIUM_COLORS.textMuted);
    doc.setFontSize(8);
    setupFont(doc);
    doc.text("OKEAN YACHTS", margin, footerY);
    doc.text(documentRef, pageW / 2, footerY, { align: "center" });
    doc.text(`${pageNum} / ${totalPages}`, pageW - margin, footerY, { align: "right" });
    doc.setFontSize(7);
    doc.text("Documento confidencial - Uso exclusivo do destinatário", pageW / 2, footerY + 4, { align: "center" });
  }
};

// ===== BLOCK RENDERERS =====
interface BlockConfig {
  showLogo?: boolean;
  showCNPJ?: boolean;
  showPrices?: boolean;
  showDeliveryImpact?: boolean;
  [key: string]: unknown;
}

interface Block {
  id: string;
  type: string;
  label: string;
  order: number;
  visible: boolean;
  config: BlockConfig;
}

interface RenderContext {
  doc: jsPDF;
  contract: any;
  pageW: number;
  pageH: number;
  margin: number;
  contentWidth: number;
  style: 'clean' | 'premium';
}

function renderBlock(block: Block, ctx: RenderContext, yPos: number): number {
  const { doc, contract, pageW, pageH, margin, contentWidth, style } = ctx;
  
  // Check if we need a new page
  if (yPos > pageH - 40) {
    doc.addPage();
    if (style === 'clean') {
      yPos = cleanRenderer.drawHeader(doc, pageW, margin);
    } else {
      yPos = premiumRenderer.drawHeader(doc, "Resumo do Contrato", pageW, margin);
    }
  }
  
  switch (block.type) {
    case 'header':
      // Header is already drawn at page start
      break;
      
    case 'buyer':
      if (style === 'clean') {
        yPos = cleanRenderer.drawSectionTitle(doc, "Cliente", yPos, margin, pageW);
        yPos = cleanRenderer.drawInfoRow(doc, "Nome", contract.client?.name || "N/A", yPos, margin);
        if (contract.client?.email) yPos = cleanRenderer.drawInfoRow(doc, "Email", contract.client.email, yPos, margin);
        if (contract.client?.phone) yPos = cleanRenderer.drawInfoRow(doc, "Telefone", contract.client.phone, yPos, margin);
        yPos += 4;
        yPos = cleanRenderer.drawDivider(doc, yPos, margin, pageW);
      } else {
        yPos = premiumRenderer.drawSectionTitle(doc, "Cliente", yPos, margin);
        premiumRenderer.drawBox(doc, margin, yPos, contentWidth, 40);
        yPos += 12;
        yPos = premiumRenderer.drawInfoRow(doc, "Nome", contract.client?.name || "N/A", yPos, margin + 10);
        if (contract.client?.email) yPos = premiumRenderer.drawInfoRow(doc, "Email", contract.client.email, yPos, margin + 10);
        yPos += 20;
      }
      break;
      
    case 'boat':
      if (style === 'clean') {
        yPos = cleanRenderer.drawSectionTitle(doc, "Informações do Contrato", yPos, margin, pageW);
        yPos = cleanRenderer.drawInfoRow(doc, "Número do Contrato", contract.contract_number, yPos, margin);
        yPos = cleanRenderer.drawInfoRow(doc, "Modelo do Iate", contract.yacht_model?.name || "N/A", yPos, margin);
        yPos = cleanRenderer.drawInfoRow(doc, "Data de Assinatura", formatDateShort(contract.signed_at), yPos, margin);
        yPos = cleanRenderer.drawInfoRow(doc, "Assinado por", contract.signed_by_name || "N/A", yPos, margin);
        const statusText = contract.status === "active" ? "Ativo" : contract.status === "completed" ? "Concluído" : "Cancelado";
        yPos = cleanRenderer.drawInfoRow(doc, "Status", statusText, yPos, margin);
        yPos += 4;
        yPos = cleanRenderer.drawDivider(doc, yPos, margin, pageW);
      } else {
        yPos = premiumRenderer.drawSectionTitle(doc, "Contrato", yPos, margin);
        premiumRenderer.drawBox(doc, margin, yPos, contentWidth, 60, "dark");
        yPos += 15;
        setColor(doc, PREMIUM_COLORS.textLight);
        doc.setFontSize(18);
        setupFont(doc, "bold");
        doc.text(contract.yacht_model?.name || "N/A", margin + 10, yPos);
        yPos += 10;
        setColor(doc, PREMIUM_COLORS.gold);
        doc.setFontSize(12);
        doc.text(contract.contract_number, margin + 10, yPos);
        yPos += 50;
      }
      break;
      
    case 'financial_summary':
      if (style === 'clean') {
        yPos = cleanRenderer.drawSectionTitle(doc, "Valores Contratuais", yPos, margin, pageW);
        yPos = cleanRenderer.drawInfoRow(doc, "Preço Base", formatCurrency(contract.base_price), yPos, margin);
        yPos = cleanRenderer.drawInfoRow(doc, "Prazo Base", `${contract.base_delivery_days} dias`, yPos, margin);
        yPos += 4;
        
        // ATOs
        const approvedATOs = contract.atos?.filter((a: any) => a.status === "approved") || [];
        if (approvedATOs.length > 0) {
          yPos = cleanRenderer.drawDivider(doc, yPos, margin, pageW);
          yPos = cleanRenderer.drawSectionTitle(doc, "ATOs Aprovadas", yPos, margin, pageW);
          
          for (const ato of approvedATOs) {
            if (yPos > pageH - 40) {
              doc.addPage();
              yPos = cleanRenderer.drawHeader(doc, pageW, margin);
              yPos = cleanRenderer.drawSectionTitle(doc, "ATOs Aprovadas (continuação)", yPos, margin, pageW);
            }
            
            const priceImpact = ato.price_impact || 0;
            const daysImpact = ato.delivery_days_impact || 0;
            
            doc.setFontSize(10);
            setupFont(doc, "normal");
            setColor(doc, CLEAN_COLORS.black);
            
            const atoText = `• ${ato.ato_number} - ${ato.title}`;
            doc.text(atoText, margin, yPos);
            
            const impactText = daysImpact > 0 
              ? `${formatCurrency(priceImpact)} (+${daysImpact} dias)`
              : formatCurrency(priceImpact);
            doc.text(impactText, pageW - margin, yPos, { align: "right" });
            yPos += 6;
          }
          yPos += 4;
        }
        
        yPos = cleanRenderer.drawDivider(doc, yPos, margin, pageW);
        yPos = cleanRenderer.drawSectionTitle(doc, "Totais Atualizados", yPos, margin, pageW);
        yPos = cleanRenderer.drawInfoRow(doc, "Valor Total", formatCurrency(contract.current_total_price), yPos, margin);
        yPos = cleanRenderer.drawInfoRow(doc, "Prazo Total", `${contract.current_total_delivery_days} dias`, yPos, margin);
      } else {
        yPos = premiumRenderer.drawSectionTitle(doc, "Valores", yPos, margin);
        premiumRenderer.drawBox(doc, margin, yPos, contentWidth, 50);
        yPos += 15;
        yPos = premiumRenderer.drawInfoRow(doc, "Preço Base", formatCurrency(contract.base_price), yPos, margin + 10);
        yPos = premiumRenderer.drawInfoRow(doc, "Prazo Base", `${contract.base_delivery_days} dias`, yPos, margin + 10);
        yPos += 25;
        
        setColor(doc, PREMIUM_COLORS.gold, "fill");
        doc.roundedRect(margin, yPos, contentWidth, 35, 3, 3, "F");
        yPos += 15;
        setColor(doc, PREMIUM_COLORS.navy);
        doc.setFontSize(12);
        doc.text("VALOR TOTAL ATUALIZADO", margin + 10, yPos);
        yPos += 12;
        doc.setFontSize(20);
        setupFont(doc, "bold");
        doc.text(formatCurrency(contract.current_total_price), margin + 10, yPos);
        yPos += 20;
      }
      break;
      
    case 'notes':
      if (contract.delivery_notes) {
        if (style === 'clean') {
          yPos = cleanRenderer.drawSectionTitle(doc, "Observações", yPos, margin, pageW);
          doc.setFontSize(10);
          setupFont(doc, "normal");
          setColor(doc, CLEAN_COLORS.gray);
          const lines = doc.splitTextToSize(contract.delivery_notes, contentWidth);
          lines.forEach((line: string) => {
            doc.text(line, margin, yPos);
            yPos += 5;
          });
          yPos += 4;
        } else {
          yPos = premiumRenderer.drawSectionTitle(doc, "Observações", yPos, margin);
          doc.setFontSize(11);
          setupFont(doc, "italic");
          setColor(doc, PREMIUM_COLORS.textMuted);
          const lines = doc.splitTextToSize(contract.delivery_notes, contentWidth);
          lines.forEach((line: string) => {
            doc.text(line, margin, yPos);
            yPos += 6;
          });
          yPos += 10;
        }
      }
      break;
      
    case 'page_break':
      doc.addPage();
      if (style === 'clean') {
        yPos = cleanRenderer.drawHeader(doc, pageW, margin);
      } else {
        yPos = premiumRenderer.drawHeader(doc, "Resumo do Contrato", pageW, margin);
      }
      break;
  }
  
  return yPos;
}

function addFootersToAllPages(ctx: RenderContext, documentRef: string) {
  const { doc, pageW, pageH, margin, style } = ctx;
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    if (style === 'clean') {
      cleanRenderer.drawFooter(doc, i, totalPages, pageW, pageH, documentRef, margin);
    } else {
      premiumRenderer.drawFooter(doc, i, totalPages, pageW, pageH, documentRef, margin);
    }
  }
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

    const { contract_id } = await req.json();
    if (!contract_id) throw new Error("contract_id is required");

    // Fetch contract data
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select(`*, client:clients(*), yacht_model:yacht_models(*), atos:additional_to_orders(*)`)
      .eq("id", contract_id)
      .single();

    if (contractError || !contract) throw new Error("Contract not found");
    console.log("Contract found:", contract.contract_number);

    // Fetch active template for 'consolidated' document type
    const { data: template } = await supabase
      .from("pdf_templates")
      .select("*")
      .eq("document_type", "consolidated")
      .eq("status", "active")
      .eq("is_default", true)
      .single();

    // Get style and blocks from template or use defaults
    let pdfStyle: 'clean' | 'premium' = 'clean';
    let blocks: Block[] = [];
    
    if (template?.template_json) {
      const templateJson = template.template_json as any;
      pdfStyle = templateJson.settings?.style || 'clean';
      blocks = (templateJson.blocks || [])
        .filter((b: Block) => b.visible)
        .sort((a: Block, b: Block) => a.order - b.order);
      console.log(`Using template: ${template.name} (style: ${pdfStyle}, ${blocks.length} blocks)`);
    }
    
    // If no template or no blocks, use default blocks
    if (blocks.length === 0) {
      console.log("No template found, using default blocks");
      blocks = [
        { id: '1', type: 'header', label: 'Header', order: 0, visible: true, config: {} },
        { id: '2', type: 'boat', label: 'Contrato', order: 1, visible: true, config: {} },
        { id: '3', type: 'buyer', label: 'Cliente', order: 2, visible: true, config: {} },
        { id: '4', type: 'financial_summary', label: 'Valores', order: 3, visible: true, config: {} },
        { id: '5', type: 'notes', label: 'Notas', order: 4, visible: true, config: {} },
      ];
    }

    // Create PDF
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageW - (margin * 2);

    const ctx: RenderContext = { doc, contract, pageW, pageH, margin, contentWidth, style: pdfStyle };

    // Draw initial header
    let yPos: number;
    if (pdfStyle === 'clean') {
      yPos = cleanRenderer.drawHeader(doc, pageW, margin);
      // Document title
      doc.setFontSize(16);
      setupFont(doc, "bold");
      setColor(doc, CLEAN_COLORS.black);
      doc.text("RESUMO DO CONTRATO", margin, yPos);
      yPos += 5;
      doc.setFontSize(12);
      setupFont(doc, "normal");
      doc.text(contract.contract_number, margin, yPos);
      yPos += 12;
      yPos = cleanRenderer.drawDivider(doc, yPos, margin, pageW);
    } else {
      yPos = premiumRenderer.drawHeader(doc, "Resumo do Contrato", pageW, margin);
    }

    // Render blocks in order
    for (const block of blocks) {
      if (block.type !== 'header') { // Header already rendered
        yPos = renderBlock(block, ctx, yPos);
      }
    }

    // Add footers to all pages
    addFootersToAllPages(ctx, contract.contract_number);

    const pdfData = doc.output("arraybuffer");
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfData)));

    console.log(`✓ Contract PDF generated (style: ${pdfStyle})`);

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
