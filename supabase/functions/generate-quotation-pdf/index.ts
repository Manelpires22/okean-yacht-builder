import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

// ===== CORS CONFIG =====
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ===== PREMIUM COLOR PALETTE =====
const COLORS = {
  // Primary brand colors
  navy: { r: 12, g: 35, b: 64 },
  navyDark: { r: 8, g: 24, b: 48 },
  navyLight: { r: 20, g: 50, b: 90 },
  
  // Accent - Elegant Gold
  gold: { r: 197, g: 162, b: 99 },
  goldLight: { r: 218, g: 190, b: 140 },
  goldDark: { r: 160, g: 130, b: 70 },
  
  // Neutral palette
  white: { r: 255, g: 255, b: 255 },
  champagne: { r: 250, g: 248, b: 244 },
  platinum: { r: 235, g: 235, b: 232 },
  silver: { r: 200, g: 200, b: 200 },
  
  // Text colors
  textDark: { r: 30, g: 30, b: 35 },
  textMuted: { r: 100, g: 100, b: 105 },
  textLight: { r: 255, g: 255, b: 255 },
  
  // Status colors
  success: { r: 34, g: 140, b: 90 },
  warning: { r: 200, g: 140, b: 40 },
  error: { r: 180, g: 60, b: 60 },
};

// ===== FONT SETUP =====
function setupFont(doc: jsPDF, style: "normal" | "bold" | "italic" = "normal") {
  doc.setFont("helvetica", style);
}

// ===== UTILITY FUNCTIONS =====
function dedupeBy<T>(arr: T[], keyFn: (x: T) => string): T[] {
  const map = new Map<string, T>();
  for (const item of arr) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, item);
  }
  return [...map.values()];
}

function setColor(doc: jsPDF, color: { r: number; g: number; b: number }, type: "fill" | "text" | "draw" = "text") {
  if (type === "fill") {
    doc.setFillColor(color.r, color.g, color.b);
  } else if (type === "draw") {
    doc.setDrawColor(color.r, color.g, color.b);
  } else {
    doc.setTextColor(color.r, color.g, color.b);
  }
}

