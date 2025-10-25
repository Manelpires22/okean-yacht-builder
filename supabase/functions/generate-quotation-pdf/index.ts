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

// Design System Colors (HSL converted to RGB for jsPDF)
const COLORS = {
  primary: [25, 84, 197],      // hsl(210 100% 50%)
  primaryLight: [96, 165, 250], // hsl(210 100% 70%)
  secondary: [107, 114, 128],  // gray-500
  accent: [245, 158, 11],      // amber-500
  success: [16, 185, 129],     // green-500
  muted: [156, 163, 175],      // gray-400
  dark: [31, 41, 55],          // gray-800
  light: [243, 244, 246],      // gray-100
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Generate Premium Quotation PDF Started ===');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { quotationId }: GeneratePDFRequest = await req.json();
    console.log('Request data:', { quotationId });

    if (!quotationId) {
      throw new Error('quotationId is required');
    }

    // Fetch complete quotation data
    const { data: quotation, error: fetchError } = await supabase
      .from('quotations')
      .select(`
        *,
        yacht_models (
          *
        ),
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
      .eq('id', quotationId)
      .single();

    if (fetchError || !quotation) {
      throw new Error('Quotation not found: ' + fetchError?.message);
    }

    console.log('Cotação encontrada:', quotation.quotation_number);

    // Fetch memorial items for the yacht model
    const { data: memorialItems } = await supabase
      .from('memorial_items')
      .select(`
        *,
        memorial_categories!inner (
          id,
          label,
          icon,
          display_order
        )
      `)
      .eq('yacht_model_id', quotation.yacht_model_id)
      .eq('is_active', true)
      .order('category_display_order')
      .order('display_order');

    console.log(`Memorial items found: ${memorialItems?.length || 0}`);

    // Helper functions
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
      }).format(value);
    };

    const formatDate = (date: string) => {
      return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
    };

    const formatNumber = (value: number, decimals = 2) => {
      return value.toLocaleString('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
    };

    // Create PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // ============= PAGE 1: COVER =============
    function addCoverPage() {
      // Background gradient effect (using rectangles)
      doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.rect(0, 0, pageWidth, 80, 'F');
      
      // Logo/Company name
      doc.setFontSize(32);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('OKEAN YACHTS', pageWidth / 2, 35, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text('Propostas Comerciais Premium', pageWidth / 2, 45, { align: 'center' });

      // Model name (large)
      doc.setFontSize(28);
      doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(quotation.yacht_models.name, pageWidth / 2, 110, { align: 'center' });

      // Proposal info box
      const boxY = 130;
      doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
      doc.roundedRect(margin, boxY, contentWidth, 50, 3, 3, 'F');
      
      doc.setFontSize(11);
      doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
      doc.setFont('helvetica', 'normal');
      
      let boxYPos = boxY + 12;
      doc.text(`Proposta Nº: ${quotation.quotation_number}`, margin + 10, boxYPos);
      boxYPos += 8;
      doc.text(`Cliente: ${quotation.clients?.name || quotation.client_name}`, margin + 10, boxYPos);
      boxYPos += 8;
      doc.text(`Data de Emissão: ${formatDate(quotation.created_at)}`, margin + 10, boxYPos);
      boxYPos += 8;
      doc.text(`Validade: ${formatDate(quotation.valid_until)}`, margin + 10, boxYPos);
      boxYPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.text(`Valor Total: ${formatCurrency(quotation.final_price)}`, margin + 10, boxYPos);

      // Footer
      doc.setFontSize(10);
      doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
      doc.setFont('helvetica', 'italic');
      doc.text(
        'Proposta exclusiva e personalizada para suas necessidades',
        pageWidth / 2,
        pageHeight - 20,
        { align: 'center' }
      );
    }

    // ============= PAGE 2: MODEL PRESENTATION =============
    function addModelPresentation() {
      doc.addPage();
      
      // Title
      doc.setFontSize(20);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(quotation.yacht_models.name, margin, 30);
      
      // Divider line
      doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, 35, pageWidth - margin, 35);

      let yPos = 50;

      // Description
      if (quotation.yacht_models.description) {
        doc.setFontSize(11);
        doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
        doc.setFont('helvetica', 'normal');
        
        const descLines = doc.splitTextToSize(quotation.yacht_models.description, contentWidth);
        doc.text(descLines, margin, yPos);
        yPos += descLines.length * 6 + 10;
      }

      // Key Highlights
      doc.setFontSize(14);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('Destaques do Modelo', margin, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
      doc.setFont('helvetica', 'normal');

      const highlights = [];
      if (quotation.yacht_models.cabins) {
        highlights.push(`${quotation.yacht_models.cabins} Camarotes`);
      }
      if (quotation.yacht_models.bathrooms) {
        highlights.push(`${quotation.yacht_models.bathrooms} Banheiros`);
      }
      if (quotation.yacht_models.engines) {
        highlights.push(`Motorização: ${quotation.yacht_models.engines}`);
      }
      if (quotation.yacht_models.max_speed) {
        highlights.push(`Velocidade Máxima: ${formatNumber(quotation.yacht_models.max_speed, 1)} nós`);
      }
      if (quotation.yacht_models.range_nautical_miles) {
        highlights.push(`Autonomia: ${formatNumber(quotation.yacht_models.range_nautical_miles, 0)} milhas náuticas`);
      }

      highlights.forEach(highlight => {
        doc.text(`✓ ${highlight}`, margin + 5, yPos);
        yPos += 7;
      });
    }

    // ============= PAGE 3: TECHNICAL SPECIFICATIONS =============
    function addTechnicalSpecs() {
      doc.addPage();
      
      // Title
      doc.setFontSize(18);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('Especificações Técnicas', margin, 30);
      
      doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, 35, pageWidth - margin, 35);

      let yPos = 50;
      const leftCol = margin;
      const rightCol = pageWidth / 2 + 5;
      const colWidth = (pageWidth / 2) - margin - 10;

      // Helper to add spec section
      const addSpecSection = (title: string, specs: Array<{label: string, value: string}>, isLeft: boolean) => {
        const xPos = isLeft ? leftCol : rightCol;
        
        doc.setFontSize(12);
        doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(title, xPos, yPos);
        
        let localY = yPos + 7;
        doc.setFontSize(9);
        doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
        doc.setFont('helvetica', 'normal');
        
        specs.forEach(spec => {
          if (spec.value && spec.value !== 'null' && spec.value !== '0') {
            doc.setFont('helvetica', 'bold');
            doc.text(spec.label + ':', xPos, localY);
            doc.setFont('helvetica', 'normal');
            doc.text(spec.value, xPos + 40, localY);
            localY += 5;
          }
        });
        
        return localY;
      };

      // DIMENSÕES (Left column)
      const dimensionsSpecs = [
        { label: 'Comprimento Total', value: quotation.yacht_models.length_overall ? `${formatNumber(quotation.yacht_models.length_overall)} m` : '' },
        { label: 'Comprimento Casco', value: quotation.yacht_models.hull_length ? `${formatNumber(quotation.yacht_models.hull_length)} m` : '' },
        { label: 'Boca', value: quotation.yacht_models.beam ? `${formatNumber(quotation.yacht_models.beam)} m` : '' },
        { label: 'Calado', value: quotation.yacht_models.draft ? `${formatNumber(quotation.yacht_models.draft)} m` : '' },
        { label: 'Altura Linha d\'Água', value: quotation.yacht_models.height_from_waterline ? `${formatNumber(quotation.yacht_models.height_from_waterline)} m` : '' },
      ];
      
      let leftY = addSpecSection('📏 DIMENSÕES', dimensionsSpecs, true);

      // PESOS & DESLOCAMENTO (Right column)
      const weightsSpecs = [
        { label: 'Peso Seco', value: quotation.yacht_models.dry_weight ? `${formatNumber(quotation.yacht_models.dry_weight)} kg` : '' },
        { label: 'Deslocamento Leve', value: quotation.yacht_models.displacement_light ? `${formatNumber(quotation.yacht_models.displacement_light)} kg` : '' },
        { label: 'Deslocamento Carregado', value: quotation.yacht_models.displacement_loaded ? `${formatNumber(quotation.yacht_models.displacement_loaded)} kg` : '' },
      ];
      
      let rightY = addSpecSection('⚖️ PESOS', weightsSpecs, false);

      // Move to next row
      yPos = Math.max(leftY, rightY) + 10;

      // CAPACIDADES (Left column)
      const capacitiesSpecs = [
        { label: 'Combustível', value: quotation.yacht_models.fuel_capacity ? `${formatNumber(quotation.yacht_models.fuel_capacity)} L` : '' },
        { label: 'Água', value: quotation.yacht_models.water_capacity ? `${formatNumber(quotation.yacht_models.water_capacity)} L` : '' },
        { label: 'Passageiros', value: quotation.yacht_models.passengers_capacity ? `${quotation.yacht_models.passengers_capacity} pessoas` : '' },
        { label: 'Camarotes', value: quotation.yacht_models.cabins ? `${quotation.yacht_models.cabins}` : '' },
        { label: 'Banheiros', value: quotation.yacht_models.bathrooms || '' },
      ];
      
      leftY = addSpecSection('🛏️ CAPACIDADES', capacitiesSpecs, true);

      // MOTORIZAÇÃO & PERFORMANCE (Right column)
      const performanceSpecs = [
        { label: 'Motores', value: quotation.yacht_models.engines || '' },
        { label: 'Velocidade Máxima', value: quotation.yacht_models.max_speed ? `${formatNumber(quotation.yacht_models.max_speed, 1)} nós` : '' },
        { label: 'Vel. Cruzeiro', value: quotation.yacht_models.cruise_speed ? `${formatNumber(quotation.yacht_models.cruise_speed, 1)} nós` : '' },
        { label: 'Autonomia', value: quotation.yacht_models.range_nautical_miles ? `${formatNumber(quotation.yacht_models.range_nautical_miles, 0)} milhas` : '' },
        { label: 'Cor do Casco', value: quotation.yacht_models.hull_color || '' },
      ];
      
      rightY = addSpecSection('⚙️ MOTORIZAÇÃO', performanceSpecs, false);
    }

    // ============= PAGES 4-N: MEMORIAL DESCRITIVO =============
    function addMemorialDescritivo() {
      if (!memorialItems || memorialItems.length === 0) {
        return;
      }

      doc.addPage();
      
      // Title
      doc.setFontSize(18);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('Memorial Descritivo', margin, 30);
      
      doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, 35, pageWidth - margin, 35);

      let yPos = 50;

      // Group by category
      const itemsByCategory = memorialItems.reduce((acc: any, item: any) => {
        const categoryLabel = item.memorial_categories?.label || 'Outros';
        if (!acc[categoryLabel]) {
          acc[categoryLabel] = [];
        }
        acc[categoryLabel].push(item);
        return acc;
      }, {});

      Object.entries(itemsByCategory).forEach(([categoryLabel, items]: [string, any]) => {
        // Check if need new page
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = 30;
        }

        // Category header
        doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
        doc.roundedRect(margin, yPos - 5, contentWidth, 10, 2, 2, 'F');
        
        doc.setFontSize(11);
        doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(categoryLabel.toUpperCase(), margin + 3, yPos + 2);
        yPos += 12;

        // Items
        doc.setFontSize(9);
        doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
        
        items.forEach((item: any) => {
          if (yPos > pageHeight - 20) {
            doc.addPage();
            yPos = 30;
          }

          doc.setFont('helvetica', 'bold');
          doc.text(`• ${item.item_name}`, margin + 3, yPos);
          yPos += 4;

          doc.setFont('helvetica', 'normal');
          const details = [];
          if (item.brand) details.push(`Marca: ${item.brand}`);
          if (item.model) details.push(`Modelo: ${item.model}`);
          if (item.quantity && item.unit) details.push(`Quantidade: ${item.quantity} ${item.unit}`);
          
          if (details.length > 0) {
            doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
            doc.text(details.join(' | '), margin + 6, yPos);
            yPos += 4;
          }

          if (item.description) {
            doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
            const descLines = doc.splitTextToSize(item.description, contentWidth - 10);
            doc.text(descLines, margin + 6, yPos);
            yPos += descLines.length * 4;
          }

          yPos += 2;
        });

        yPos += 5;
      });
    }

    // ============= PAGE N+1: SELECTED OPTIONS =============
    function addSelectedOptions() {
      if (!quotation.quotation_options || quotation.quotation_options.length === 0) {
        return;
      }

      doc.addPage();
      
      // Title
      doc.setFontSize(18);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('Opcionais Selecionados', margin, 30);
      
      doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, 35, pageWidth - margin, 35);

      let yPos = 50;

      // Table header
      doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.rect(margin, yPos - 5, contentWidth, 8, 'F');
      
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('Código', margin + 2, yPos);
      doc.text('Nome', margin + 25, yPos);
      doc.text('Qtd', pageWidth - 75, yPos);
      doc.text('Valor Unit.', pageWidth - 60, yPos);
      doc.text('Total', pageWidth - margin - 25, yPos, { align: 'right' });
      yPos += 8;

      // Table rows
      doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
      doc.setFont('helvetica', 'normal');
      
      quotation.quotation_options.forEach((qo: any, index: number) => {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = 30;
        }

        // Alternate row background
        if (index % 2 === 0) {
          doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
          doc.rect(margin, yPos - 4, contentWidth, 6, 'F');
        }

        doc.text(qo.options?.code || '-', margin + 2, yPos);
        
        const optionName = qo.options?.name || 'Opcional';
        const nameLines = doc.splitTextToSize(optionName, 95);
        doc.text(nameLines[0], margin + 25, yPos);
        
        doc.text(String(qo.quantity || 1), pageWidth - 75, yPos);
        doc.text(formatCurrency(qo.unit_price), pageWidth - 60, yPos);
        doc.text(formatCurrency(qo.total_price), pageWidth - margin - 2, yPos, { align: 'right' });
        
        yPos += 7;

        // Description if exists
        if (qo.options?.description && nameLines.length === 1) {
          doc.setFontSize(7);
          doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
          const descLines = doc.splitTextToSize(qo.options.description, 120);
          doc.text(descLines.slice(0, 2), margin + 25, yPos - 3);
          doc.setFontSize(9);
          doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
          yPos += 3;
        }
      });

      // Totals
      yPos += 5;
      doc.setDrawColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 7;

      doc.setFont('helvetica', 'bold');
      doc.text('Total Opcionais:', pageWidth - 80, yPos);
      doc.text(formatCurrency(quotation.total_options_price || 0), pageWidth - margin - 2, yPos, { align: 'right' });
      
      if (quotation.options_discount_percentage > 0) {
        yPos += 6;
        doc.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
        doc.text(`Desconto (${quotation.options_discount_percentage}%):`, pageWidth - 80, yPos);
        const discount = (quotation.total_options_price || 0) - (quotation.final_options_price || 0);
        doc.text(`-${formatCurrency(discount)}`, pageWidth - margin - 2, yPos, { align: 'right' });
        
        yPos += 6;
        doc.setTextColor(COLORS.success[0], COLORS.success[1], COLORS.success[2]);
        doc.text('Total com Desconto:', pageWidth - 80, yPos);
        doc.text(formatCurrency(quotation.final_options_price || 0), pageWidth - margin - 2, yPos, { align: 'right' });
      }
    }

    // ============= PAGE N+2: CUSTOMIZATIONS =============
    function addCustomizations() {
      if (!quotation.quotation_customizations || quotation.quotation_customizations.length === 0) {
        return;
      }

      doc.addPage();
      
      // Title
      doc.setFontSize(18);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('Customizações Solicitadas', margin, 30);
      
      doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, 35, pageWidth - margin, 35);

      let yPos = 50;

      quotation.quotation_customizations.forEach((custom: any, index: number) => {
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = 30;
        }

        // Custom box
        doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
        const boxHeight = 35 + (custom.notes ? 10 : 0);
        doc.roundedRect(margin, yPos, contentWidth, boxHeight, 3, 3, 'F');

        yPos += 8;
        doc.setFontSize(11);
        doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${custom.item_name}`, margin + 5, yPos);
        
        yPos += 7;
        doc.setFontSize(9);
        doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
        doc.setFont('helvetica', 'normal');

        if (custom.quantity) {
          doc.text(`Quantidade: ${custom.quantity}`, margin + 5, yPos);
          yPos += 5;
        }

        doc.text(`Custo Adicional: ${formatCurrency(custom.additional_cost || 0)}`, margin + 5, yPos);
        yPos += 5;

        if (custom.delivery_impact_days > 0) {
          doc.text(`Impacto no Prazo: +${custom.delivery_impact_days} dias`, margin + 5, yPos);
          yPos += 5;
        }

        const statusColors: any = {
          pending: COLORS.accent,
          approved: COLORS.success,
          rejected: [220, 38, 38]
        };
        const statusColor = statusColors[custom.status] || COLORS.muted;
        doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.text(`Status: ${custom.status === 'pending' ? 'Pendente' : custom.status === 'approved' ? 'Aprovado' : 'Rejeitado'}`, margin + 5, yPos);
        
        if (custom.notes) {
          yPos += 7;
          doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
          doc.setFontSize(8);
          const notesLines = doc.splitTextToSize(custom.notes, contentWidth - 15);
          doc.text(notesLines, margin + 5, yPos);
        }

        yPos += boxHeight - 5 + 10;
      });
    }

    // ============= PAGE N+3: FINANCIAL SUMMARY =============
    function addFinancialSummary() {
      doc.addPage();
      
      // Title
      doc.setFontSize(20);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo Financeiro', pageWidth / 2, 30, { align: 'center' });
      
      doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setLineWidth(0.8);
      doc.line(margin, 37, pageWidth - margin, 37);

      let yPos = 60;

      // Summary box
      const boxWidth = contentWidth - 40;
      const boxX = margin + 20;

      // Model Base
      doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
      doc.roundedRect(boxX, yPos, boxWidth, 40, 3, 3, 'F');
      
      yPos += 10;
      doc.setFontSize(12);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('Modelo Base', boxX + 5, yPos);
      
      yPos += 8;
      doc.setFontSize(10);
      doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
      doc.setFont('helvetica', 'normal');
      doc.text(quotation.yacht_models.name, boxX + 5, yPos);
      doc.text(formatCurrency(quotation.base_price), boxX + boxWidth - 5, yPos, { align: 'right' });
      
      if (quotation.base_discount_percentage > 0) {
        yPos += 6;
        doc.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
        doc.text(`Desconto (${quotation.base_discount_percentage}%)`, boxX + 10, yPos);
        const discount = quotation.base_price - quotation.final_base_price;
        doc.text(`-${formatCurrency(discount)}`, boxX + boxWidth - 5, yPos, { align: 'right' });
      }
      
      yPos += 6;
      doc.setDrawColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
      doc.setLineWidth(0.3);
      doc.line(boxX + 5, yPos, boxX + boxWidth - 5, yPos);
      
      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
      doc.text('Subtotal', boxX + 5, yPos);
      doc.text(formatCurrency(quotation.final_base_price), boxX + boxWidth - 5, yPos, { align: 'right' });

      yPos += 15;

      // Options
      if (quotation.quotation_options && quotation.quotation_options.length > 0) {
        doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
        doc.roundedRect(boxX, yPos, boxWidth, 35, 3, 3, 'F');
        
        yPos += 10;
        doc.setFontSize(12);
        doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('Opcionais Selecionados', boxX + 5, yPos);
        
        yPos += 8;
        doc.setFontSize(10);
        doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
        doc.setFont('helvetica', 'normal');
        doc.text(`${quotation.quotation_options.length} itens`, boxX + 5, yPos);
        doc.text(formatCurrency(quotation.total_options_price || 0), boxX + boxWidth - 5, yPos, { align: 'right' });
        
        if (quotation.options_discount_percentage > 0) {
          yPos += 6;
          doc.setTextColor(COLORS.accent[0], COLORS.accent[1], COLORS.accent[2]);
          doc.text(`Desconto (${quotation.options_discount_percentage}%)`, boxX + 10, yPos);
          const discount = (quotation.total_options_price || 0) - (quotation.final_options_price || 0);
          doc.text(`-${formatCurrency(discount)}`, boxX + boxWidth - 5, yPos, { align: 'right' });
        }
        
        yPos += 6;
        doc.setDrawColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
        doc.line(boxX + 5, yPos, boxX + boxWidth - 5, yPos);
        
        yPos += 5;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
        doc.text('Subtotal', boxX + 5, yPos);
        doc.text(formatCurrency(quotation.final_options_price || 0), boxX + boxWidth - 5, yPos, { align: 'right' });

        yPos += 15;
      }

      // Customizations
      if (quotation.quotation_customizations && quotation.quotation_customizations.length > 0) {
        doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
        doc.roundedRect(boxX, yPos, boxWidth, 25, 3, 3, 'F');
        
        yPos += 10;
        doc.setFontSize(12);
        doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('Customizações', boxX + 5, yPos);
        
        yPos += 8;
        doc.setFontSize(10);
        doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
        doc.setFont('helvetica', 'normal');
        
        quotation.quotation_customizations.forEach((custom: any) => {
          const customText = doc.splitTextToSize(custom.item_name, boxWidth - 60);
          doc.text(customText[0], boxX + 5, yPos);
          doc.text(formatCurrency(custom.additional_cost || 0), boxX + boxWidth - 5, yPos, { align: 'right' });
          yPos += 5;
        });
        
        yPos += 5;
        doc.setDrawColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
        doc.line(boxX + 5, yPos, boxX + boxWidth - 5, yPos);
        
        yPos += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('Subtotal', boxX + 5, yPos);
        doc.text(formatCurrency(quotation.total_customizations_price || 0), boxX + boxWidth - 5, yPos, { align: 'right' });

        yPos += 15;
      }

      // TOTAL
      yPos += 5;
      doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.roundedRect(boxX, yPos, boxWidth, 15, 3, 3, 'F');
      
      yPos += 10;
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('VALOR TOTAL', boxX + 5, yPos);
      doc.text(formatCurrency(quotation.final_price), boxX + boxWidth - 5, yPos, { align: 'right' });

      // Delivery info
      yPos += 25;
      doc.setFontSize(11);
      doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
      doc.setFont('helvetica', 'normal');
      doc.text(`Prazo de Entrega: ${quotation.total_delivery_days} dias (${Math.round(quotation.total_delivery_days / 30)} meses)`, boxX, yPos);
      yPos += 7;
      doc.text(`Validade da Proposta: ${formatDate(quotation.valid_until)}`, boxX, yPos);
    }

    // ============= FINAL PAGE: CONTACT & TERMS =============
    function addContactPage() {
      doc.addPage();
      
      // Title
      doc.setFontSize(18);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('Informações de Contato', margin, 30);
      
      doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, 35, pageWidth - margin, 35);

      let yPos = 55;

      // Sales Representative
      doc.setFontSize(12);
      doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('Representante Comercial', margin, yPos);
      
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      if (quotation.users) {
        doc.text(`Nome: ${quotation.users.full_name}`, margin, yPos);
        yPos += 6;
        doc.text(`Email: ${quotation.users.email}`, margin, yPos);
        yPos += 6;
        if (quotation.users.department) {
          doc.text(`Departamento: ${quotation.users.department}`, margin, yPos);
          yPos += 6;
        }
      }

      yPos += 15;

      // Company info
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('OKEAN Yachts', margin, yPos);
      
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Website: www.okeanyachts.com.br', margin, yPos);
      yPos += 6;
      doc.text('Email: contato@okeanyachts.com.br', margin, yPos);

      yPos += 20;

      // Terms
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.text('Condições Gerais', margin, yPos);
      
      yPos += 10;
      doc.setFontSize(9);
      doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
      doc.setFont('helvetica', 'normal');

      const terms = [
        '• Esta proposta é válida até a data especificada e sujeita a confirmação de disponibilidade.',
        '• Valores sujeitos a alteração sem aviso prévio.',
        '• O prazo de entrega é estimado e pode variar conforme customizações aprovadas.',
        '• Customizações estão sujeitas a aprovação técnica e podem impactar prazos e valores.',
        '• Forma de pagamento e condições comerciais serão definidas em contrato específico.',
        '• Garantias conforme manual do fabricante e legislação vigente.',
      ];

      terms.forEach(term => {
        const lines = doc.splitTextToSize(term, contentWidth);
        doc.text(lines, margin, yPos);
        yPos += lines.length * 5;
      });

      // Footer with company branding
      yPos = pageHeight - 40;
      doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.rect(0, yPos, pageWidth, 40, 'F');
      
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('OKEAN YACHTS', pageWidth / 2, yPos + 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Realizando sonhos náuticos', pageWidth / 2, yPos + 23, { align: 'center' });
    }

    // Generate all pages
    addCoverPage();
    addModelPresentation();
    addTechnicalSpecs();
    addMemorialDescritivo();
    addSelectedOptions();
    addCustomizations();
    addFinancialSummary();
    addContactPage();

    // Add page numbers to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Página ${i} de ${totalPages} | OKEAN Yachts | ${quotation.quotation_number}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Generate PDF as buffer
    const pdfBase64 = doc.output('datauristring').split(',')[1];
    const pdfBuffer = Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0));

    // Upload to Storage
    const fileName = `${quotation.quotation_number.replace(/[^a-zA-Z0-9-]/g, '_')}_v${quotation.version || 1}.pdf`;
    const filePath = `${quotation.quotation_number}/${fileName}`;

    console.log('Uploading premium PDF to storage:', filePath);

    const { error: uploadError } = await supabase.storage
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
    console.log('Premium PDF generated successfully:', pdfUrl);

    return new Response(
      JSON.stringify({
        success: true,
        pdfUrl,
        fileName,
        quotationNumber: quotation.quotation_number,
        pages: totalPages
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
    console.error('Error generating premium PDF:', error);
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
