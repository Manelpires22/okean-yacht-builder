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

// Utility: Deduplicate array by key function
function dedupeBy<T>(arr: T[], keyFn: (x: T) => string): T[] {
  const map = new Map<string, T>();
  for (const item of arr) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, item);
  }
  return [...map.values()];
}

// Utility: Generate SHA-256 hash for integrity
async function generateHash(data: any): Promise<string> {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(data)));
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
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
  watermark: [204, 204, 204],  // light gray for watermark
};

// Setup font - use Helvetica (built-in, supports Portuguese characters)
function setupFont(doc: jsPDF) {
  // Helvetica has built-in support for Latin characters including Portuguese
  doc.setFont('helvetica', 'normal');
}

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
      console.log(`Memorial compacted: ${memorialItems.length} → ${memorialClean.length} items (${Math.round((1 - memorialClean.length / memorialItems.length) * 100)}% reduction)`);
    }

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

    // Setup font (Helvetica with Portuguese support)
    setupFont(doc);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Add draft watermark function
    function addDraftWatermark() {
      if (quotation.status !== 'draft') return;
      
      doc.setTextColor(COLORS.watermark[0], COLORS.watermark[1], COLORS.watermark[2]);
      doc.setFontSize(72);
      doc.setFont('helvetica', 'bold');
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.12 }));
      doc.text('RASCUNHO', pageWidth / 2, pageHeight / 2, { angle: 35, align: 'center' });
      doc.restoreGraphicsState();
    }

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
      doc.text(`Proposta No: ${quotation.quotation_number}`, margin + 10, boxYPos);
      boxYPos += 8;
      doc.text(`Cliente: ${quotation.clients?.name || quotation.client_name}`, margin + 10, boxYPos);
      boxYPos += 8;
      doc.text(`Data de Emissao: ${formatDate(quotation.created_at)}`, margin + 10, boxYPos);
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
      
      // Add draft watermark if needed
      addDraftWatermark();
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
        highlights.push(`Motorizacao: ${quotation.yacht_models.engines}`);
      }
      if (quotation.yacht_models.max_speed) {
        highlights.push(`Velocidade Maxima: ${formatNumber(quotation.yacht_models.max_speed, 1)} nos`);
      }
      if (quotation.yacht_models.range_nautical_miles) {
        highlights.push(`Autonomia: ${formatNumber(quotation.yacht_models.range_nautical_miles, 0)} milhas nauticas`);
      }

      highlights.forEach(highlight => {
        doc.text(`✓ ${highlight}`, margin + 5, yPos);
        yPos += 7;
      });
      
      addDraftWatermark();
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

      // Helper to add spec section (clean text, no emojis)
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
            doc.setFont('helvetica', 'normal');
            doc.text(spec.label + ':', xPos, localY);
            doc.setFont('helvetica', 'normal');
            doc.text(spec.value, xPos + 40, localY);
            localY += 5;
          }
        });
        
        return localY;
      };

      // DIMENSOES (Left column - clean text without accents that break)
      const dimensionsSpecs = [
        { label: 'Comprimento Total', value: quotation.yacht_models.length_overall ? `${formatNumber(quotation.yacht_models.length_overall)} m` : '' },
        { label: 'Comprimento Casco', value: quotation.yacht_models.hull_length ? `${formatNumber(quotation.yacht_models.hull_length)} m` : '' },
        { label: 'Boca', value: quotation.yacht_models.beam ? `${formatNumber(quotation.yacht_models.beam)} m` : '' },
        { label: 'Calado', value: quotation.yacht_models.draft ? `${formatNumber(quotation.yacht_models.draft)} m` : '' },
        { label: 'Altura Linha d\'Agua', value: quotation.yacht_models.height_from_waterline ? `${formatNumber(quotation.yacht_models.height_from_waterline)} m` : '' },
      ];
      
      let leftY = addSpecSection('DIMENSOES', dimensionsSpecs, true);

      // PESOS & DESLOCAMENTO (Right column)
      const weightsSpecs = [
        { label: 'Peso Seco', value: quotation.yacht_models.dry_weight ? `${formatNumber(quotation.yacht_models.dry_weight)} kg` : '' },
        { label: 'Deslocamento Leve', value: quotation.yacht_models.displacement_light ? `${formatNumber(quotation.yacht_models.displacement_light)} kg` : '' },
        { label: 'Deslocamento Carregado', value: quotation.yacht_models.displacement_loaded ? `${formatNumber(quotation.yacht_models.displacement_loaded)} kg` : '' },
      ];
      
      let rightY = addSpecSection('PESOS', weightsSpecs, false);

      // Move to next row
      yPos = Math.max(leftY, rightY) + 10;

      // CAPACIDADES (Left column)
      const capacitiesSpecs = [
        { label: 'Combustivel', value: quotation.yacht_models.fuel_capacity ? `${formatNumber(quotation.yacht_models.fuel_capacity)} L` : '' },
        { label: 'Agua', value: quotation.yacht_models.water_capacity ? `${formatNumber(quotation.yacht_models.water_capacity)} L` : '' },
        { label: 'Passageiros', value: quotation.yacht_models.passengers_capacity ? `${quotation.yacht_models.passengers_capacity} pessoas` : '' },
        { label: 'Camarotes', value: quotation.yacht_models.cabins ? `${quotation.yacht_models.cabins}` : '' },
        { label: 'Banheiros', value: quotation.yacht_models.bathrooms || '' },
      ];
      
      leftY = addSpecSection('CAPACIDADES', capacitiesSpecs, true);

      // MOTORIZACAO & PERFORMANCE (Right column)
      const performanceSpecs = [
        { label: 'Motores', value: quotation.yacht_models.engines || '' },
        { label: 'Velocidade Maxima', value: quotation.yacht_models.max_speed ? `${formatNumber(quotation.yacht_models.max_speed, 1)} nos` : '' },
        { label: 'Vel. Cruzeiro', value: quotation.yacht_models.cruise_speed ? `${formatNumber(quotation.yacht_models.cruise_speed, 1)} nos` : '' },
        { label: 'Autonomia', value: quotation.yacht_models.range_nautical_miles ? `${formatNumber(quotation.yacht_models.range_nautical_miles, 0)} milhas` : '' },
        { label: 'Cor do Casco', value: quotation.yacht_models.hull_color || '' },
      ];
      
      rightY = addSpecSection('MOTORIZACAO', performanceSpecs, false);
      
      addDraftWatermark();
    }

    // ============= PAGES 4-N: MEMORIAL DESCRITIVO (COMPACT) =============
    function addMemorialDescritivo() {
      if (!memorialClean || memorialClean.length === 0) {
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
      let currentCategory = '';

      memorialClean.forEach((item: any) => {
        const category = item.memorial_categories?.label || 'Outros';
        
        // Add category header
        if (category !== currentCategory) {
          if (yPos > 265) {
            doc.addPage();
            yPos = 20;
            addDraftWatermark();
          }
          
          doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
          doc.roundedRect(margin, yPos - 5, contentWidth, 10, 2, 2, 'F');
          
          doc.setFontSize(11);
          doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
          doc.setFont('helvetica', 'bold');
          doc.text(category.toUpperCase(), margin + 3, yPos + 2);
          yPos += 12;
          currentCategory = category;
        }
        
        // Check if we need a new page
        if (yPos > 265) {
          doc.addPage();
          yPos = 20;
          addDraftWatermark();
        }
        
        // Item details (compact format)
        doc.setFontSize(9);
        doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
        doc.setFont('helvetica', 'normal');
        
        // Item name (bold, 1 line max)
        const itemNameLines = doc.splitTextToSize(item.item_name, pageWidth - 50);
        doc.text(`• ${itemNameLines[0]}${itemNameLines.length > 1 ? '...' : ''}`, margin + 3, yPos);
        yPos += 4;
        
        // Brand, model, quantity (only if exists, 1 line, gray)
        const details = [];
        if (item.brand) details.push(item.brand);
        if (item.model) details.push(item.model);
        if (item.quantity && item.quantity > 1) details.push(`${item.quantity} ${item.unit || 'un'}`);
        
        if (details.length > 0) {
          doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
          doc.setFontSize(8);
          doc.text(details.join(' | '), margin + 6, yPos);
          yPos += 4;
        }
        
        // Description (max 2 lines, truncate with ...)
        if (item.description && item.description.trim()) {
          doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
          doc.setFontSize(8);
          const descLines = doc.splitTextToSize(item.description, contentWidth - 10);
          const maxLines = 2;
          const displayLines = descLines.slice(0, maxLines);
          if (descLines.length > maxLines) {
            displayLines[maxLines - 1] = displayLines[maxLines - 1].slice(0, -3) + '...';
          }
          doc.text(displayLines, margin + 6, yPos);
          yPos += displayLines.length * 3.5;
        }
        
        yPos += 2; // Compact spacing between items
      });
      
      addDraftWatermark();
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
      doc.text('Codigo', margin + 2, yPos);
      doc.text('Nome', margin + 25, yPos);
      doc.text('Qtd', pageWidth - 75, yPos);
      doc.text('Valor Unit.', pageWidth - 60, yPos);
      doc.text('Total', pageWidth - margin - 25, yPos, { align: 'right' });
      yPos += 8;

      // Table rows
      doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
      doc.setFont('helvetica', 'normal');
      
      quotation.quotation_options.forEach((qo: any, index: number) => {
        if (yPos > 265) {
          doc.addPage();
          yPos = 30;
          addDraftWatermark();
        }

        // Alternate row background
        if (index % 2 === 0) {
          doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
          doc.rect(margin, yPos - 4, contentWidth, 6, 'F');
        }

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(qo.options?.code || 'N/A', margin + 2, yPos);
        
        // Limit option name to 95mm width
        const optionName = qo.options?.name || 'N/A';
        const nameLines = doc.splitTextToSize(optionName, 95);
        doc.text(nameLines[0] + (nameLines.length > 1 ? '...' : ''), margin + 25, yPos);
        
        doc.text(qo.quantity.toString(), pageWidth - 72, yPos);
        doc.text(formatCurrency(qo.unit_price), pageWidth - 60, yPos);
        doc.text(formatCurrency(qo.total_price), pageWidth - margin - 2, yPos, { align: 'right' });

        yPos += 6;
      });

      // Total row
      yPos += 5;
      doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setLineWidth(0.3);
      doc.line(pageWidth - 80, yPos - 3, pageWidth - margin, yPos - 3);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.text('TOTAL OPCIONAIS:', pageWidth - 80, yPos);
      doc.text(
        formatCurrency(quotation.total_options_price || 0),
        pageWidth - margin - 2,
        yPos,
        { align: 'right' }
      );
      
      addDraftWatermark();
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

      // Table header
      doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.rect(margin, yPos - 5, contentWidth, 8, 'F');
      
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('Item', margin + 2, yPos);
      doc.text('Status', pageWidth / 2, yPos);
      doc.text('Custo Adicional', pageWidth - margin - 35, yPos, { align: 'right' });
      yPos += 8;

      // Table rows
      doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
      doc.setFont('helvetica', 'normal');
      
      quotation.quotation_customizations.forEach((custom: any, index: number) => {
        if (yPos > 265) {
          doc.addPage();
          yPos = 30;
          addDraftWatermark();
        }

        // Alternate row background
        if (index % 2 === 0) {
          doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
          doc.rect(margin, yPos - 4, contentWidth, 6, 'F');
        }

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        const customName = doc.splitTextToSize(custom.item_name, 70);
        doc.text(customName[0] + (customName.length > 1 ? '...' : ''), margin + 2, yPos);
        
        const statusText = custom.status === 'approved' ? 'Aprovada' : 
                          custom.status === 'rejected' ? 'Rejeitada' : 'Pendente';
        doc.text(statusText, pageWidth / 2, yPos);
        
        doc.text(
          formatCurrency(custom.additional_cost || 0),
          pageWidth - margin - 2,
          yPos,
          { align: 'right' }
        );

        yPos += 6;
      });

      // Total row
      yPos += 5;
      doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setLineWidth(0.3);
      doc.line(pageWidth - 80, yPos - 3, pageWidth - margin, yPos - 3);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.text('TOTAL CUSTOMIZAÇÕES:', pageWidth - 80, yPos);
      doc.text(
        formatCurrency(quotation.total_customizations_price || 0),
        pageWidth - margin - 2,
        yPos,
        { align: 'right' }
      );
      
      addDraftWatermark();
    }

    // ============= PAGE N+3: FINANCIAL SUMMARY =============
    function addFinancialSummary() {
      doc.addPage();
      
      // Title
      doc.setFontSize(18);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo Financeiro', margin, 30);
      
      doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, 35, pageWidth - margin, 35);

      let yPos = 55;

      // Financial breakdown
      const items = [
        { label: 'Valor Base do Modelo', value: quotation.base_price },
        { label: 'Desconto Base', value: -(quotation.base_price - quotation.final_base_price), isDiscount: true },
        { label: 'Total Base', value: quotation.final_base_price, isBold: true },
        null, // separator
        { label: 'Opcionais', value: quotation.total_options_price || 0 },
        { label: 'Desconto Opcionais', value: -((quotation.total_options_price || 0) - (quotation.final_options_price || 0)), isDiscount: true },
        { label: 'Total Opcionais', value: quotation.final_options_price || 0, isBold: true },
        null, // separator
        { label: 'Customizações', value: quotation.total_customizations_price || 0 },
      ];

      doc.setFontSize(11);
      
      items.forEach(item => {
        if (item === null) {
          // Separator
          yPos += 5;
          doc.setDrawColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
          doc.setLineWidth(0.2);
          doc.line(margin, yPos, pageWidth - margin, yPos);
          yPos += 5;
          return;
        }

        if (item.isBold) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
        }

        doc.text(item.label, margin, yPos);
        
        const valueText = item.isDiscount && item.value !== 0
          ? `- ${formatCurrency(Math.abs(item.value))}`
          : formatCurrency(item.value);
        
        doc.text(valueText, pageWidth - margin, yPos, { align: 'right' });
        yPos += 8;
      });

      // Grand Total
      yPos += 5;
      doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.text('VALOR TOTAL', margin, yPos);
      doc.text(formatCurrency(quotation.final_price), pageWidth - margin, yPos, { align: 'right' });

      // Delivery
      yPos += 15;
      doc.setFontSize(11);
      doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
      doc.setFont('helvetica', 'normal');
      doc.text(`Prazo de Entrega: ${quotation.total_delivery_days} dias`, margin, yPos);

      // Conditions
      yPos += 15;
      doc.setFontSize(10);
      doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
      
      const conditions = [
        '• Pagamento: 30% entrada, 40% durante a construção, 30% na entrega',
        '• Proposta válida por 30 dias',
        '• Preços sujeitos a alteração sem aviso prévio',
        '• Prazo de entrega após confirmação do pedido e pagamento da entrada'
      ];
      
      conditions.forEach(condition => {
        doc.text(condition, margin, yPos);
        yPos += 6;
      });
      
      addDraftWatermark();
    }

    // ============= PAGE N+4: CONTACT & TERMS =============
    function addContactPage() {
      doc.addPage();
      
      // Title
      doc.setFontSize(18);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('Contato e Termos', margin, 30);
      
      doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, 35, pageWidth - margin, 35);

      let yPos = 55;

      // Sales Representative
      doc.setFontSize(12);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('Consultor Responsável', margin, yPos);
      yPos += 8;

      doc.setFontSize(11);
      doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
      doc.setFont('helvetica', 'normal');
      
      if (quotation.users) {
        doc.text(quotation.users.full_name, margin, yPos);
        yPos += 6;
        doc.text(`Email: ${quotation.users.email}`, margin, yPos);
        yPos += 6;
      }

      // Terms
      yPos += 15;
      doc.setFontSize(12);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('Termos e Condições', margin, yPos);
      yPos += 10;

      doc.setFontSize(9);
      doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
      doc.setFont('helvetica', 'normal');
      
      const terms = [
        'Esta proposta é válida por 30 dias a partir da data de emissão.',
        'Os valores apresentados são estimados e podem sofrer alterações.',
        'O prazo de entrega será confirmado após o fechamento do pedido.',
        'Customizações estão sujeitas à aprovação técnica.',
        'Garantia conforme manual do fabricante.',
      ];
      
      terms.forEach((term, index) => {
        const lines = doc.splitTextToSize(`${index + 1}. ${term}`, contentWidth);
        doc.text(lines, margin, yPos);
        yPos += lines.length * 5;
      });

      // Footer
      yPos = pageHeight - 30;
      doc.setFontSize(12);
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('OKEAN Yachts', pageWidth / 2, yPos, { align: 'center' });
      yPos += 6;
      doc.setFontSize(9);
      doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
      doc.setFont('helvetica', 'normal');
      doc.text('Inovação e Excelência Naval', pageWidth / 2, yPos, { align: 'center' });
      
      addDraftWatermark();
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

    // Create content snapshot for integrity
    const snapshot = {
      quotation_number: quotation.quotation_number,
      version: quotation.version ?? 1,
      final_price: quotation.final_price,
      valid_until: quotation.valid_until,
      model: quotation.yacht_models?.name,
      options: (quotation.quotation_options ?? []).map((o: any) => ({
        code: o.options?.code,
        qty: o.quantity,
        price: o.total_price
      })),
      customizations: (quotation.quotation_customizations ?? []).map((c: any) => ({
        name: c.item_name,
        cost: c.additional_cost,
        status: c.status
      })),
    };

    // Generate integrity hash
    const integrityHash = await generateHash(snapshot);

    // Add page numbers with integrity hash in footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(COLORS.muted[0], COLORS.muted[1], COLORS.muted[2]);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Pagina ${i} de ${pageCount}`,
        pageWidth / 2,
        pageHeight - 6,
        { align: 'center' }
      );
      
      // Integrity hash on bottom
      doc.setFontSize(7);
      doc.text(
        `Hash: ${integrityHash.slice(0, 16)} • Nao altere apos envio`,
        pageWidth / 2,
        pageHeight - 3,
        { align: 'center' }
      );
    }

    // Generate PDF as ArrayBuffer
    const pdfBytes = doc.output('arraybuffer');
    const pdfBlob = new Uint8Array(pdfBytes);

    // Upload to Supabase Storage
    const fileName = `quotation-${quotation.quotation_number}-v${quotation.version ?? 1}-${Date.now()}.pdf`;
    const filePath = `${quotation.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('quotation-pdfs')
      .upload(filePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload PDF: ' + uploadError.message);
    }

    // Generate signed URL (30 days)
    const { data: signedData, error: signError } = await supabase.storage
      .from('quotation-pdfs')
      .createSignedUrl(filePath, 60 * 60 * 24 * 30);

    if (signError) {
      console.error('Signed URL error:', signError);
      throw new Error('Failed to generate signed URL: ' + signError.message);
    }

    console.log('✅ PDF generated successfully:', signedData.signedUrl);

    return new Response(
      JSON.stringify({
        success: true,
        pdfUrl: signedData.signedUrl,
        integrityHash,
        pageCount,
        memorialCompaction: {
          original: memorialItems?.length || 0,
          deduplicated: memorialClean.length,
          reductionPercent: memorialItems && memorialItems.length > 0
            ? Math.round((1 - memorialClean.length / memorialItems.length) * 100)
            : 0
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error generating PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
