import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OriginalContractPDFRequest {
  contract_id: string;
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

    const { contract_id } = await req.json() as OriginalContractPDFRequest;

    if (!contract_id) {
      throw new Error('contract_id is required');
    }

    console.log('Fetching contract for original PDF:', contract_id);

    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(`
        *,
        client:clients(*),
        yacht_model:yacht_models(*),
        quotation:quotations(*)
      `)
      .eq('id', contract_id)
      .single();

    if (contractError || !contract) {
      throw new Error('Contract not found');
    }

    const baseSnapshot = contract.base_snapshot as any;
    
    if (!baseSnapshot) {
      throw new Error('No base snapshot available for this contract');
    }

    // HTML template for original contract
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
            .item-list {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 6px;
              margin: 10px 0;
            }
            .item {
              padding: 10px;
              border-bottom: 1px solid #e0e0e0;
            }
            .item:last-child {
              border-bottom: none;
            }
            .item-name {
              font-weight: 600;
              color: #1a1a1a;
            }
            .item-details {
              font-size: 14px;
              color: #666;
              margin-top: 5px;
            }
            .financial-summary {
              background: #e8f4fd;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .price-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              font-size: 16px;
            }
            .price-row.total {
              border-top: 2px solid #0066cc;
              margin-top: 10px;
              padding-top: 15px;
              font-size: 20px;
              font-weight: bold;
              color: #0066cc;
            }
            .signature-section {
              margin-top: 50px;
              padding-top: 30px;
              border-top: 2px solid #e0e0e0;
            }
            .signature-box {
              margin-top: 20px;
              text-align: center;
            }
            .signature-line {
              border-top: 1px solid #333;
              width: 300px;
              margin: 40px auto 10px;
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
            <div class="document-title">Contrato Original</div>
            <div class="subtitle">Como Aprovado pelo Cliente</div>
          </div>

          <div class="section">
            <div class="section-title">Informações do Contrato</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Número do Contrato</div>
                <div class="info-value">${contract.contract_number}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Data de Assinatura</div>
                <div class="info-value">${contract.signed_at ? new Date(contract.signed_at).toLocaleDateString('pt-BR') : 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Cliente</div>
                <div class="info-value">${contract.client?.name || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Modelo do Iate</div>
                <div class="info-value">${contract.yacht_model?.name || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Configuração Original</div>
            ${baseSnapshot.selectedOptions?.length > 0 ? `
              <div class="item-list">
                <h4 style="margin-top: 0; color: #666;">Opcionais Selecionados:</h4>
                ${baseSnapshot.selectedOptions.map((opt: any) => `
                  <div class="item">
                    <div class="item-name">${opt.name || 'N/A'}</div>
                    <div class="item-details">
                      Quantidade: ${opt.quantity || 1} | 
                      Preço unitário: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(opt.unit_price || 0)}
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : '<p style="color: #666;">Nenhum opcional selecionado</p>'}
          </div>

          <div class="section">
            <div class="section-title">Memorial Descritivo Original</div>
            ${baseSnapshot.memorialItems?.length > 0 ? `
              <div class="item-list">
                ${baseSnapshot.memorialItems.map((item: any) => `
                  <div class="item">
                    <div class="item-name">${item.item_name || 'N/A'}</div>
                    <div class="item-details">
                      ${item.brand ? `Marca: ${item.brand}` : ''} 
                      ${item.model ? `| Modelo: ${item.model}` : ''}
                      ${item.quantity ? `| Quantidade: ${item.quantity}` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : '<p style="color: #666;">Nenhum item de memorial disponível</p>'}
          </div>

          <div class="section">
            <div class="section-title">Resumo Financeiro Original</div>
            <div class="financial-summary">
              <div class="price-row">
                <span>Preço Base:</span>
                <span>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.base_price)}</span>
              </div>
              ${baseSnapshot.totalOptionsPrice ? `
                <div class="price-row">
                  <span>Opcionais:</span>
                  <span>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(baseSnapshot.totalOptionsPrice)}</span>
                </div>
              ` : ''}
              <div class="price-row total">
                <span>VALOR TOTAL:</span>
                <span>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.base_price)}</span>
              </div>
            </div>
            <div class="info-grid" style="margin-top: 20px;">
              <div class="info-item">
                <div class="info-label">Prazo de Entrega Original</div>
                <div class="info-value">${contract.base_delivery_days} dias</div>
              </div>
            </div>
          </div>

          ${contract.signed_by_name ? `
            <div class="signature-section">
              <div class="section-title">Assinatura do Cliente</div>
              <div class="signature-box">
                <div class="signature-line"></div>
                <p><strong>${contract.signed_by_name}</strong></p>
                <p style="color: #666; font-size: 14px;">${contract.signed_by_email}</p>
                <p style="color: #666; font-size: 14px;">Assinado em: ${new Date(contract.signed_at).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          ` : ''}

          <div class="footer">
            <p>Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
            <p>OKEAN Yachts - Excelência em Embarcações de Luxo</p>
          </div>
        </body>
      </html>
    `;

    console.log('Generating PDF from HTML for original contract');

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
    console.error('Error generating original contract PDF:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
