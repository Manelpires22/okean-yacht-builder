import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateUserPayload {
  user_id: string;
  full_name: string;
  department: string;
  roles: string[];
  pm_yacht_models: string[];
  is_active: boolean;
  new_password?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authenticated user from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user is an admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !requestingUser) {
      throw new Error('Unauthorized');
    }

    // Check if requesting user has admin role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id);

    const isAdmin = roles?.some(r => r.role === 'administrador');
    if (!isAdmin) {
      throw new Error('Only administrators can update users');
    }

    // Parse request body
    const payload: UpdateUserPayload = await req.json();
    console.log('Updating user:', payload.user_id);

    // Validate payload
    if (!payload.user_id || !payload.full_name || !payload.department) {
      throw new Error('Missing required fields');
    }

    if (!payload.roles || payload.roles.length === 0) {
      throw new Error('At least one role must be selected');
    }

    // Validate roles against enum
    const validRoles = [
      'administrador', 'gerente_comercial', 'comercial', 'producao', 'financeiro',
      'pm_engenharia', 'comprador', 'planejador', 'diretor_comercial', 
      'broker', 'backoffice_comercial'
    ];
    const invalidRoles = payload.roles.filter(r => !validRoles.includes(r));
    if (invalidRoles.length > 0) {
      throw new Error(`Roles inválidos: ${invalidRoles.join(', ')}`);
    }

    // Update user data in users table
    const { error: userError } = await supabase
      .from('users')
      .update({
        full_name: payload.full_name,
        department: payload.department,
        is_active: payload.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.user_id);

    if (userError) {
      console.error('Error updating user data:', userError);
      throw new Error(`Failed to update user: ${userError.message}`);
    }

    // Update roles: delete all existing roles and insert new ones
    const { error: deleteRolesError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', payload.user_id);

    if (deleteRolesError) {
      console.error('Error deleting old roles:', deleteRolesError);
      throw new Error(`Failed to update roles: ${deleteRolesError.message}`);
    }

    const roleInserts = payload.roles.map(role => ({
      user_id: payload.user_id,
      role: role,
    }));

    const { error: insertRolesError } = await supabase
      .from('user_roles')
      .insert(roleInserts);

    if (insertRolesError) {
      console.error('Error inserting new roles:', insertRolesError);
      throw new Error(`Failed to assign roles: ${insertRolesError.message}`);
    }

    // Update PM yacht model assignments if PM role is selected
    // First, delete existing assignments
    await supabase
      .from('pm_yacht_model_assignments')
      .delete()
      .eq('pm_user_id', payload.user_id);

    // Then insert new ones if PM role is selected
    if (payload.roles.includes('pm_engenharia') && payload.pm_yacht_models?.length > 0) {
      const pmAssignments = payload.pm_yacht_models.map(modelId => ({
        pm_user_id: payload.user_id,
        yacht_model_id: modelId,
        assigned_by: requestingUser.id,
      }));

      const { error: pmError } = await supabase
        .from('pm_yacht_model_assignments')
        .insert(pmAssignments);

      if (pmError) {
        console.error('Error updating PM assignments:', pmError);
        // Don't fail the entire update if PM assignments fail
        console.warn('Continuing despite PM assignment error');
      }
    }

    // Update password if provided
    if (payload.new_password && payload.new_password.length >= 8) {
      const { error: passwordError } = await supabase.auth.admin.updateUserById(
        payload.user_id,
        { password: payload.new_password }
      );

      if (passwordError) {
        console.error('Error updating password:', passwordError);
        throw new Error(`Failed to update password: ${passwordError.message}`);
      }

      console.log('Password updated for user:', payload.user_id);
    }

    console.log('User updated successfully:', payload.user_id);

    // Return updated user with roles
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: payload.user_id,
          full_name: payload.full_name,
          department: payload.department,
          is_active: payload.is_active,
          roles: payload.roles,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in update-user function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
