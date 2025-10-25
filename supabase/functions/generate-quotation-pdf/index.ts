import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeneratePDFRequest {
  quotationId: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Generate Quotation PDF Function Started ===');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const { quotationId }: GeneratePDFRequest = await req.json();
    console.log('Request data:', { quotationId });

    if (!quotationId) {
      throw new Error('quotationId is required');
    }

    // Fetch quotation data
    const { data: quotation, error: fetchError } = await supabase
      .from('quotations')
      .select(`
        *,
        yacht_models (*),
        clients (*),
        users!quotations_sales_representative_id_fkey (*),
        quotation_options (
          *,
          options (*)
        ),
        quotation_customizations (*)
      `)
      .eq('id', quotationId)
      .single();

    if (fetchError || !quotation) {
      throw new Error('Quotation not found: ' + fetchError?.message);
    }

    console.log('Cotação encontrada:', quotation.quotation_number);

    // Helper functions
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    };

    const formatDate = (date: string) => {
      return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
    };

    // Create PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Set font
    doc.setFont('helvetica');

    // Header
    doc.setFontSize(20);
    doc.setTextColor(25, 84, 197); // primary color
    doc.text('OKEAN YACHTS', 105, 20, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Proposta Comercial', 105, 30, { align: 'center' });

    // Quotation info
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Proposta: ${quotation.quotation_number}`, 20, 45);
    doc.text(`Data: ${formatDate(quotation.created_at)}`, 20, 50);
    doc.text(`Validade: ${formatDate(quotation.valid_until)}`, 20, 55);

    let yPos = 70;

    // Client section
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Cliente', 20, yPos);
    yPos += 7;
    
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Nome: ${quotation.clients?.name || quotation.client_name}`, 20, yPos);
    yPos += 5;
    if (quotation.clients?.email || quotation.client_email) {
      doc.text(`Email: ${quotation.clients?.email || quotation.client_email}`, 20, yPos);
      yPos += 5;
    }
    if (quotation.clients?.phone || quotation.client_phone) {
      doc.text(`Telefone: ${quotation.clients?.phone || quotation.client_phone}`, 20, yPos);
      yPos += 5;
    }

    yPos += 5;

    // Yacht Model section
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Modelo do Iate', 20, yPos);
    yPos += 7;
    
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Modelo: ${quotation.yacht_models?.name}`, 20, yPos);
    yPos += 5;
    doc.text(`Preço Base: ${formatCurrency(quotation.base_price)}`, 20, yPos);
    yPos += 5;
    if (quotation.base_discount_percentage > 0) {
      doc.text(`Desconto: ${quotation.base_discount_percentage}%`, 20, yPos);
      yPos += 5;
      doc.text(`Valor com Desconto: ${formatCurrency(quotation.final_base_price)}`, 20, yPos);
      yPos += 5;
    }

    yPos += 5;

    // Options section
    if (quotation.quotation_options && quotation.quotation_options.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Opcionais Selecionados', 20, yPos);
      yPos += 7;
      
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      
      quotation.quotation_options.forEach((qo: any) => {
        const optionText = `• ${qo.options?.name} - ${formatCurrency(qo.total_price)}`;
        doc.text(optionText, 25, yPos);
        yPos += 5;
        
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
      });

      yPos += 3;
      doc.setFontSize(10);
      doc.text(`Total Opcionais: ${formatCurrency(quotation.total_options_price || 0)}`, 20, yPos);
      yPos += 5;
      if (quotation.options_discount_percentage > 0) {
        doc.text(`Desconto Opcionais: ${quotation.options_discount_percentage}%`, 20, yPos);
        yPos += 5;
        doc.text(`Opcionais com Desconto: ${formatCurrency(quotation.final_options_price || 0)}`, 20, yPos);
        yPos += 5;
      }

      yPos += 5;
    }

    // Customizations section
    if (quotation.quotation_customizations && quotation.quotation_customizations.length > 0) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Customizações', 20, yPos);
      yPos += 7;
      
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      
      quotation.quotation_customizations.forEach((custom: any) => {
        doc.text(`• ${custom.item_name} - ${formatCurrency(custom.additional_cost || 0)}`, 25, yPos);
        yPos += 5;
        
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
      });

      yPos += 3;
      doc.setFontSize(10);
      doc.text(`Total Customizações: ${formatCurrency(quotation.total_customizations_price || 0)}`, 20, yPos);
      yPos += 5;
    }

    // Final summary
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }

    yPos += 5;
    doc.setFontSize(16);
    doc.setTextColor(25, 84, 197);
    doc.text('Resumo Financeiro', 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Valor Total: ${formatCurrency(quotation.final_price)}`, 20, yPos);
    yPos += 8;
    doc.text(`Prazo de Entrega: ${quotation.total_delivery_days} dias`, 20, yPos);

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Página ${i} de ${pageCount} | OKEAN Yachts | ${quotation.quotation_number}`,
        105,
        287,
        { align: 'center' }
      );
    }

    // Generate PDF as base64
    const pdfBase64 = doc.output('datauristring').split(',')[1];
    const pdfBuffer = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));

    // Upload to Storage
    const fileName = `${quotation.quotation_number.replace(/[^a-zA-Z0-9-]/g, '_')}_v${quotation.version || 1}.pdf`;
    const filePath = `${quotation.quotation_number}/${fileName}`;

    console.log('Uploading PDF to storage:', filePath);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('quotation-pdfs')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload PDF: ' + uploadError.message);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('quotation-pdfs')
      .getPublicUrl(filePath);

    const pdfUrl = urlData.publicUrl;
    console.log('PDF generated successfully:', pdfUrl);

    return new Response(
      JSON.stringify({
        success: true,
        pdfUrl,
        fileName,
        quotationNumber: quotation.quotation_number
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to generate PDF',
        details: error.stack
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});