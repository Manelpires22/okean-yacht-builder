import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function setupFont(doc: jsPDF, style: "normal" | "bold" = "normal") {
  doc.setFont("helvetica", style);
}

const COLORS = {
  primary: [16, 24, 48],
  accent: [245, 158, 11],
  light: [247, 248, 250],
  textDark: [30, 30, 30],
  textLight: [255, 255, 255],
  gray: [180, 180, 180],
  grayDark: [100, 100, 100],
  success: [34, 197, 94],
  warning: [245, 158, 11],
  error: [239, 68, 68],
};

interface ATOPDFRequest {
  ato_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== Generate ATO PDF Started ===");

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

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);
    };

    const formatDate = (date: string) => {
      return new Intl.DateTimeFormat("pt-BR").format(new Date(date));
    };

    // ===== COVER PAGE =====
    function addCoverPage() {
      doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.rect(0, 0, pageW, pageH, "F");

      doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
      doc.setFontSize(36);
      setupFont(doc, "bold");
      doc.text("OKEAN YACHTS", pageW / 2, 80, { align: "center" });

      doc.setFontSize(20);
      setupFont(doc);
      doc.text("Aditivo ao Contrato", pageW / 2, 105, { align: "center" });

      doc.setFontSize(24);
      setupFont(doc, "bold");
      doc.text(ato.ato_number, pageW / 2, 125, { align: "center" });

      // Status badge
      let statusColor = COLORS.gray;
      let statusText = "Pendente";
      
      if (ato.status === "approved") {
        statusColor = COLORS.success;
        statusText = "Aprovado";
      } else if (ato.status === "rejected") {
        statusColor = COLORS.error;
        statusText = "Rejeitado";
      }

      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.roundedRect(pageW / 2 - 25, 135, 50, 10, 2, 2, "F");
      doc.setFontSize(12);
      setupFont(doc, "bold");
      doc.text(statusText, pageW / 2, 142, { align: "center" });

      // Contract reference
      doc.setFontSize(12);
      setupFont(doc);
      doc.text(
        `Referência: ${ato.contract?.contract_number}`,
        pageW / 2,
        160,
        { align: "center" }
      );

      doc.setFontSize(10);
      doc.text("Documento de Aditivo Contratual", pageW / 2, pageH - 20, { align: "center" });
    }

    // ===== REFERENCE INFO =====
    function addReferenceInfo() {
      doc.addPage();

      doc.setFontSize(22);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      setupFont(doc, "bold");
      doc.text("Referência ao Contrato", margin, 40);

      doc.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
      doc.setLineWidth(1);
      doc.line(margin, 45, pageW - margin, 45);

      let yPos = 65;
      doc.setFillColor(240, 247, 255);
      doc.roundedRect(margin, yPos, pageW - 2 * margin, 45, 3, 3, "F");

      yPos += 12;
      doc.setFontSize(12);
      setupFont(doc);
      doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);

      doc.text("Contrato:", margin + 10, yPos);
      setupFont(doc, "bold");
      doc.text(ato.contract?.contract_number || "N/A", margin + 50, yPos);

      yPos += 10;
      setupFont(doc);
      doc.text("Cliente:", margin + 10, yPos);
      setupFont(doc, "bold");
      doc.text(ato.contract?.client?.name || "N/A", margin + 50, yPos);

      yPos += 10;
      setupFont(doc);
      doc.text("Modelo:", margin + 10, yPos);
      setupFont(doc, "bold");
      doc.text(ato.contract?.yacht_model?.name || "N/A", margin + 50, yPos);
    }

    // ===== ATO INFO =====
    function addATOInfo() {
      doc.addPage();

      doc.setFontSize(22);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      setupFont(doc, "bold");
      doc.text("Informações da ATO", margin, 40);

      doc.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
      doc.setLineWidth(1);
      doc.line(margin, 45, pageW - margin, 45);

      let yPos = 65;
      doc.setFontSize(12);
      setupFont(doc);

      const info = [
        { label: "Número", value: ato.ato_number },
        { label: "Data de Solicitação", value: ato.requested_at ? formatDate(ato.requested_at) : "N/A" },
        { label: "Status", value: ato.status === "approved" ? "Aprovado" : ato.status === "rejected" ? "Rejeitado" : "Pendente" },
      ];

      if (ato.approved_at) {
        info.push({ label: "Data de Aprovação", value: formatDate(ato.approved_at) });
      }

      info.forEach((item) => {
        setupFont(doc, "bold");
        doc.setTextColor(COLORS.grayDark[0], COLORS.grayDark[1], COLORS.grayDark[2]);
        doc.text(item.label + ":", margin, yPos);

        setupFont(doc);
        doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
        doc.text(item.value, margin + 60, yPos);
        yPos += 12;
      });

      // Title and description
      yPos += 10;
      doc.setFontSize(16);
      setupFont(doc, "bold");
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.text(ato.title, margin, yPos);

      if (ato.description) {
        yPos += 10;
        doc.setFontSize(11);
        setupFont(doc);
        doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
        const lines = doc.splitTextToSize(ato.description, pageW - 2 * margin);
        lines.forEach((line: string) => {
          doc.text(line, margin, yPos);
          yPos += 6;
        });
      }
    }

    // ===== CONFIGURATIONS =====
    function addConfigurations() {
      if (!configurations || configurations.length === 0) return;

      doc.addPage();

      doc.setFontSize(22);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      setupFont(doc, "bold");
      doc.text("Itens Configurados", margin, 40);

      doc.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
      doc.setLineWidth(1);
      doc.line(margin, 45, pageW - margin, 45);

      let yPos = 60;
      doc.setFontSize(10);

      configurations.forEach((config: any) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 30;
        }

        // Type badge
        let typeColor = COLORS.primary;
        let typeName = "Item";
        
        if (config.item_type === "option") {
          typeColor = COLORS.accent;
          typeName = "OPCIONAL";
        } else if (config.item_type === "memorial") {
          typeColor = [100, 100, 200];
          typeName = "MEMORIAL";
        } else if (config.item_type === "customization") {
          typeColor = COLORS.success;
          typeName = "CUSTOMIZAÇÃO";
        }

        doc.setFillColor(typeColor[0], typeColor[1], typeColor[2]);
        doc.roundedRect(margin, yPos, 25, 5, 1, 1, "F");
        doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
        doc.setFontSize(7);
        setupFont(doc, "bold");
        doc.text(typeName, margin + 12.5, yPos + 3.5, { align: "center" });

        // Item name
        yPos += 8;
        doc.setFontSize(11);
        doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
        const itemName = config.configuration_details?.name || 
                        config.configuration_details?.item_name || 
                        "Item não especificado";
        doc.text(`• ${itemName}`, margin, yPos);
        yPos += 6;

        // Sub-items
        if (config.sub_items) {
          try {
            const subItems = typeof config.sub_items === 'string' 
              ? JSON.parse(config.sub_items) 
              : config.sub_items;
            
            if (Array.isArray(subItems) && subItems.length > 0) {
              doc.setFontSize(9);
              setupFont(doc);
              doc.setTextColor(COLORS.grayDark[0], COLORS.grayDark[1], COLORS.grayDark[2]);
              
              subItems.forEach((sub: any) => {
                if (yPos > 270) {
                  doc.addPage();
                  yPos = 30;
                }
                const label = sub.label || sub.name || "";
                const value = sub.value || sub.selectedValue || "N/A";
                doc.text(`  → ${label}: ${value}`, margin + 5, yPos);
                yPos += 5;
              });
            }
          } catch (e) {
            console.error("Error parsing sub_items:", e);
          }
        }

        // Notes
        if (config.notes) {
          doc.setFontSize(9);
          doc.setTextColor(COLORS.grayDark[0], COLORS.grayDark[1], COLORS.grayDark[2]);
          setupFont(doc);
          const notesLines = doc.splitTextToSize(`Obs: ${config.notes}`, pageW - 2 * margin - 10);
          notesLines.forEach((line: string) => {
            if (yPos > 270) {
              doc.addPage();
              yPos = 30;
            }
            doc.text(line, margin + 5, yPos);
            yPos += 5;
          });
        }

        yPos += 8;
      });
    }

    // ===== FINANCIAL IMPACT =====
    function addFinancialImpact() {
      doc.addPage();

      doc.setFontSize(22);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      setupFont(doc, "bold");
      doc.text("Impacto Financeiro e Prazo", margin, 40);

      doc.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
      doc.setLineWidth(1);
      doc.line(margin, 45, pageW - margin, 45);

      let yPos = 70;
      doc.setFillColor(232, 244, 253);
      doc.roundedRect(margin, yPos, pageW - 2 * margin, 70, 3, 3, "F");

      yPos += 15;
      doc.setFontSize(14);
      setupFont(doc);
      doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);

      if (ato.price_impact) {
        doc.text("Valor Base da ATO:", margin + 10, yPos);
        setupFont(doc, "bold");
        doc.text(formatCurrency(ato.price_impact), pageW - margin - 10, yPos, { align: "right" });
      }

      if (ato.discount_percentage && ato.discount_percentage > 0) {
        yPos += 12;
        setupFont(doc);
        doc.text(`Desconto (${ato.discount_percentage}%):`, margin + 10, yPos);
        setupFont(doc, "bold");
        doc.setTextColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
        const discount = (ato.price_impact || 0) * (ato.discount_percentage / 100);
        doc.text(`-${formatCurrency(discount)}`, pageW - margin - 10, yPos, { align: "right" });
      }

      yPos += 15;
      doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.line(margin + 10, yPos, pageW - margin - 10, yPos);

      yPos += 12;
      doc.setFontSize(18);
      doc.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
      setupFont(doc, "bold");
      doc.text("VALOR FINAL:", margin + 10, yPos);
      const finalPrice = (ato.price_impact || 0) * (1 - (ato.discount_percentage || 0) / 100);
      doc.text(formatCurrency(finalPrice), pageW - margin - 10, yPos, { align: "right" });

      if (ato.delivery_days_impact) {
        yPos += 25;
        doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
        doc.roundedRect(margin, yPos, pageW - 2 * margin, 20, 2, 2, "F");
        
        yPos += 13;
        doc.setFontSize(14);
        doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
        setupFont(doc);
        doc.text("Impacto no Prazo:", margin + 10, yPos);
        setupFont(doc, "bold");
        doc.setTextColor(COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]);
        doc.text(`+${ato.delivery_days_impact} dias`, pageW - margin - 10, yPos, { align: "right" });
      }
    }

    // ===== FOOTER =====
    function addFooter() {
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
        setupFont(doc);
        doc.text(`Gerado em ${formatDate(new Date().toISOString())}`, pageW / 2, pageH - 10, { align: "center" });
      }
    }

    // Build PDF
    addCoverPage();
    addReferenceInfo();
    addATOInfo();
    addConfigurations();
    addFinancialImpact();
    addFooter();

    const pdfData = doc.output("arraybuffer");
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfData)));

    console.log("✓ ATO PDF generated successfully");

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
