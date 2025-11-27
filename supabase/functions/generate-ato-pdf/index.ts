import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ATOPDFRequest {
  ato_id: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { ato_id } = await req.json() as ATOPDFRequest;

    if (!ato_id) {
      throw new Error('ato_id is required');
    }

    console.log('Fetching ATO for PDF:', ato_id);

    const { data: ato, error: atoError } = await supabase
      .from('additional_to_orders')
      .select(`
        *,
        contract:contracts(
          *,
          client:clients(*),
          yacht_model:yacht_models(*)
        )
      `)
      .eq('id', ato_id)
      .single();

    if (atoError || !ato) {
      throw new Error('ATO not found');
    }

    // Fetch ATO configurations
    const { data: configurations } = await supabase
      .from('ato_configurations')
      .select('*')
      .eq('ato_id', ato_id);

    const statusBadge = ato.status === 'approved' ? 
      '<span style="background: #22c55e; color: white; padding: 4px 12px; border-radius: 4px; font-size: 14px;">✓ Aprovado</span>' :
      ato.status === 'pending' ?
      '<span style="background: #f59e0b; color: white; padding: 4px 12px; border-radius: 4px; font-size: 14px;">⏳ Pendente</span>' :
      '<span style="background: #ef4444; color: white; padding: 4px 12px; border-radius: 4px; font-size: 14px;">✗ Rejeitado</span>';

    // HTML template for ATO
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 40px;
              color: #1a1a1a;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #0066cc;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .company-name {
              font-size: 32px;
              font-weight: bold;
              color: #0066cc;
              margin-bottom: 5px;
            }
            .document-title {
              font-size: 24px;
              color: #333;
              margin-top: 10px;
            }
            .subtitle {
              font-size: 14px;
              color: #666;
              margin-top: 5px;
            }
            .reference {
              background: #f0f7ff;
              padding: 15px;
              border-radius: 6px;
              margin: 20px 0;
              border-left: 4px solid #0066cc;
            }
            .section {
              margin: 30px 0;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #0066cc;
              margin-bottom: 15px;
              border-bottom: 2px solid #e0e0e0;
              padding-bottom: 5px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin: 20px 0;
            }
            .info-item {
              background: #f8f9fa;
              padding: 12px;
              border-radius: 6px;
            }
            .info-label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .info-value {
              font-size: 16px;
              color: #1a1a1a;
              font-weight: 600;
              margin-top: 4px;
            }
            .description-box {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 6px;
              margin: 15px 0;
              line-height: 1.6;
            }
            .item-list {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 6px;
              margin: 10px 0;
            }
            .config-item {
              padding: 12px;
              border-bottom: 1px solid #e0e0e0;
              margin-bottom: 10px;
            }
            .config-item:last-child {
              border-bottom: none;
              margin-bottom: 0;
            }
            .config-type {
              background: #0066cc;
              color: white;
              padding: 2px 8px;
              border-radius: 3px;
              font-size: 12px;
              font-weight: 600;
              display: inline-block;
              margin-bottom: 8px;
            }
            .config-name {
              font-weight: 600;
              color: #1a1a1a;
              font-size: 15px;
            }
            .sub-items {
              margin-top: 8px;
              padding-left: 20px;
              font-size: 14px;
              color: #666;
            }
            .sub-item {
              padding: 4px 0;
            }
            .financial-impact {
              background: #e8f4fd;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .impact-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              font-size: 16px;
            }
            .impact-row.highlight {
              color: #0066cc;
              font-weight: 600;
            }
            .impact-row.total {
              border-top: 2px solid #0066cc;
              margin-top: 10px;
              padding-top: 15px;
              font-size: 20px;
              font-weight: bold;
              color: #0066cc;
            }
            .status-section {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              text-align: center;
            }
            .approval-info {
              margin-top: 15px;
              font-size: 14px;
              color: #666;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              color: #999;
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">OKEAN YACHTS</div>
            <div class="document-title">Aditivo ao Contrato</div>
            <div class="subtitle">${ato.ato_number}</div>
          </div>

          <div class="reference">
            <strong>Referência:</strong> Contrato ${ato.contract?.contract_number} | 
            Cliente: ${ato.contract?.client?.name} | 
            Modelo: ${ato.contract?.yacht_model?.name}
          </div>

          <div class="section">
            <div class="section-title">Informações da ATO</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Número da ATO</div>
                <div class="info-value">${ato.ato_number}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Data de Solicitação</div>
                <div class="info-value">${ato.requested_at ? new Date(ato.requested_at).toLocaleDateString('pt-BR') : 'N/A'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">${ato.title}</div>
            ${ato.description ? `
              <div class="description-box">
                ${ato.description}
              </div>
            ` : ''}
          </div>

          ${configurations && configurations.length > 0 ? `
            <div class="section">
              <div class="section-title">Itens Configurados</div>
              <div class="item-list">
                ${configurations.map((config: any) => {
                  const subItems = config.sub_items ? JSON.parse(config.sub_items) : null;
                  return `
                    <div class="config-item">
                      <div class="config-type">${config.item_type === 'option' ? 'OPCIONAL' : config.item_type === 'memorial' ? 'MEMORIAL' : 'CUSTOMIZAÇÃO'}</div>
                      <div class="config-name">
                        ${config.configuration_details?.name || config.configuration_details?.item_name || 'Item não especificado'}
                      </div>
                      ${subItems && subItems.length > 0 ? `
                        <div class="sub-items">
                          <strong>Sub-itens configurados:</strong>
                          ${subItems.map((sub: any) => `
                            <div class="sub-item">→ ${sub.label || sub.name}: ${sub.value || sub.selectedValue || 'N/A'}</div>
                          `).join('')}
                        </div>
                      ` : ''}
                      ${config.notes ? `
                        <div class="sub-items" style="margin-top: 8px;">
                          <strong>Observações:</strong> ${config.notes}
                        </div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}

          <div class="section">
            <div class="section-title">Impacto Financeiro e Prazo</div>
            <div class="financial-impact">
              ${ato.price_impact ? `
                <div class="impact-row">
                  <span>Valor Base da ATO:</span>
                  <span>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ato.price_impact)}</span>
                </div>
              ` : ''}
              ${ato.discount_percentage && ato.discount_percentage > 0 ? `
                <div class="impact-row highlight">
                  <span>Desconto Aplicado (${ato.discount_percentage}%):</span>
                  <span>-${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((ato.price_impact || 0) * (ato.discount_percentage / 100))}</span>
                </div>
              ` : ''}
              ${ato.price_impact ? `
                <div class="impact-row total">
                  <span>VALOR FINAL DA ATO:</span>
                  <span>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((ato.price_impact || 0) * (1 - (ato.discount_percentage || 0) / 100))}</span>
                </div>
              ` : ''}
            </div>
            ${ato.delivery_days_impact ? `
              <div class="info-item" style="margin-top: 15px;">
                <div class="info-label">Impacto no Prazo de Entrega</div>
                <div class="info-value">+${ato.delivery_days_impact} dias</div>
              </div>
            ` : ''}
          </div>

          <div class="section">
            <div class="section-title">Status de Aprovação</div>
            <div class="status-section">
              <div>${statusBadge}</div>
              ${ato.status === 'approved' && ato.approved_at ? `
                <div class="approval-info">
                  <p><strong>Aprovado em:</strong> ${new Date(ato.approved_at).toLocaleDateString('pt-BR')}</p>
                </div>
              ` : ''}
              ${ato.status === 'rejected' && ato.rejection_reason ? `
                <div class="approval-info">
                  <p><strong>Motivo da Rejeição:</strong> ${ato.rejection_reason}</p>
                </div>
              ` : ''}
              ${ato.notes ? `
                <div class="approval-info">
                  <p><strong>Observações:</strong> ${ato.notes}</p>
                </div>
              ` : ''}
            </div>
          </div>

          <div class="footer">
            <p>Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
            <p>OKEAN Yachts - Excelência em Embarcações de Luxo</p>
          </div>
        </body>
      </html>
    `;

    console.log('Generating PDF from HTML for ATO');

    const html2pdfApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!html2pdfApiKey) {
      console.warn('LOVABLE_API_KEY not found, returning HTML as fallback');
      return new Response(JSON.stringify({
        success: true,
        format: 'html',
        data: btoa(html)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const pdfResponse = await fetch('https://api.html2pdf.app/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': html2pdfApiKey
      },
      body: JSON.stringify({
        html: html,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          bottom: '20px',
          left: '20px',
          right: '20px'
        }
      })
    });

    if (!pdfResponse.ok) {
      console.error('PDF generation failed:', await pdfResponse.text());
      return new Response(JSON.stringify({
        success: true,
        format: 'html',
        data: btoa(html)
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    return new Response(JSON.stringify({
      success: true,
      format: 'pdf',
      data: base64Pdf
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error generating ATO PDF:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
