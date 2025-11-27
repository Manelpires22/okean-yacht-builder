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
};

interface OriginalContractPDFRequest {
  contract_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== Generate Original Contract PDF Started ===");

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

    const { contract_id }: OriginalContractPDFRequest = await req.json();
    if (!contract_id) throw new Error("contract_id is required");

    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select(`
        *,
        client:clients(*),
        yacht_model:yacht_models(*),
        quotation:quotations(*)
      `)
      .eq("id", contract_id)
      .single();

    if (contractError || !contract) {
      throw new Error("Contract not found");
    }

    const baseSnapshot = contract.base_snapshot as any;
    if (!baseSnapshot) {
      throw new Error("No base snapshot available");
    }

    console.log("Contract found:", contract.contract_number);

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

      doc.setFontSize(24);
      setupFont(doc);
      doc.text("Contrato Original", pageW / 2, 105, { align: "center" });

      // Badge
      doc.setFillColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
      doc.roundedRect(pageW / 2 - 40, 115, 80, 12, 2, 2, "F");
      doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
      doc.setFontSize(10);
      setupFont(doc, "bold");
      doc.text("COMO APROVADO PELO CLIENTE", pageW / 2, 123, { align: "center" });

      doc.setFontSize(18);
      doc.setTextColor(COLORS.textLight[0], COLORS.textLight[1], COLORS.textLight[2]);
      setupFont(doc, "bold");
      doc.text(contract.contract_number, pageW / 2, 145, { align: "center" });

      doc.setFontSize(14);
      setupFont(doc);
      doc.text(contract.client?.name || "N/A", pageW / 2, 160, { align: "center" });
      doc.text(contract.yacht_model?.name || "N/A", pageW / 2, 172, { align: "center" });