// ===== START SERVER =====
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== Generate Premium Quotation PDF Started ===");
    
    const { quotationId } = await req.json();
    if (!quotationId) throw new Error("quotationId is required");
    console.log("Request data:", { quotationId });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // === FETCH QUOTATION ===
    const { data: quotation, error: fetchError } = await supabase
      .from("quotations")
      .select(`
        *,
        yacht_models (*),
        clients (*),
        users!quotations_sales_representative_id_fkey (
          id,
          full_name,
          email,
          department
        ),
        quotation_options (
          *,
          options (
            id,
            code,
            name,
            description,
            base_price,
            category_id,
            memorial_categories:category_id (
              label
            )
          )
        ),
        quotation_customizations (*),
        quotation_upgrades (
          *,
          memorial_upgrades (
            id,
            name,
            code,
            price
          ),
          memorial_items (
            item_name,
            memorial_categories (
              label
            )
          )
        )
      `)
      .eq("id", quotationId)
      .single();

    if (fetchError || !quotation) {
      throw new Error("Quotation not found: " + fetchError?.message);
    }

    console.log("Cotação encontrada:", quotation.quotation_number);

    // Fetch memorial items for the yacht model
    const { data: memorialItems } = await supabase
      .from("memorial_items")
      .select(`
        *,
        memorial_categories!inner (
          id,
          label,
          icon,
          display_order
        )
      `)
      .eq("yacht_model_id", quotation.yacht_model_id)
      .eq("is_active", true)
      .order("category_display_order")
      .order("display_order");

    console.log(`Memorial items found: ${memorialItems?.length || 0}`);

    // Deduplicate and sort memorial items
    const memorialClean = memorialItems ? dedupeBy(memorialItems, (item: any) =>
      `${item.memorial_categories?.label || 'Outros'}|${item.item_name}|${item.brand || ''}|${item.model || ''}`
    ) : [];
    
    memorialClean.sort((a: any, b: any) => {
      const catOrder = (a.memorial_categories?.display_order ?? 999) - (b.memorial_categories?.display_order ?? 999);
      if (catOrder !== 0) return catOrder;
      return (a.display_order ?? 999) - (b.display_order ?? 999);
    });

    // === SETUP PDF ===
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageW - (margin * 2);

    // ===== FORMATTING HELPERS =====
    const formatCurrency = (value: number) => {
      if (!value && value !== 0) return "R$ 0,00";
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2
      }).format(value);
    };

    const formatDate = (date: string) => {
      if (!date) return "-";
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }).format(new Date(date));
    };

    const formatNumber = (value: number, decimals = 2) => {
      if (!value && value !== 0) return "0";
      return value.toLocaleString("pt-BR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
    };

    // ===== DESIGN COMPONENTS =====
    
    // Draw premium gradient background
    function drawGradientBackground(yStart: number = 0, yEnd: number = pageH) {
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

    // Draw gold accent line
    function drawGoldDivider(y: number, width: number = contentWidth, centered: boolean = true) {
      const x = centered ? (pageW - width) / 2 : margin;
      setColor(doc, COLORS.gold, "draw");
      doc.setLineWidth(0.8);
      doc.line(x, y, x + width, y);
      
      // Add small diamond accent in center
      const centerX = x + width / 2;
      doc.setLineWidth(0.5);
      doc.line(centerX - 4, y, centerX, y - 2);
      doc.line(centerX, y - 2, centerX + 4, y);
      doc.line(centerX + 4, y, centerX, y + 2);
      doc.line(centerX, y + 2, centerX - 4, y);
    }

    // Draw premium box with shadow
    function drawPremiumBox(x: number, y: number, w: number, h: number, style: "light" | "dark" | "gold" = "light") {
      // Shadow
      doc.setFillColor(0, 0, 0);
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.08 }));
      doc.roundedRect(x + 2, y + 2, w, h, 3, 3, "F");
      doc.restoreGraphicsState();
      
      // Box fill
      if (style === "dark") {
        setColor(doc, COLORS.navy, "fill");
      } else if (style === "gold") {
        setColor(doc, COLORS.gold, "fill");
      } else {
        setColor(doc, COLORS.champagne, "fill");
      }
      doc.roundedRect(x, y, w, h, 3, 3, "F");
      
      // Border
      if (style === "gold") {
        setColor(doc, COLORS.goldDark, "draw");
      } else {
        setColor(doc, COLORS.platinum, "draw");
      }
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, w, h, 3, 3, "S");
    }

    // Draw page header
    function drawPageHeader(title: string) {
      // Header background
      setColor(doc, COLORS.navy, "fill");
      doc.rect(0, 0, pageW, 45, "F");
      
      // Gold accent line at bottom
      setColor(doc, COLORS.gold, "fill");
      doc.rect(0, 43, pageW, 2, "F");
      
      // Company name
      setColor(doc, COLORS.textLight, "text");
      doc.setFontSize(10);
      setupFont(doc, "bold");
      doc.text("OKEAN YACHTS", margin, 18);
      
      // Page title
      setColor(doc, COLORS.gold, "text");
      doc.setFontSize(18);
      setupFont(doc, "bold");
      doc.text(title, margin, 32);
      
      return 55; // Return Y position for content start
    }

    // Draw page footer
    function drawPageFooter(pageNum: number, totalPages: number) {
      const footerY = pageH - 15;
      
      // Line above footer
      setColor(doc, COLORS.platinum, "draw");
      doc.setLineWidth(0.3);
      doc.line(margin, footerY - 5, pageW - margin, footerY - 5);
      
      // Footer text
      setColor(doc, COLORS.textMuted, "text");
      doc.setFontSize(8);
      setupFont(doc);
      
      doc.text("OKEAN YACHTS", margin, footerY);
      doc.text(`Proposta ${quotation.quotation_number}`, pageW / 2, footerY, { align: "center" });
      doc.text(`${pageNum} / ${totalPages}`, pageW - margin, footerY, { align: "right" });
      
      // Confidentiality note
      doc.setFontSize(7);
      doc.text("Documento confidencial - Uso exclusivo do destinatário", pageW / 2, footerY + 4, { align: "center" });
    }

    // Add draft watermark
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

    // ===== PAGE 1 - LUXURY COVER =====
    async function addCoverPage() {
      const hero = quotation.yacht_models?.image_url;
      let hasHeroImage = false;

      // Try to load hero image
      if (hero) {
        try {
          console.log("Loading hero image:", hero);
          const imgRes = await fetch(hero);
          if (imgRes.ok) {
            const imgArray = await imgRes.arrayBuffer();
            const imgBase64 = btoa(
              new Uint8Array(imgArray).reduce((data, byte) => data + String.fromCharCode(byte), "")
            );
            
            // Full-page hero image
            doc.addImage("data:image/jpeg;base64," + imgBase64, "JPEG", 0, 0, pageW, pageH);
            
            // Elegant gradient overlay (darker at top and bottom)
            doc.setFillColor(0, 0, 0);
            doc.saveGraphicsState();
            doc.setGState(new doc.GState({ opacity: 0.55 }));
            doc.rect(0, 0, pageW, 100, "F"); // Top
            doc.restoreGraphicsState();
            
            doc.saveGraphicsState();
            doc.setGState(new doc.GState({ opacity: 0.7 }));
            doc.rect(0, pageH - 120, pageW, 120, "F"); // Bottom
            doc.restoreGraphicsState();
            
            hasHeroImage = true;
            console.log("✓ Hero image loaded successfully");
          }
        } catch (error) {
          console.error("Error loading hero image:", error);
        }
      }

      // Fallback: Elegant gradient background
      if (!hasHeroImage) {
        drawGradientBackground();
        
        // Add subtle pattern overlay
        doc.saveGraphicsState();
        doc.setGState(new doc.GState({ opacity: 0.03 }));
        for (let i = 0; i < 20; i++) {
          setColor(doc, COLORS.white, "draw");
          doc.setLineWidth(0.5);
          doc.line(0, i * 20, pageW, i * 20 + 50);
        }
        doc.restoreGraphicsState();
      }

      // ===== TOP SECTION - BRANDING =====
      let yPos = 50;
      
      // Company name with elegant spacing
      setColor(doc, COLORS.textLight, "text");
      doc.setFontSize(14);
      setupFont(doc);
      doc.setCharSpace(8);
      doc.text("OKEAN YACHTS", pageW / 2, yPos, { align: "center" });
      doc.setCharSpace(0);
      
      // Gold divider
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

      // ===== CENTER SECTION - MODEL INFO =====
      yPos = pageH / 2 - 30;
      
      // Model name - large and prominent
      setColor(doc, COLORS.textLight, "text");
      doc.setFontSize(38);
      setupFont(doc, "bold");
      const modelName = quotation.yacht_models?.name || "Modelo";
      doc.text(modelName.toUpperCase(), pageW / 2, yPos, { align: "center" });
      
      // Model code if different
      if (quotation.yacht_models?.code && quotation.yacht_models.code !== modelName) {
        yPos += 15;
        doc.setFontSize(14);
        setupFont(doc);
        setColor(doc, COLORS.gold, "text");
        doc.text(quotation.yacht_models.code, pageW / 2, yPos, { align: "center" });
      }

      // ===== BOTTOM SECTION - PROPOSAL INFO =====
      yPos = pageH - 100;
      
      // Proposal label
      setColor(doc, COLORS.goldLight, "text");
      doc.setFontSize(10);
      setupFont(doc);
      doc.setCharSpace(3);
      doc.text("PROPOSTA COMERCIAL", pageW / 2, yPos, { align: "center" });
      doc.setCharSpace(0);
      
      // Proposal number
      yPos += 12;
      setColor(doc, COLORS.textLight, "text");
      doc.setFontSize(20);
      setupFont(doc, "bold");
      doc.text(`Nº ${quotation.quotation_number}`, pageW / 2, yPos, { align: "center" });
      
      // Client name
      yPos += 15;
      doc.setFontSize(12);
      setupFont(doc);
      const clientName = quotation.clients?.name || quotation.client_name || "Cliente";
      doc.text(`Preparada para: ${clientName}`, pageW / 2, yPos, { align: "center" });
      
      // Date
      yPos += 10;
      doc.setFontSize(10);
      setColor(doc, COLORS.silver, "text");
      doc.text(formatDate(quotation.created_at), pageW / 2, yPos, { align: "center" });
      
      // Gold accent box with total price
      yPos += 20;
      const priceBoxWidth = 140;
      const priceBoxX = (pageW - priceBoxWidth) / 2;
      
      // Gold border box
      setColor(doc, COLORS.gold, "draw");
      doc.setLineWidth(1);
      doc.roundedRect(priceBoxX, yPos - 8, priceBoxWidth, 24, 2, 2, "S");
      
      // Price inside
      setColor(doc, COLORS.gold, "text");
      doc.setFontSize(22);
      setupFont(doc, "bold");
      doc.text(formatCurrency(quotation.final_price), pageW / 2, yPos + 7, { align: "center" });

      addDraftWatermark();
    }

    // ===== PAGE 2 - YACHT SPECIFICATIONS =====
    function addSpecificationsPage() {
      doc.addPage();
      const startY = drawPageHeader("Especificações Técnicas");
      
      let yPos = startY;
      const model = quotation.yacht_models;
      
      // Model highlight box
      drawPremiumBox(margin, yPos, contentWidth, 35, "dark");
      
      setColor(doc, COLORS.textLight, "text");
      doc.setFontSize(22);
      setupFont(doc, "bold");
      doc.text(model?.name || "Modelo", margin + 10, yPos + 15);
      
      if (model?.code) {
        setColor(doc, COLORS.gold, "text");
        doc.setFontSize(12);
        setupFont(doc);
        doc.text(model.code, margin + 10, yPos + 26);
      }
      
      // Description
      if (model?.description) {
        yPos += 45;
        setColor(doc, COLORS.textMuted, "text");
        doc.setFontSize(10);
        setupFont(doc, "italic");
        const descLines = doc.splitTextToSize(model.description, contentWidth);
        doc.text(descLines.slice(0, 3), margin, yPos);
        yPos += descLines.slice(0, 3).length * 5 + 10;
      } else {
        yPos += 45;
      }

      // Specifications grid
      const specs = [];
      
      if (model?.length_overall) specs.push({ label: "Comprimento Total", value: `${formatNumber(model.length_overall, 2)} m`, icon: "📏" });
      if (model?.beam) specs.push({ label: "Boca", value: `${formatNumber(model.beam, 2)} m`, icon: "↔️" });
      if (model?.draft) specs.push({ label: "Calado", value: `${formatNumber(model.draft, 2)} m`, icon: "📐" });
      if (model?.displacement_loaded) specs.push({ label: "Deslocamento", value: `${formatNumber(model.displacement_loaded, 0)} kg`, icon: "⚖️" });
      if (model?.cabins) specs.push({ label: "Cabines", value: `${model.cabins}`, icon: "🛏️" });
      if (model?.bathrooms) specs.push({ label: "Banheiros", value: `${model.bathrooms}`, icon: "🚿" });
      if (model?.passengers_capacity) specs.push({ label: "Capacidade", value: `${model.passengers_capacity} pessoas`, icon: "👥" });
      if (model?.engines) specs.push({ label: "Motorização", value: model.engines, icon: "⚙️" });
      if (model?.max_speed) specs.push({ label: "Velocidade Máx.", value: `${formatNumber(model.max_speed, 0)} nós`, icon: "🚀" });
      if (model?.cruise_speed) specs.push({ label: "Velocidade Cruzeiro", value: `${formatNumber(model.cruise_speed, 0)} nós`, icon: "⛵" });
      if (model?.range_nautical_miles) specs.push({ label: "Autonomia", value: `${formatNumber(model.range_nautical_miles, 0)} mn`, icon: "🧭" });
      if (model?.fuel_capacity) specs.push({ label: "Combustível", value: `${formatNumber(model.fuel_capacity, 0)} L`, icon: "⛽" });
      if (model?.water_capacity) specs.push({ label: "Água Doce", value: `${formatNumber(model.water_capacity, 0)} L`, icon: "💧" });
      
      // Draw specs in 2-column grid
      const colWidth = (contentWidth - 10) / 2;
      const cardHeight = 22;
      const cardsPerRow = 2;
      
      specs.forEach((spec, index) => {
        const col = index % cardsPerRow;
        const row = Math.floor(index / cardsPerRow);
        const cardX = margin + (col * (colWidth + 10));
        const cardY = yPos + (row * (cardHeight + 8));
        
        if (cardY > pageH - 50) return; // Skip if would overflow
        
        // Card background
        drawPremiumBox(cardX, cardY, colWidth, cardHeight, "light");
        
        // Label
        setColor(doc, COLORS.textMuted, "text");
        doc.setFontSize(8);
        setupFont(doc);
        doc.text(spec.label, cardX + 8, cardY + 8);
        
        // Value
        setColor(doc, COLORS.navy, "text");
        doc.setFontSize(12);
        setupFont(doc, "bold");
        doc.text(spec.value, cardX + 8, cardY + 17);
      });

      // Delivery info box at bottom
      const deliveryY = pageH - 55;
      drawPremiumBox(margin, deliveryY, contentWidth, 30, "gold");
      
      setColor(doc, COLORS.navyDark, "text");
      doc.setFontSize(10);
      setupFont(doc, "bold");
      doc.text("PRAZO DE ENTREGA ESTIMADO", margin + 10, deliveryY + 12);
      
      doc.setFontSize(14);
      doc.text(`${quotation.total_delivery_days || quotation.base_delivery_days} dias`, margin + 10, deliveryY + 23);

      drawPageFooter(2, 6);
      addDraftWatermark();
    }

    // ===== PAGE 3 - FINANCIAL SUMMARY =====
    function addFinancialSummary() {
      doc.addPage();
      const startY = drawPageHeader("Resumo Financeiro");
      
      let yPos = startY + 5;
      
      // Main financial breakdown
      const boxWidth = contentWidth;
      const boxX = margin;
      
      // Base yacht section
      drawPremiumBox(boxX, yPos, boxWidth, 50, "light");
      
      setColor(doc, COLORS.navy, "text");
      doc.setFontSize(11);
      setupFont(doc, "bold");
      doc.text("EMBARCAÇÃO BASE", boxX + 10, yPos + 12);
      
      setColor(doc, COLORS.textMuted, "text");
      doc.setFontSize(9);
      setupFont(doc);
      doc.text(quotation.yacht_models?.name || "Modelo", boxX + 10, yPos + 22);
      
      // Base price
      setColor(doc, COLORS.textDark, "text");
      doc.setFontSize(10);
      doc.text("Valor Base:", boxX + 10, yPos + 35);
      doc.text(formatCurrency(quotation.base_price), boxX + boxWidth - 10, yPos + 35, { align: "right" });
      
      // Discount if any
      if (quotation.base_discount_percentage && quotation.base_discount_percentage > 0) {
        yPos += 10;
        setColor(doc, COLORS.success, "text");
        doc.text(`Desconto (${formatNumber(quotation.base_discount_percentage)}%):`, boxX + 10, yPos + 35);
        const discountValue = quotation.base_price - quotation.final_base_price;
        doc.text(`- ${formatCurrency(discountValue)}`, boxX + boxWidth - 10, yPos + 35, { align: "right" });
      }
      
      yPos += 60;
      
      // Options section
      const hasOptions = quotation.quotation_options && quotation.quotation_options.length > 0;
      if (hasOptions) {
        drawPremiumBox(boxX, yPos, boxWidth, 50, "light");
        
        setColor(doc, COLORS.navy, "text");
        doc.setFontSize(11);
        setupFont(doc, "bold");
        doc.text("OPCIONAIS SELECIONADOS", boxX + 10, yPos + 12);
        
        setColor(doc, COLORS.textMuted, "text");
        doc.setFontSize(9);
        setupFont(doc);
        doc.text(`${quotation.quotation_options.length} item(ns)`, boxX + 10, yPos + 22);
        
        setColor(doc, COLORS.textDark, "text");
        doc.setFontSize(10);
        doc.text("Valor Opcionais:", boxX + 10, yPos + 35);
        doc.text(formatCurrency(quotation.total_options_price || 0), boxX + boxWidth - 10, yPos + 35, { align: "right" });
        
        if (quotation.options_discount_percentage && quotation.options_discount_percentage > 0) {
          setColor(doc, COLORS.success, "text");
          doc.text(`Desconto (${formatNumber(quotation.options_discount_percentage)}%):`, boxX + 10, yPos + 45);
          const optDiscountValue = (quotation.total_options_price || 0) - (quotation.final_options_price || 0);
          doc.text(`- ${formatCurrency(optDiscountValue)}`, boxX + boxWidth - 10, yPos + 45, { align: "right" });
        }
        
        yPos += 60;
      }
      
      // Upgrades section
      const hasUpgrades = quotation.quotation_upgrades && quotation.quotation_upgrades.length > 0;
      if (hasUpgrades) {
        const upgradesTotal = quotation.quotation_upgrades.reduce((sum: number, u: any) => sum + (u.price || 0), 0);
        
        drawPremiumBox(boxX, yPos, boxWidth, 35, "light");
        
        setColor(doc, COLORS.navy, "text");
        doc.setFontSize(11);
        setupFont(doc, "bold");
        doc.text("UPGRADES", boxX + 10, yPos + 12);
        
        setColor(doc, COLORS.textMuted, "text");
        doc.setFontSize(9);
        setupFont(doc);
        doc.text(`${quotation.quotation_upgrades.length} upgrade(s)`, boxX + 10, yPos + 22);
        
        setColor(doc, COLORS.textDark, "text");
        doc.setFontSize(10);
        doc.text(formatCurrency(upgradesTotal), boxX + boxWidth - 10, yPos + 22, { align: "right" });
        
        yPos += 45;
      }
      
      // Customizations section
      const approvedCustomizations = (quotation.quotation_customizations || []).filter((c: any) => c.status === "approved");
      if (approvedCustomizations.length > 0) {
        const customTotal = approvedCustomizations.reduce((sum: number, c: any) => sum + (c.additional_cost || 0), 0);
        
        drawPremiumBox(boxX, yPos, boxWidth, 35, "light");
        
        setColor(doc, COLORS.navy, "text");
        doc.setFontSize(11);
        setupFont(doc, "bold");
        doc.text("CUSTOMIZAÇÕES APROVADAS", boxX + 10, yPos + 12);
        
        setColor(doc, COLORS.textMuted, "text");
        doc.setFontSize(9);
        setupFont(doc);
        doc.text(`${approvedCustomizations.length} item(ns)`, boxX + 10, yPos + 22);
        
        setColor(doc, COLORS.textDark, "text");
        doc.setFontSize(10);
        doc.text(formatCurrency(customTotal), boxX + boxWidth - 10, yPos + 22, { align: "right" });
        
        yPos += 45;
      }
      
      // TOTAL BOX - Premium gold style
      yPos += 10;
      
      // Gold gradient box for total
      setColor(doc, COLORS.navy, "fill");
      doc.roundedRect(boxX, yPos, boxWidth, 45, 4, 4, "F");
      
      // Gold border
      setColor(doc, COLORS.gold, "draw");
      doc.setLineWidth(2);
      doc.roundedRect(boxX, yPos, boxWidth, 45, 4, 4, "S");
      
      // Total label
      setColor(doc, COLORS.goldLight, "text");
      doc.setFontSize(11);
      setupFont(doc);
      doc.text("VALOR TOTAL DA PROPOSTA", boxX + 15, yPos + 15);
      
      // Total value
      setColor(doc, COLORS.gold, "text");
      doc.setFontSize(24);
      setupFont(doc, "bold");
      doc.text(formatCurrency(quotation.final_price), boxX + 15, yPos + 35);
      
      // Validity note
      yPos += 55;
      setColor(doc, COLORS.textMuted, "text");
      doc.setFontSize(9);
      setupFont(doc, "italic");
      doc.text(`Proposta válida até ${formatDate(quotation.valid_until)}`, pageW / 2, yPos, { align: "center" });

      drawPageFooter(3, 6);
      addDraftWatermark();
    }

    // ===== PAGE 4 - OPTIONAL ITEMS =====
    function addOptionalItemsPage() {
      if (!quotation.quotation_options || quotation.quotation_options.length === 0) {
        return;
      }

      doc.addPage();
      let startY = drawPageHeader("Opcionais Selecionados");
      let yPos = startY;
      
      // Group options by category
      const optionsByCategory: Record<string, any[]> = {};
      quotation.quotation_options.forEach((qo: any) => {
        const category = qo.options?.memorial_categories?.label || "Outros";
        if (!optionsByCategory[category]) {
          optionsByCategory[category] = [];
        }
        optionsByCategory[category].push(qo);
      });
      
      const cardWidth = (contentWidth - 8) / 2;
      const cardHeight = 45;
      
      Object.entries(optionsByCategory).forEach(([category, options]) => {
        // Category header
        if (yPos > pageH - 80) {
          drawPageFooter(4, 6);
          doc.addPage();
          startY = drawPageHeader("Opcionais Selecionados (cont.)");
          yPos = startY;
        }
        
        setColor(doc, COLORS.navy, "text");
        doc.setFontSize(12);
        setupFont(doc, "bold");
        doc.text(category.toUpperCase(), margin, yPos);
        
        drawGoldDivider(yPos + 3, contentWidth, false);
        yPos += 15;
        
        // Options as cards (2 per row)
        (options as any[]).forEach((qo: any, index: number) => {
          const col = index % 2;
          const cardX = margin + (col * (cardWidth + 8));
          
          if (col === 0 && yPos > pageH - cardHeight - 30) {
            drawPageFooter(4, 6);
            doc.addPage();
            startY = drawPageHeader("Opcionais Selecionados (cont.)");
            yPos = startY;
          }
          
          // Card
          drawPremiumBox(cardX, yPos, cardWidth, cardHeight, "light");
          
          // Option name
          setColor(doc, COLORS.textDark, "text");
          doc.setFontSize(9);
          setupFont(doc, "bold");
          const optionName = qo.options?.name || "Item";
          const nameLines = doc.splitTextToSize(optionName, cardWidth - 16);
          doc.text(nameLines[0] + (nameLines.length > 1 ? "..." : ""), cardX + 8, yPos + 12);
          
          // Code
          if (qo.options?.code) {
            setColor(doc, COLORS.textMuted, "text");
            doc.setFontSize(7);
            setupFont(doc);
            doc.text(`Cód: ${qo.options.code}`, cardX + 8, yPos + 20);
          }
          
          // Quantity and price
          setColor(doc, COLORS.navy, "text");
          doc.setFontSize(8);
          setupFont(doc);
          if (qo.quantity > 1) {
            doc.text(`Qtd: ${qo.quantity} × ${formatCurrency(qo.unit_price)}`, cardX + 8, yPos + 30);
          }
          
          // Total price
          setColor(doc, COLORS.gold, "text");
          doc.setFontSize(10);
          setupFont(doc, "bold");
          doc.text(formatCurrency(qo.total_price), cardX + cardWidth - 8, yPos + 38, { align: "right" });
          
          if (col === 1) {
            yPos += cardHeight + 8;
          }
        });
        
        if ((options as any[]).length % 2 === 1) {
          yPos += cardHeight + 8;
        }
        
        yPos += 10;
      });

      drawPageFooter(4, 6);
      addDraftWatermark();
    }

    // ===== PAGE 5 - MEMORIAL DESCRITIVO (2 columns) =====
    function addMemorialDescritivo() {
      if (!memorialClean || memorialClean.length === 0) {
        return;
      }

      doc.addPage();
      let startY = drawPageHeader("Memorial Descritivo");
      let yPos = startY;
      
      const colWidth = (contentWidth - 10) / 2;
      let currentCol = 0;
      let colY = [yPos, yPos];
      let currentCategory = "";
      
      memorialClean.forEach((item: any, index: number) => {
        const category = item.memorial_categories?.label || "Outros";
        
        // Check if need new page
        if (Math.min(colY[0], colY[1]) > pageH - 40) {
          drawPageFooter(5, 6);
          doc.addPage();
          startY = drawPageHeader("Memorial Descritivo (cont.)");
          colY = [startY, startY];
          currentCategory = "";
        }
        
        // New category header - spans full width
        if (category !== currentCategory) {
          // Reset to left column for new category
          currentCol = 0;
          const maxY = Math.max(colY[0], colY[1]);
          colY = [maxY + 5, maxY + 5];
          
          // Category header background
          setColor(doc, COLORS.navy, "fill");
          doc.roundedRect(margin, colY[0], contentWidth, 10, 2, 2, "F");
          
          setColor(doc, COLORS.gold, "text");
          doc.setFontSize(9);
          setupFont(doc, "bold");
          doc.text(category.toUpperCase(), margin + 5, colY[0] + 7);
          
          colY[0] += 15;
          colY[1] += 15;
          currentCategory = category;
        }
        
        // Find shortest column
        currentCol = colY[0] <= colY[1] ? 0 : 1;
        const colX = margin + (currentCol * (colWidth + 10));
        const itemY = colY[currentCol];
        
        // Item
        setColor(doc, COLORS.textDark, "text");
        doc.setFontSize(8);
        setupFont(doc);
        
        // Item name with bullet
        const itemName = item.item_name || "Item";
        const nameLines = doc.splitTextToSize(`• ${itemName}`, colWidth - 5);
        doc.text(nameLines[0], colX, itemY);
        
        let lineHeight = 5;
        
        // Brand/Model details on second line if exists
        const details = [];
        if (item.brand && item.brand !== "null") details.push(item.brand);
        if (item.model && item.model !== "null") details.push(item.model);
        if (item.quantity && item.quantity > 1) details.push(`×${item.quantity}`);
        
        if (details.length > 0) {
          setColor(doc, COLORS.textMuted, "text");
          doc.setFontSize(7);
          doc.text(`  ${details.join(" | ")}`, colX, itemY + lineHeight);
          lineHeight += 4;
        }
        
        colY[currentCol] += lineHeight + 3;
      });

      drawPageFooter(5, 6);
      addDraftWatermark();
    }

    // ===== PAGE 6 - CONTACT PAGE =====
    function addContactPage() {
      doc.addPage();
      
      // Full page elegant design
      drawGradientBackground(0, 120);
      
      // Gold accent
      setColor(doc, COLORS.gold, "fill");
      doc.rect(0, 118, pageW, 4, "F");
      
      // Company branding at top
      setColor(doc, COLORS.textLight, "text");
      doc.setFontSize(12);
      setupFont(doc);
      doc.setCharSpace(6);
      doc.text("OKEAN YACHTS", pageW / 2, 40, { align: "center" });
      doc.setCharSpace(0);
      
      setColor(doc, COLORS.gold, "text");
      doc.setFontSize(9);
      setupFont(doc, "italic");
      doc.text("Seu sonho. Nossa expertise.", pageW / 2, 55, { align: "center" });
      
      // Contact section title
      setColor(doc, COLORS.textLight, "text");
      doc.setFontSize(18);
      setupFont(doc, "bold");
      doc.text("Entre em Contato", pageW / 2, 85, { align: "center" });
      
      // Main content area
      let yPos = 140;
      
      // Sales representative card
      const cardWidth = 160;
      const cardX = (pageW - cardWidth) / 2;
      
      drawPremiumBox(cardX, yPos, cardWidth, 70, "light");
      
      setColor(doc, COLORS.navy, "text");
      doc.setFontSize(10);
      setupFont(doc, "bold");
      doc.text("SEU CONSULTOR", cardX + cardWidth / 2, yPos + 15, { align: "center" });
      
      drawGoldDivider(yPos + 22, 60, true);
      
      setColor(doc, COLORS.textDark, "text");
      doc.setFontSize(14);
      setupFont(doc, "bold");
      const salesName = quotation.users?.full_name || "Consultor OKEAN";
      doc.text(salesName, cardX + cardWidth / 2, yPos + 38, { align: "center" });
      
      setColor(doc, COLORS.textMuted, "text");
      doc.setFontSize(10);
      setupFont(doc);
      doc.text(quotation.users?.email || "", cardX + cardWidth / 2, yPos + 50, { align: "center" });
      doc.text(quotation.users?.department || "Comercial", cardX + cardWidth / 2, yPos + 60, { align: "center" });
      
      yPos += 90;
      
      // Client info card
      drawPremiumBox(cardX, yPos, cardWidth, 55, "light");
      
      setColor(doc, COLORS.navy, "text");
      doc.setFontSize(10);
      setupFont(doc, "bold");
      doc.text("CLIENTE", cardX + cardWidth / 2, yPos + 15, { align: "center" });
      
      drawGoldDivider(yPos + 22, 40, true);
      
      setColor(doc, COLORS.textDark, "text");
      doc.setFontSize(12);
      setupFont(doc, "bold");
      const clientName = quotation.clients?.name || quotation.client_name || "Cliente";
      doc.text(clientName, cardX + cardWidth / 2, yPos + 35, { align: "center" });
      
      if (quotation.clients?.email || quotation.client_email) {
        setColor(doc, COLORS.textMuted, "text");
        doc.setFontSize(9);
        setupFont(doc);
        doc.text(quotation.clients?.email || quotation.client_email, cardX + cardWidth / 2, yPos + 46, { align: "center" });
      }
      
      // Validity and legal notes
      yPos = pageH - 60;
      
      setColor(doc, COLORS.textMuted, "text");
      doc.setFontSize(9);
      setupFont(doc);
      doc.text(`Proposta válida até: ${formatDate(quotation.valid_until)}`, pageW / 2, yPos, { align: "center" });
      
      yPos += 15;
      doc.setFontSize(8);
      const legalText = "Esta proposta comercial é confidencial e destinada exclusivamente ao cliente indicado. Os valores e condições apresentados estão sujeitos a disponibilidade e podem sofrer alterações sem aviso prévio.";
      const legalLines = doc.splitTextToSize(legalText, contentWidth);
      legalLines.forEach((line: string) => {
        doc.text(line, pageW / 2, yPos, { align: "center" });
        yPos += 4;
      });
      
      // Footer
      yPos = pageH - 15;
      setColor(doc, COLORS.navy, "text");
      doc.setFontSize(8);
      setupFont(doc, "bold");
      doc.text("OKEAN YACHTS © 2025", pageW / 2, yPos, { align: "center" });

      addDraftWatermark();
    }

    // ===== BUILD PDF =====
    console.log("Building PDF pages...");
    await addCoverPage();
    addSpecificationsPage();
    addFinancialSummary();
    addOptionalItemsPage();
    addMemorialDescritivo();
    addContactPage();
    
    console.log("PDF built successfully");

    // ===== UPLOAD PDF =====
    const pdfData = doc.output("arraybuffer");
    const fileName = `quotation-${quotation.quotation_number}-${Date.now()}.pdf`;
    
    console.log(`Uploading PDF: ${fileName}`);
    
    const { error: uploadError } = await supabase.storage
      .from("quotation-pdfs")
      .upload(`${quotation.id}/${fileName}`, new Uint8Array(pdfData), {
        contentType: "application/pdf",
        upsert: true
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    console.log("✓ PDF uploaded successfully");

    return new Response(
      JSON.stringify({ success: true, fileName }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err: any) {
    console.error("Error generating PDF:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
