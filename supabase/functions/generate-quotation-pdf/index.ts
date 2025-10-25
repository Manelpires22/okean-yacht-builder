import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

// ===== CORS CONFIG =====
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ===== FONT & STYLE =====
async function loadNotoSansFont() {
  try {
    const url = "https://fonts.gstatic.com/s/notosans/v36/o-0IIpQlx3QUlC5A4PNr5TRA.woff2";
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch font");
    const fontData = await res.arrayBuffer();
    return btoa(
      new Uint8Array(fontData).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );
  } catch (error) {
    console.error("Error loading Noto Sans font:", error);
    return null;
  }
}

// ===== COLOR PALETTE (Luxury Edition) =====
const COLORS = {
  primary: [16, 24, 48],        // Deep navy blue
  accent: [245, 158, 11],       // Luxurious gold
  light: [247, 248, 250],       // Soft white
  textDark: [30, 30, 30],       // Rich black
  textLight: [255, 255, 255],   // Pure white
  gray: [180, 180, 180],        // Muted gray
  grayDark: [100, 100, 100],    // Dark gray
};

// Utility: Deduplicate array by key function
function dedupeBy<T>(arr: T[], keyFn: (x: T) => string): T[] {
  const map = new Map<string, T>();
  for (const item of arr) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, item);
  }
  return [...map.values()];
}