      doc.setFontSize(10);
      doc.text("Documento de Registro Original", pageW / 2, pageH - 20, { align: "center" });
    }

    // ===== CONTRACT INFO =====
    function addContractInfo() {
      doc.addPage();

      doc.setFontSize(22);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      setupFont(doc, "bold");
      doc.text("Informações do Contrato Original", margin, 40);

      doc.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
      doc.setLineWidth(1);
      doc.line(margin, 45, pageW - margin, 45);

      let yPos = 65;
      doc.setFontSize(12);
      setupFont(doc);

      const info = [
        { label: "Contrato", value: contract.contract_number },
        { label: "Data de Assinatura", value: contract.signed_at ? formatDate(contract.signed_at) : "N/A" },
        { label: "Cliente", value: contract.client?.name || "N/A" },
        { label: "Email", value: contract.signed_by_email || "N/A" },
        { label: "Modelo", value: contract.yacht_model?.name || "N/A" },
        { label: "Código", value: contract.yacht_model?.code || "N/A" },
      ];

      info.forEach((item) => {
        setupFont(doc, "bold");
        doc.setTextColor(COLORS.grayDark[0], COLORS.grayDark[1], COLORS.grayDark[2]);
        doc.text(item.label + ":", margin, yPos);

        setupFont(doc);
        doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
        doc.text(item.value, margin + 55, yPos);
        yPos += 12;
      });
    }

    // ===== SELECTED OPTIONS =====
    function addSelectedOptions() {
      const options = baseSnapshot.selectedOptions || [];
      if (options.length === 0) return;

      doc.addPage();

      doc.setFontSize(22);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      setupFont(doc, "bold");
      doc.text("Opcionais Selecionados (Original)", margin, 40);

      doc.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
      doc.setLineWidth(1);
      doc.line(margin, 45, pageW - margin, 45);

      let yPos = 60;
      doc.setFontSize(10);

      options.forEach((opt: any) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 30;
        }

        setupFont(doc, "bold");
        doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
        doc.text(`• ${opt.name || "N/A"}`, margin, yPos);
        yPos += 6;

        setupFont(doc);
        doc.setFontSize(9);
        doc.setTextColor(COLORS.grayDark[0], COLORS.grayDark[1], COLORS.grayDark[2]);
        
        const details = [];
        if (opt.quantity && opt.quantity > 1) details.push(`Qtd: ${opt.quantity}`);
        if (opt.unit_price) details.push(`Unit: ${formatCurrency(opt.unit_price)}`);
        if (opt.total_price) details.push(`Total: ${formatCurrency(opt.total_price)}`);
        
        if (details.length > 0) {
          doc.text(details.join(" | "), margin + 5, yPos);
          yPos += 6;
        }

        yPos += 4;
        doc.setFontSize(10);
      });
    }

    // ===== MEMORIAL ITEMS =====
    function addMemorialItems() {
      const memorial = baseSnapshot.memorialItems || [];
      if (memorial.length === 0) return;

      doc.addPage();

      doc.setFontSize(22);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      setupFont(doc, "bold");
      doc.text("Memorial Descritivo Original", margin, 40);

      doc.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
      doc.setLineWidth(1);
      doc.line(margin, 45, pageW - margin, 45);

      let yPos = 60;
      doc.setFontSize(9);

      memorial.forEach((item: any) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 30;
        }

        setupFont(doc, "bold");
        doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
        doc.text(`• ${item.item_name || "N/A"}`, margin, yPos);
        yPos += 5;

        setupFont(doc);
        doc.setTextColor(COLORS.grayDark[0], COLORS.grayDark[1], COLORS.grayDark[2]);
        
        const details = [];
        if (item.brand) details.push(`Marca: ${item.brand}`);
        if (item.model) details.push(`Modelo: ${item.model}`);
        if (item.quantity) details.push(`Qtd: ${item.quantity}`);
        
        if (details.length > 0) {
          doc.text(details.join(" | "), margin + 5, yPos);
          yPos += 5;
        }

        yPos += 3;
      });
    }

    // ===== FINANCIAL SUMMARY =====
    function addFinancialSummary() {
      doc.addPage();

      doc.setFontSize(22);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      setupFont(doc, "bold");
      doc.text("Resumo Financeiro Original", margin, 40);

      doc.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
      doc.setLineWidth(1);
      doc.line(margin, 45, pageW - margin, 45);

      let yPos = 70;
      doc.setFillColor(232, 244, 253);
      doc.roundedRect(margin, yPos, pageW - 2 * margin, 80, 3, 3, "F");

      yPos += 15;
      doc.setFontSize(14);
      setupFont(doc);
      doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);

      doc.text("Preço Base:", margin + 10, yPos);
      setupFont(doc, "bold");
      doc.text(formatCurrency(contract.base_price), pageW - margin - 10, yPos, { align: "right" });

      if (baseSnapshot.totalOptionsPrice) {
        yPos += 12;
        setupFont(doc);
        doc.text("Opcionais:", margin + 10, yPos);
        setupFont(doc, "bold");
        doc.text(formatCurrency(baseSnapshot.totalOptionsPrice), pageW - margin - 10, yPos, { align: "right" });
      }

      yPos += 15;
      doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.line(margin + 10, yPos, pageW - margin - 10, yPos);

      yPos += 12;
      doc.setFontSize(18);
      doc.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
      doc.text("TOTAL:", margin + 10, yPos);
      doc.text(formatCurrency(contract.base_price), pageW - margin - 10, yPos, { align: "right" });

      yPos += 20;
      doc.setFontSize(14);
      doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
      setupFont(doc);
      doc.text("Prazo de Entrega:", margin + 10, yPos);
      setupFont(doc, "bold");
      doc.text(`${contract.base_delivery_days} dias`, pageW - margin - 10, yPos, { align: "right" });
    }

    // ===== SIGNATURE =====
    function addSignature() {
      doc.addPage();

      doc.setFontSize(22);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      setupFont(doc, "bold");
      doc.text("Assinatura do Cliente", margin, 40);

      doc.setDrawColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
      doc.setLineWidth(1);
      doc.line(margin, 45, pageW - margin, 45);

      let yPos = 100;

      if (contract.signed_by_name) {
        doc.setDrawColor(COLORS.grayDark[0], COLORS.grayDark[1], COLORS.grayDark[2]);
        doc.setLineWidth(0.5);
        doc.line(pageW / 2 - 50, yPos, pageW / 2 + 50, yPos);

        yPos += 8;
        doc.setFontSize(14);
        doc.setTextColor(COLORS.textDark[0], COLORS.textDark[1], COLORS.textDark[2]);
        setupFont(doc, "bold");
        doc.text(contract.signed_by_name, pageW / 2, yPos, { align: "center" });

        yPos += 8;
        doc.setFontSize(11);
        setupFont(doc);
        doc.setTextColor(COLORS.grayDark[0], COLORS.grayDark[1], COLORS.grayDark[2]);
        doc.text(contract.signed_by_email || "", pageW / 2, yPos, { align: "center" });

        yPos += 10;
        doc.text(`Assinado em: ${formatDate(contract.signed_at)}`, pageW / 2, yPos, { align: "center" });
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
        doc.text(`Documento Original - Gerado em ${formatDate(new Date().toISOString())}`, pageW / 2, pageH - 10, { align: "center" });
      }
    }

    // Build PDF
    addCoverPage();
    addContractInfo();
    addSelectedOptions();
    addMemorialItems();
    addFinancialSummary();
    addSignature();
    addFooter();

    const pdfData = doc.output("arraybuffer");
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfData)));

    console.log("✓ Original contract PDF generated successfully");

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
    console.error("Error generating original contract PDF:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
