import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ResetMFAPayload {
  target_user_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Verify the requesting user
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user: requestingUser }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !requestingUser) {
      console.error('Error getting user:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Usuário não autenticado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Check if requesting user is admin
    const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc('has_role', {
      _user_id: requestingUser.id,
      _role: 'administrador'
    });

    if (roleError || !isAdmin) {
      console.error('User is not admin:', requestingUser.id);
      return new Response(
        JSON.stringify({ success: false, error: 'Apenas administradores podem resetar MFA' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Parse payload
    const payload: ResetMFAPayload = await req.json();
    
    if (!payload.target_user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'ID do usuário é obrigatório' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Admin ${requestingUser.email} resetting MFA for user ${payload.target_user_id}`);

    // Get all MFA factors for the target user
    const { data: factorsData, error: factorsError } = await supabaseAdmin.auth.admin.mfa.listFactors({
      userId: payload.target_user_id
    });

    if (factorsError) {
      console.error('Error listing MFA factors:', factorsError);
      return new Response(
        JSON.stringify({ success: false, error: 'Erro ao listar fatores MFA' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Delete all MFA factors
    const allFactors = factorsData?.factors || [];
    
    for (const factor of allFactors) {
      const { error: deleteError } = await supabaseAdmin.auth.admin.mfa.deleteFactor({
        userId: payload.target_user_id,
        id: factor.id
      });

      if (deleteError) {
        console.error(`Error deleting factor ${factor.id}:`, deleteError);
      }
    }

    // Delete recovery codes
    const { error: deleteCodesError } = await supabaseAdmin
      .from('mfa_recovery_codes')
      .delete()
      .eq('user_id', payload.target_user_id);

    if (deleteCodesError) {
      console.error('Error deleting recovery codes:', deleteCodesError);
    }

    // Log the action
    await supabaseAdmin.from('audit_logs').insert({
      user_id: requestingUser.id,
      user_email: requestingUser.email,
      action: 'MFA_RESET',
      table_name: 'auth.mfa_factors',
      record_id: payload.target_user_id,
      new_values: { action: 'reset_mfa', factors_deleted: allFactors.length }
    });

    console.log(`MFA reset successful for user ${payload.target_user_id}. ${allFactors.length} factors deleted.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'MFA resetado com sucesso',
        factors_deleted: allFactors.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno do servidor' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