// ===== START SERVER =====
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== Generate Luxury Quotation PDF Started ===");
    
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
            base_price
          )
        ),
        quotation_customizations (*)
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

    // Deduplicate memorial items
    const memorialClean = memorialItems ? dedupeBy(memorialItems, (item: any) =>
      `${item.memorial_categories?.label || 'Outros'}|${item.item_name}|${item.brand || ''}|${item.model || ''}`
    ) : [];
    
    // Sort by category display_order, then item display_order
    memorialClean.sort((a: any, b: any) => {
      const catOrder = (a.memorial_categories?.display_order ?? 999) - (b.memorial_categories?.display_order ?? 999);
      if (catOrder !== 0) return catOrder;
      return (a.display_order ?? 999) - (b.display_order ?? 999);
    });

    if (memorialItems && memorialItems.length > 0) {
      console.log(`Memorial compacted: ${memorialItems.length} → ${memorialClean.length} items`);
    }

    // === SETUP PDF ===
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    
    // Load Noto Sans font
    const fontBase64 = await loadNotoSansFont();
    if (fontBase64) {
      try {
        doc.addFileToVFS("NotoSans.woff2", fontBase64);
        doc.addFont("NotoSans.woff2", "NotoSans", "normal");
        doc.setFont("NotoSans", "normal");
        console.log("✓ Noto Sans font loaded successfully");
      } catch (error) {
        console.error("Error adding font to PDF:", error);
        doc.setFont("helvetica", "normal");
      }
    } else {
      doc.setFont("helvetica", "normal");
    }

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 20;

    // Helper functions
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2
      }).format(value);
    };

    const formatDate = (date: string) => {
      return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
    };

    const formatNumber = (value: number, decimals = 2) => {
      return value.toLocaleString("pt-BR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
    };

    // Add draft watermark function
    function addDraftWatermark() {
      if (quotation.status !== "draft") return;
      
      doc.setTextColor(200, 200, 200);
      doc.setFontSize(72);
      doc.setFont("NotoSans", "bold");
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.12 }));
      doc.text("RASCUNHO", pageW / 2, pageH / 2, { angle: 35, align: "center" });
      doc.restoreGraphicsState();
    }

    // ===== PAGE 1 – LUXURY COVER =====
    async function addCoverPage() {
      const hero = quotation.yacht_models.image_url;
      let hasHeroImage = false;

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
            
            // Dark overlay for text contrast
            doc.setFillColor(0, 0, 0);
            doc.saveGraphicsState();
            doc.setGState(new doc.GState({ opacity: 0.5 }));
            doc.rect(0, 0, pageW, pageH, "F");
            doc.restoreGraphicsState();
            
            hasHeroImage = true;
            console.log("✓ Hero image loaded successfully");
          }
        } catch (error) {
          console.error("Error loading hero image:", error);
        }
      }

      // Fallback: elegant gradient background
      if (!hasHeroImage) {
        doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        doc.rect(0, 0, pageW, pageH, "F");
      }

      // Company logo/name
      doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
      doc.setFontSize(36);
      doc.setFont("NotoSans", "bold");
      doc.text("OKEAN YACHTS", pageW / 2, 90, { align: "center" });

      // Model name
      doc.setFontSize(22);
      doc.setFont("NotoSans", "normal");
      doc.text(quotation.yacht_models.name, pageW / 2, 110, { align: "center" });

      // Proposal number
      doc.setFontSize(14);
      doc.text(`Proposta No ${quotation.quotation_number}`, pageW / 2, 125, { align: "center" });

      // Client & date
      doc.setFontSize(12);
      doc.text(
        `${quotation.clients?.name || quotation.client_name} • ${formatDate(quotation.created_at)}`,
        pageW / 2,
        138,
        { align: "center" }
      );

      // Total price (accent color)
      doc.setFontSize(20);
      doc.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
      doc.setFont("NotoSans", "bold");
      doc.text(
        formatCurrency(quotation.final_price),
        pageW / 2,
        160,
        { align: "center" }
      );

      // Footer tagline
      doc.setFontSize(10);
      doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
      doc.setFont("NotoSans", "normal");
      doc.text("Proposta exclusiva e personalizada", pageW / 2, pageH - 20, { align: "center" });

      addDraftWatermark();
    }

    // ===== PAGE 2 – MODEL HIGHLIGHTS =====
    function addModelHighlights() {
      doc.addPage();
      
      doc.setFontSize(22);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setFont("NotoSans", "bold");
      doc.text("Destaques do Modelo", margin, 40);

      // Divider
      doc.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
      doc.setLineWidth(1);
      doc.line(margin, 45, pageW - margin, 45);

      let yPos = 60;
      doc.setFontSize(12);
      doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
      doc.setFont("NotoSans", "normal");

      const highlights = [];
      if (quotation.yacht_models.cabins) {
        highlights.push(`Camarotes: ${quotation.yacht_models.cabins}`);
      }
      if (quotation.yacht_models.bathrooms) {
        highlights.push(`Banheiros: ${quotation.yacht_models.bathrooms}`);
      }
      if (quotation.yacht_models.engines) {
        highlights.push(`Motorizacao: ${quotation.yacht_models.engines}`);
      }
      if (quotation.yacht_models.max_speed) {
        highlights.push(`Velocidade Maxima: ${formatNumber(quotation.yacht_models.max_speed, 1)} nos`);
      }
      if (quotation.yacht_models.range_nautical_miles) {
        highlights.push(`Autonomia: ${formatNumber(quotation.yacht_models.range_nautical_miles, 0)} milhas nauticas`);
      }

      highlights.forEach((line) => {
        doc.setFont("NotoSans", "bold");
        doc.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
        doc.text("•", margin, yPos);
        
        doc.setFont("NotoSans", "normal");
        doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
        doc.text(line, margin + 8, yPos);
        yPos += 10;
      });

      addDraftWatermark();
    }

    // ===== PAGE 3 – RESUMO FINANCEIRO =====
    function addFinancialSummary() {
      doc.addPage();
      
      doc.setFontSize(22);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setFont("NotoSans", "bold");
      doc.text("Resumo Financeiro", margin, 40);

      // Divider
      doc.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
      doc.setLineWidth(1);
      doc.line(margin, 45, pageW - margin, 45);

      let yPos = 65;
      doc.setFontSize(12);

      const financialItems = [
        { label: "Valor Base", value: quotation.base_price, bold: false },
        { label: "Desconto Base (%)", value: quotation.base_discount_percentage, isPercent: true, bold: false },
        { label: "Valor Base Final", value: quotation.final_base_price, bold: false },
        { label: "Opcionais", value: quotation.total_options_price, bold: false },
        { label: "Desconto Opcionais (%)", value: quotation.options_discount_percentage, isPercent: true, bold: false },
        { label: "Opcionais Final", value: quotation.final_options_price, bold: false },
        { label: "Customizacoes", value: quotation.total_customizations_price, bold: false },
        { label: "Valor Total", value: quotation.final_price, bold: true },
      ];

      financialItems.forEach((item) => {
        if (item.bold) {
          doc.setFont("NotoSans", "bold");
          doc.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
          doc.setFontSize(16);
        } else {
          doc.setFont("NotoSans", "normal");
          doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
          doc.setFontSize(12);
        }

        doc.text(item.label, margin, yPos);
        
        const valueText = item.isPercent 
          ? `${formatNumber(item.value, 2)}%`
          : formatCurrency(item.value);
        
        doc.text(valueText, pageW - margin, yPos, { align: "right" });
        yPos += item.bold ? 15 : 10;
      });

      addDraftWatermark();
    }

    // ===== PAGE 4 – OPTIONAL ITEMS =====
    function addOptionalItems() {
      if (!quotation.quotation_options || quotation.quotation_options.length === 0) {
        return;
      }

      doc.addPage();
      
      doc.setFontSize(22);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setFont("NotoSans", "bold");
      doc.text("Itens Opcionais Selecionados", margin, 40);

      doc.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
      doc.setLineWidth(1);
      doc.line(margin, 45, pageW - margin, 45);

      let yPos = 60;
      doc.setFontSize(10);

      quotation.quotation_options.forEach((qo: any) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 30;
          addDraftWatermark();
        }

        // Option name
        doc.setFont("NotoSans", "bold");
        doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
        const optionName = qo.options?.name || "Item";
        doc.text(`• ${optionName}`, margin, yPos);
        yPos += 6;

        // Details
        doc.setFont("NotoSans", "normal");
        doc.setTextColor(COLORS.grayDark[0], COLORS.grayDark[1], COLORS.grayDark[2]);
        doc.setFontSize(9);
        
        const details = [];
        if (qo.quantity > 1) details.push(`Qtd: ${qo.quantity}`);
        if (qo.options?.code) details.push(`Codigo: ${qo.options.code}`);
        details.push(`Preco Unit: ${formatCurrency(qo.unit_price)}`);
        details.push(`Total: ${formatCurrency(qo.total_price)}`);

        doc.text(details.join(" | "), margin + 5, yPos);
        yPos += 8;

        doc.setFontSize(10);
      });

      addDraftWatermark();
    }

    // ===== PAGES 5-N – MEMORIAL DESCRITIVO =====
    function addMemorialDescritivo() {
      if (!memorialClean || memorialClean.length === 0) {
        return;
      }

      doc.addPage();
      
      doc.setFontSize(22);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setFont("NotoSans", "bold");
      doc.text("Memorial Descritivo", margin, 40);
      
      doc.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
      doc.setLineWidth(1);
      doc.line(margin, 45, pageW - margin, 45);

      let yPos = 60;
      let currentCategory = "";

      memorialClean.forEach((item: any) => {
        const category = item.memorial_categories?.label || "Outros";
        
        // Add category header
        if (category !== currentCategory) {
          if (yPos > 265) {
            doc.addPage();
            yPos = 25;
            addDraftWatermark();
          }
          
          doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
          doc.roundedRect(margin, yPos - 5, pageW - (margin * 2), 10, 2, 2, "F");
          
          doc.setFontSize(11);
          doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
          doc.setFont("NotoSans", "bold");
          doc.text(category.toUpperCase(), margin + 3, yPos + 2);
          yPos += 12;
          currentCategory = category;
        }
        
        // Check if we need a new page
        if (yPos > 270) {
          doc.addPage();
          yPos = 25;
          addDraftWatermark();
        }
        
        // Item details
        doc.setFontSize(9);
        doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
        doc.setFont("NotoSans", "normal");
        
        // Item name
        const itemNameLines = doc.splitTextToSize(item.item_name, pageW - 50);
        doc.text(`• ${itemNameLines[0]}${itemNameLines.length > 1 ? "..." : ""}`, margin + 3, yPos);
        yPos += 5;
        
        // Brand, model, quantity
        const details = [];
        if (item.brand && item.brand !== "null") details.push(`Marca: ${item.brand}`);
        if (item.model && item.model !== "null") details.push(`Modelo: ${item.model}`);
        if (item.quantity > 1) details.push(`Qtd: ${item.quantity}`);

        if (details.length > 0) {
          doc.setFontSize(8);
          doc.setTextColor(COLORS.grayDark[0], COLORS.grayDark[1], COLORS.grayDark[2]);
          doc.text(`  ${details.join(" | ")}`, margin + 5, yPos);
          yPos += 5;
        }

        yPos += 2;
      });

      addDraftWatermark();
    }

    // ===== LAST PAGE – CONTACT =====
    function addContactPage() {
      doc.addPage();
      
      doc.setFontSize(22);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setFont("NotoSans", "bold");
      doc.text("Contato", margin, 40);

      doc.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
      doc.setLineWidth(1);
      doc.line(margin, 45, pageW - margin, 45);

      let yPos = 65;
      doc.setFontSize(12);
      doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
      doc.setFont("NotoSans", "normal");

      doc.text(`Consultor: ${quotation.users.full_name}`, margin, yPos);
      yPos += 10;
      doc.text(`Email: ${quotation.users.email}`, margin, yPos);
      yPos += 10;
      doc.text(`Departamento: ${quotation.users.department}`, margin, yPos);
      yPos += 20;

      // Client info
      doc.setFont("NotoSans", "bold");
      doc.text("Cliente:", margin, yPos);
      yPos += 10;
      doc.setFont("NotoSans", "normal");
      doc.text(`Nome: ${quotation.clients?.name || quotation.client_name}`, margin, yPos);
      yPos += 10;
      if (quotation.clients?.email || quotation.client_email) {
        doc.text(`Email: ${quotation.clients?.email || quotation.client_email}`, margin, yPos);
        yPos += 10;
      }
      if (quotation.clients?.phone || quotation.client_phone) {
        doc.text(`Telefone: ${quotation.clients?.phone || quotation.client_phone}`, margin, yPos);
      }

      // Footer
      doc.setFontSize(10);
      doc.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
      doc.setFont("NotoSans", "italic");
      doc.text(
        `Proposta valida ate ${formatDate(quotation.valid_until)}`,
        pageW / 2,
        pageH - 30,
        { align: "center" }
      );
      doc.text(
        "OKEAN YACHTS - Excelencia em iates de luxo",
        pageW / 2,
        pageH - 20,
        { align: "center" }
      );

      addDraftWatermark();
    }

    // ===== BUILD PDF =====
    await addCoverPage();
    addModelHighlights();
    addFinancialSummary();
    addOptionalItems();
    addMemorialDescritivo();
    addContactPage();

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
