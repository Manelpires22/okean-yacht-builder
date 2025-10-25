import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STEP_NAMES: Record<string, string> = {
  pm_initial: 'Análise PM Inicial',
  supply_quote: 'Cotação Supply',
  planning_check: 'Validação Planejamento',
  pm_final: 'Aprovação PM Final',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { assignedTo, customizationId, stepType } = await req.json();

    console.log(`Sending notification: ${stepType} to ${assignedTo}`);

    // Fetch user data
    const { data: user } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', assignedTo)
      .single();

    if (!user) {
      console.warn('User not found:', assignedTo);
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch customization data
    const { data: customization } = await supabase
      .from('quotation_customizations')
      .select(`
        item_name,
        quotation_id
      `)
      .eq('id', customizationId)
      .single();
    
    const { data: quotation } = await supabase
      .from('quotations')
      .select('quotation_number, client_name')
      .eq('id', customization?.quotation_id)
      .single();

    if (!customization) {
      console.warn('Customization not found:', customizationId);
      return new Response(JSON.stringify({ error: 'Customization not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get SLA deadline
    const { data: slaConfig } = await supabase
      .from('workflow_config')
      .select('config_value')
      .eq('config_key', 'sla_days')
      .single();

    const slaDays = slaConfig?.config_value?.[stepType] || 2;
    const slaDeadline = new Date();
    slaDeadline.setDate(slaDeadline.getDate() + slaDays);

    // Send email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not configured');
      return new Response(JSON.stringify({ warning: 'Email notification skipped - API key not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'OKEAN Yachts <noreply@okeanyachts.com>',
        to: user.email,
        subject: `[OKEAN] Nova Customização Atribuída: ${STEP_NAMES[stepType] || stepType}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Olá ${user.full_name},</h2>
            <p>Uma nova customização foi atribuída a você:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <ul style="list-style: none; padding: 0;">
                <li><strong>Cotação:</strong> ${quotation?.quotation_number || 'N/A'}</li>
                <li><strong>Cliente:</strong> ${quotation?.client_name || 'N/A'}</li>
                <li><strong>Item:</strong> ${customization.item_name}</li>
                <li><strong>Etapa:</strong> ${STEP_NAMES[stepType] || stepType}</li>
                <li><strong>Prazo:</strong> ${slaDeadline.toLocaleDateString('pt-BR')}</li>
              </ul>
            </div>
            <a href="https://app.okeanyachts.com/aprovacoes" 
               style="display: inline-block; background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 20px;">
              Acessar Sistema
            </a>
            <p style="margin-top: 30px; font-size: 12px; color: #666;">
              Este é um email automático. Por favor, não responda.
            </p>
          </div>
        `,
      }),
    });

    console.log(`Notification sent successfully to ${user.email}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Notification sent' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
