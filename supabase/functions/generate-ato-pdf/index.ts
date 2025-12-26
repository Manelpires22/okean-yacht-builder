import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

// Importar design system
import {
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
  addFootersToAllPages,
  drawPremiumCover,
  drawInfoList,
  drawFinancialSummary,
  drawItemCard,
} from "../_shared/pdf-design-system.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ATOPDFRequest {
  ato_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== Generate Premium ATO PDF Started ===");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) throw new Error("Unauthorized");

    const { ato_id }: ATOPDFRequest = await req.json();
    if (!ato_id) throw new Error("ato_id is required");

    const { data: ato, error: atoError } = await supabase
      .from("additional_to_orders")
      .select(`
        *,
        contract:contracts(
          *,
          client:clients(*),
          yacht_model:yacht_models(*)
        )
      `)
      .eq("id", ato_id)
      .single();

    if (atoError || !ato) throw new Error("ATO not found");

    const { data: configurations } = await supabase
      .from("ato_configurations")
      .select("*")
      .eq("ato_id", ato_id);

    console.log("ATO found:", ato.ato_number);

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    setupFont(doc);

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageW - (margin * 2);

    // ===== CAPA PREMIUM =====
    function addCoverPage() {
      // Determinar status
      let badgeText = "Pendente";
      let badgeStatus: "approved" | "pending" | "rejected" = "pending";
      
      if (ato.status === "approved") {
        badgeText = "Aprovado";
        badgeStatus = "approved";
      } else if (ato.status === "rejected") {
        badgeText = "Rejeitado";
        badgeStatus = "rejected";
      }

      drawPremiumCover(doc, pageW, pageH, {
        title: "Aditivo ao Contrato",
        subtitle: ato.title,
        documentNumber: ato.ato_number,
        clientName: ato.contract?.client?.name,
        modelName: ato.contract?.yacht_model?.name,
        totalValue: ato.price_impact ? (ato.price_impact * (1 - (ato.discount_percentage || 0) / 100)) : undefined,
        date: formatDate(ato.requested_at || ato.created_at),
        badgeText: badgeText,
        badgeStatus: badgeStatus,
      });

      // Referência ao contrato original
      let yPos = pageH - 30;
      setColor(doc, COLORS.textMuted, "text");
      doc.setFontSize(9);
      setupFont(doc);
      doc.text(`Ref. Contrato: ${ato.contract?.contract_number || "N/A"}`, pageW / 2, yPos, { align: "center" });
    }

    // ===== INFORMAÇÕES DA ATO =====
    function addATOInfoPage() {
      doc.addPage();
      let yPos = drawPageHeader("Informações do Aditivo", pageW, margin);

      // Box com informações básicas
      drawPremiumBox(doc, margin, yPos, contentWidth, 50, "light");
      
      yPos += 15;
      const infoItems = [
        { label: "Número da ATO", value: ato.ato_number },
        { label: "Data de Solicitação", value: formatDateShort(ato.requested_at || ato.created_at) },
        { label: "Status", value: ato.status === "approved" ? "Aprovado" : ato.status === "rejected" ? "Rejeitado" : "Pendente" },
      ];

      if (ato.approved_at) {
        infoItems.push({ label: "Data de Aprovação", value: formatDateShort(ato.approved_at) });
      }

      yPos = drawInfoList(doc, infoItems, yPos, margin + 10, 55);

      // Referência ao contrato
      yPos += 20;
      doc.setFontSize(14);
      setupFont(doc, "bold");
      setColor(doc, COLORS.navy, "text");
      doc.text("Referência ao Contrato", margin, yPos);
      
      yPos += 5;
      drawGoldLine(doc, yPos, margin, margin + 80);
      
      yPos += 15;
      drawPremiumBox(doc, margin, yPos, contentWidth, 40, "info");
      
      yPos += 12;
      const contractInfo = [
        { label: "Contrato", value: ato.contract?.contract_number || "N/A" },
        { label: "Cliente", value: ato.contract?.client?.name || "N/A" },
        { label: "Modelo", value: ato.contract?.yacht_model?.name || "N/A" },
      ];
      drawInfoList(doc, contractInfo, yPos, margin + 10, 45);

      // Título e descrição da ATO
      yPos += 55;
      doc.setFontSize(14);
      setupFont(doc, "bold");
      setColor(doc, COLORS.navy, "text");
      doc.text("Descrição do Aditivo", margin, yPos);
      
      yPos += 5;
      drawGoldLine(doc, yPos, margin, margin + 70);

      yPos += 15;
      doc.setFontSize(16);
      setupFont(doc, "bold");
      setColor(doc, COLORS.textDark, "text");
      doc.text(ato.title, margin, yPos);

      if (ato.description) {
        yPos += 10;
        doc.setFontSize(11);
        setupFont(doc);
        setColor(doc, COLORS.textMuted, "text");
        const lines = doc.splitTextToSize(ato.description, contentWidth);
        lines.forEach((line: string) => {
          doc.text(line, margin, yPos);
          yPos += 6;
        });
      }

      // Notas se houver
      if (ato.notes) {
        yPos += 10;
        drawPremiumBox(doc, margin, yPos, contentWidth, 30, "light");
        yPos += 10;
        doc.setFontSize(9);
        setupFont(doc, "italic");
        setColor(doc, COLORS.textMuted, "text");
        const notesLines = doc.splitTextToSize(`Observações: ${ato.notes}`, contentWidth - 20);
        notesLines.forEach((line: string) => {
          doc.text(line, margin + 10, yPos);
          yPos += 5;
        });
      }
    }

    // ===== CONFIGURAÇÕES =====
    function addConfigurationsPage() {
      if (!configurations || configurations.length === 0) return;

      doc.addPage();
      let yPos = drawPageHeader("Itens Configurados", pageW, margin);

      configurations.forEach((config: any, index: number) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = drawPageHeader("Itens Configurados (cont.)", pageW, margin);
        }

        // Tipo do item
        let typeName = "ITEM";
        let typeColor = COLORS.navy;
        
        if (config.item_type === "option") {
          typeName = "OPCIONAL";
          typeColor = COLORS.gold;
        } else if (config.item_type === "memorial") {
          typeName = "MEMORIAL";
          typeColor = COLORS.info;
        } else if (config.item_type === "customization") {
          typeName = "CUSTOMIZAÇÃO";
          typeColor = COLORS.success;
        } else if (config.item_type === "upgrade") {
          typeName = "UPGRADE";
          typeColor = COLORS.warning;
        }

        // Card do item
        const cardHeight = config.sub_items ? 45 : 35;
        drawPremiumBox(doc, margin, yPos, contentWidth, cardHeight, "light");

        // Badge do tipo
        yPos += 8;
        setColor(doc, typeColor, "fill");
        doc.roundedRect(margin + 5, yPos - 5, 28, 7, 2, 2, "F");
        setColor(doc, COLORS.white, "text");
        doc.setFontSize(7);
        setupFont(doc, "bold");
        doc.text(typeName, margin + 19, yPos, { align: "center" });

        // Nome do item
        yPos += 10;
        doc.setFontSize(11);
        setupFont(doc, "bold");
        setColor(doc, COLORS.textDark, "text");
        const itemName = config.configuration_details?.name || 
                        config.configuration_details?.item_name || 
                        "Item não especificado";
        doc.text(itemName, margin + 5, yPos);

        // Preço (se houver)
        if (config.calculated_price) {
          doc.setFontSize(11);
          setupFont(doc, "bold");
          setColor(doc, COLORS.navy, "text");
          doc.text(formatCurrency(config.calculated_price), pageW - margin - 5, yPos, { align: "right" });
        }

        // Sub-itens
        if (config.sub_items) {
          try {
            const subItems = typeof config.sub_items === 'string' 
              ? JSON.parse(config.sub_items) 
              : config.sub_items;
            
            if (Array.isArray(subItems) && subItems.length > 0) {
              yPos += 8;
              doc.setFontSize(8);
              setupFont(doc);
              setColor(doc, COLORS.textMuted, "text");
              
              const subItemsText = subItems.slice(0, 3).map((sub: any) => {
                const label = sub.label || sub.name || "";
                const value = sub.value || sub.selectedValue || "";
                return `${label}: ${value}`;
              }).join(" • ");
              
              doc.text(subItemsText, margin + 5, yPos);
            }
          } catch (e) {
            console.error("Error parsing sub_items:", e);
          }
        }

        // Dias de impacto (se houver)
        if (config.delivery_impact_days) {
          yPos += 8;
          doc.setFontSize(8);
          setupFont(doc);
          setColor(doc, COLORS.warning, "text");
          doc.text(`+${config.delivery_impact_days} dias no prazo`, margin + 5, yPos);
        }

        yPos += cardHeight - 20;
      });
    }

    // ===== IMPACTO FINANCEIRO =====
    function addFinancialImpactPage() {
      doc.addPage();
      let yPos = drawPageHeader("Impacto Financeiro", pageW, margin);

      // Resumo financeiro
      const financialItems: Array<{ label: string; value: number; highlight?: boolean; negative?: boolean }> = [];
      
      if (ato.original_price_impact || ato.price_impact) {
        financialItems.push({
          label: "Valor Base da ATO",
          value: ato.original_price_impact || ato.price_impact || 0
        });
      }

      if (ato.discount_percentage && ato.discount_percentage > 0) {
        const discountAmount = (ato.original_price_impact || ato.price_impact || 0) * (ato.discount_percentage / 100);
        financialItems.push({
          label: `Desconto (${ato.discount_percentage}%)`,
          value: discountAmount,
          negative: true
        });
      }

      const finalPrice = (ato.price_impact || 0);
      
      if (financialItems.length > 0) {
        yPos = drawFinancialSummary(
          doc,
          financialItems,
          { label: "VALOR FINAL DA ATO", value: finalPrice },
          margin,
          yPos,
          contentWidth
        );
      } else {
        // Se não houver itens financeiros
        drawPremiumBox(doc, margin, yPos, contentWidth, 40, "info");
        yPos += 25;
        doc.setFontSize(12);
        setupFont(doc);
        setColor(doc, COLORS.textMuted, "text");
        doc.text("Sem impacto financeiro", pageW / 2, yPos, { align: "center" });
        yPos += 40;
      }

      // Impacto no prazo
      yPos += 20;
      doc.setFontSize(14);
      setupFont(doc, "bold");
      setColor(doc, COLORS.navy, "text");
      doc.text("Impacto no Prazo de Entrega", margin, yPos);
      
      yPos += 5;
      drawGoldLine(doc, yPos, margin, margin + 90);

      yPos += 15;
      if (ato.delivery_days_impact && ato.delivery_days_impact > 0) {
        drawPremiumBox(doc, margin, yPos, contentWidth, 35, "warning");
        
        yPos += 15;
        doc.setFontSize(12);
        setupFont(doc);
        setColor(doc, COLORS.textDark, "text");
        doc.text("Dias adicionais:", margin + 15, yPos);
        
        doc.setFontSize(18);
        setupFont(doc, "bold");
        setColor(doc, COLORS.warning, "text");
        doc.text(`+${ato.delivery_days_impact} dias`, pageW - margin - 15, yPos, { align: "right" });
      } else {
        drawPremiumBox(doc, margin, yPos, contentWidth, 30, "success");
        
        yPos += 18;
        doc.setFontSize(12);
        setupFont(doc);
        setColor(doc, COLORS.success, "text");
        doc.text("✓ Sem impacto no prazo de entrega", pageW / 2, yPos, { align: "center" });
      }

      // Timeline de aprovações (se aprovado)
      if (ato.status === "approved" && ato.approved_at) {
        yPos += 50;
        doc.setFontSize(14);
        setupFont(doc, "bold");
        setColor(doc, COLORS.navy, "text");
        doc.text("Timeline de Aprovação", margin, yPos);
        
        yPos += 5;
        drawGoldLine(doc, yPos, margin, margin + 80);

        yPos += 20;
        
        // Solicitação
        setColor(doc, COLORS.info, "fill");
        doc.circle(margin + 10, yPos, 5, "F");
        setColor(doc, COLORS.info, "draw");
        doc.setLineWidth(0.5);
        doc.line(margin + 10, yPos + 5, margin + 10, yPos + 25);
        
        doc.setFontSize(10);
        setupFont(doc, "bold");
        setColor(doc, COLORS.textDark, "text");
        doc.text("Solicitação", margin + 20, yPos - 2);
        doc.setFontSize(9);
        setupFont(doc);
        setColor(doc, COLORS.textMuted, "text");
        doc.text(formatDateShort(ato.requested_at || ato.created_at), margin + 20, yPos + 6);

        yPos += 30;
        
        // Aprovação
        setColor(doc, COLORS.success, "fill");
        doc.circle(margin + 10, yPos, 5, "F");
        
        doc.setFontSize(10);
        setupFont(doc, "bold");
        setColor(doc, COLORS.textDark, "text");
        doc.text("Aprovado", margin + 20, yPos - 2);
        doc.setFontSize(9);
        setupFont(doc);
        setColor(doc, COLORS.textMuted, "text");
        doc.text(formatDateShort(ato.approved_at), margin + 20, yPos + 6);
      }
    }

    // Build PDF
    addCoverPage();
    addATOInfoPage();
    addConfigurationsPage();
    addFinancialImpactPage();
    addFootersToAllPages(doc, pageW, pageH, `ATO ${ato.ato_number}`, margin);

    const pdfData = doc.output("arraybuffer");
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfData)));

    console.log("✓ Premium ATO PDF generated successfully");

    return new Response(
      JSON.stringify({
        success: true,
        format: "pdf",
        data: base64Pdf,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error generating ATO PDF:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
