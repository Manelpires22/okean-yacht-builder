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
};

interface ContractPDFRequest {
  contract_id: string;
}

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

    const { contract_id }: ContractPDFRequest = await req.json();
    if (!contract_id) throw new Error("contract_id is required");

    // Fetch contract data with ATOs
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select(`
        *,
        client:clients(*),
        yacht_model:yacht_models(*),
        atos:additional_to_orders(*)
      `)
      .eq("id", contract_id)
      .single();

    if (contractError || !contract) {
      throw new Error("Contract not found");
    }

    console.log("Contract found:", contract.contract_number);

    // Setup PDF
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    setupFont(doc);

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 20;

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

    // ===== COVER PAGE =====
    function addCoverPage() {
      // Navy background
      doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.rect(0, 0, pageW, pageH, "F");

      // Company name
      doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
      doc.setFontSize(36);
      setupFont(doc, "bold");
      doc.text("OKEAN YACHTS", pageW / 2, 80, { align: "center" });

      // Document title
      doc.setFontSize(22);
      setupFont(doc);
      doc.text("Resumo do Contrato", pageW / 2, 100, { align: "center" });

      // Contract number
      doc.setFontSize(18);
      setupFont(doc, "bold");
      doc.text(contract.contract_number, pageW / 2, 120, { align: "center" });

      // Client info
      doc.setFontSize(14);
      setupFont(doc);
      doc.text(
        `${contract.client?.name || "N/A"}`,
        pageW / 2,
        135,
        { align: "center" }
      );

      // Model
      doc.setFontSize(16);
      doc.text(
        contract.yacht_model?.name || "N/A",
        pageW / 2,
        150,
        { align: "center" }
      );

      // Total value (accent color)
      doc.setFontSize(28);
      doc.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
      setupFont(doc, "bold");
      doc.text(
        formatCurrency(contract.current_total_price),
        pageW / 2,
        175,
        { align: "center" }
      );

      // Footer
      doc.setFontSize(10);
      doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
      setupFont(doc);
      doc.text("Documento de Resumo Contratual", pageW / 2, pageH - 20, { align: "center" });
    }

    // ===== CONTRACT INFO PAGE =====
    function addContractInfo() {
      doc.addPage();

      doc.setFontSize(22);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      setupFont(doc, "bold");
      doc.text("Informações do Contrato", margin, 40);

      // Divider
      doc.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
      doc.setLineWidth(1);
      doc.line(margin, 45, pageW - margin, 45);

      let yPos = 65;
      doc.setFontSize(12);
      doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
      setupFont(doc);

      const infoItems = [
        { label: "Número do Contrato", value: contract.contract_number },
        { label: "Cliente", value: contract.client?.name || "N/A" },
        { label: "Modelo do Iate", value: contract.yacht_model?.name || "N/A" },
        { label: "Data de Assinatura", value: contract.signed_at ? formatDate(contract.signed_at) : "N/A" },
        { label: "Assinado por", value: contract.signed_by_name || "N/A" },
        { label: "Email", value: contract.signed_by_email || "N/A" },
        { label: "Status", value: contract.status === "active" ? "Ativo" : contract.status === "completed" ? "Concluído" : "Cancelado" },
      ];

      infoItems.forEach((item) => {
        setupFont(doc, "bold");
        doc.setTextColor(COLORS.grayDark[0], COLORS.grayDark[1], COLORS.grayDark[2]);
        doc.text(item.label + ":", margin, yPos);

        setupFont(doc);
        doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
        doc.text(item.value, margin + 60, yPos);

        yPos += 12;
      });
    }

    // ===== BASE VALUES PAGE =====
    function addBaseValues() {
      doc.addPage();

      doc.setFontSize(22);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      setupFont(doc, "bold");
      doc.text("Valores Contratuais Base", margin, 40);

      doc.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
      doc.setLineWidth(1);
      doc.line(margin, 45, pageW - margin, 45);

      // Box with base values
      let yPos = 70;
      doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
      doc.roundedRect(margin, yPos, pageW - 2 * margin, 50, 3, 3, "F");

      yPos += 15;
      doc.setFontSize(14);
      doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
      setupFont(doc);

      doc.text("Preço Base:", margin + 10, yPos);
      setupFont(doc, "bold");
      doc.text(formatCurrency(contract.base_price), pageW - margin - 10, yPos, { align: "right" });

      yPos += 15;
      setupFont(doc);
      doc.text("Prazo Base:", margin + 10, yPos);
      setupFont(doc, "bold");
      doc.text(`${contract.base_delivery_days} dias`, pageW - margin - 10, yPos, { align: "right" });
    }

    // ===== ATOs PAGE =====
    function addATOs() {
      const approvedATOs = contract.atos?.filter((ato: any) => ato.status === "approved") || [];

      if (approvedATOs.length === 0) return;

      doc.addPage();

      doc.setFontSize(22);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      setupFont(doc, "bold");
      doc.text("ATOs Aprovadas", margin, 40);

      doc.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
      doc.setLineWidth(1);
      doc.line(margin, 45, pageW - margin, 45);

      let yPos = 60;
      doc.setFontSize(11);

      approvedATOs.forEach((ato: any, index: number) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 30;
        }

        // ATO box
        doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
        doc.roundedRect(margin, yPos, pageW - 2 * margin, 35, 2, 2, "F");

        // ATO number and title
        setupFont(doc, "bold");
        doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        doc.text(`${ato.ato_number} - ${ato.title}`, margin + 5, yPos + 8);

        // Status badge
        doc.setFillColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
        doc.roundedRect(pageW - margin - 25, yPos + 3, 20, 6, 1, 1, "F");
        doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
        doc.setFontSize(8);
        doc.text("Aprovado", pageW - margin - 15, yPos + 7, { align: "center" });

        // Description
        yPos += 15;
        doc.setFontSize(9);
        doc.setTextColor(COLORS.grayDark[0], COLORS.grayDark[1], COLORS.grayDark[2]);
        setupFont(doc);
        if (ato.description) {
          const lines = doc.splitTextToSize(ato.description, pageW - 2 * margin - 10);
          doc.text(lines[0], margin + 5, yPos);
        }

        // Price and days impact
        yPos += 8;
        doc.setFontSize(10);
        setupFont(doc, "bold");
        doc.setTextColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
        doc.text(`+${formatCurrency(ato.price_impact || 0)}`, margin + 5, yPos);

        doc.setTextColor(COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]);
        doc.text(`+${ato.delivery_days_impact || 0} dias`, margin + 60, yPos);

        yPos += 15;
        doc.setFontSize(11);
      });
    }

    // ===== TOTALS PAGE =====
    function addTotals() {
      doc.addPage();

      doc.setFontSize(22);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      setupFont(doc, "bold");
      doc.text("Totais Atualizados", margin, 40);

      doc.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
      doc.setLineWidth(1);
      doc.line(margin, 45, pageW - margin, 45);

      // Calculate ATOs totals
      const approvedATOs = contract.atos?.filter((ato: any) => ato.status === "approved") || [];
      const totalATOsPrice = approvedATOs.reduce((sum: number, ato: any) => sum + (ato.price_impact || 0), 0);
      // ✅ CORRIGIDO: MAX ao invés de SUM para dias
      const totalATOsDays = approvedATOs.reduce((max: number, ato: any) => Math.max(max, ato.delivery_days_impact || 0), 0);

      let yPos = 70;
      doc.setFillColor(232, 244, 253);
      doc.roundedRect(margin, yPos, pageW - 2 * margin, 100, 3, 3, "F");

      yPos += 15;
      doc.setFontSize(14);
      doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
      setupFont(doc);

      // Base price
      doc.text("Preço Base:", margin + 10, yPos);
      setupFont(doc, "bold");
      doc.text(formatCurrency(contract.base_price), pageW - margin - 10, yPos, { align: "right" });

      // ATOs price
      if (totalATOsPrice > 0) {
        yPos += 12;
        setupFont(doc);
        doc.text("ATOs Aprovadas:", margin + 10, yPos);
        setupFont(doc, "bold");
        doc.setTextColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
        doc.text(`+${formatCurrency(totalATOsPrice)}`, pageW - margin - 10, yPos, { align: "right" });
      }

      // Divider
      yPos += 15;
      doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setLineWidth(0.5);
      doc.line(margin + 10, yPos, pageW - margin - 10, yPos);

      // Total price
      yPos += 12;
      doc.setFontSize(18);
      doc.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
      setupFont(doc, "bold");
      doc.text("VALOR TOTAL:", margin + 10, yPos);
      doc.text(formatCurrency(contract.current_total_price), pageW - margin - 10, yPos, { align: "right" });

      // Delivery days
      yPos += 20;
      doc.setFontSize(14);
      doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
      setupFont(doc);
      doc.text("Prazo Base:", margin + 10, yPos);
      setupFont(doc, "bold");
      doc.text(`${contract.base_delivery_days} dias`, pageW - margin - 10, yPos, { align: "right" });

      if (totalATOsDays > 0) {
        yPos += 12;
        setupFont(doc);
        doc.text("Impacto ATOs:", margin + 10, yPos);
        setupFont(doc, "bold");
        doc.setTextColor(COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]);
        doc.text(`+${totalATOsDays} dias`, pageW - margin - 10, yPos, { align: "right" });
      }

      yPos += 15;
      doc.setFontSize(16);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      setupFont(doc, "bold");
      doc.text("PRAZO TOTAL:", margin + 10, yPos);
      doc.text(`${contract.current_total_delivery_days} dias`, pageW - margin - 10, yPos, { align: "right" });
    }

    // ===== FOOTER PAGE =====
    function addFooter() {
      const currentPage = doc.internal.pages.length - 1;
      for (let i = 1; i <= currentPage; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
        setupFont(doc);
        doc.text(
          `Gerado em ${formatDate(new Date().toISOString())}`,
          pageW / 2,
          pageH - 10,
          { align: "center" }
        );
        doc.text(`Página ${i} de ${currentPage}`, pageW - margin, pageH - 10, { align: "right" });
      }
    }

    // Build PDF
    addCoverPage();
    addContractInfo();
    addBaseValues();
    addATOs();
    addTotals();
    addFooter();

    // Output PDF
    const pdfData = doc.output("arraybuffer");
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfData)));

    console.log("✓ Contract PDF generated successfully");

    return new Response(
      JSON.stringify({
        success: true,
        format: "pdf",
        data: base64Pdf,
        filename: `${contract.contract_number}.pdf`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error generating contract PDF:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
