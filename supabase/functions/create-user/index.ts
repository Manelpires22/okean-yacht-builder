import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserPayload {
  email: string;
  password: string;
  full_name: string;
  department: string;
  roles: string[];
  pm_yacht_models: string[];
  is_active: boolean;
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
      throw new Error('Only administrators can create users');
    }

    // Parse request body
    const payload: CreateUserPayload = await req.json();
    console.log('Creating user:', { email: payload.email, full_name: payload.full_name });

    // Validate payload
    if (!payload.email || !payload.password || !payload.full_name || !payload.department) {
      throw new Error('Missing required fields');
    }

    if (payload.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
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

    // Check if user already exists in auth.users
    const { data: existingAuthUsers } = await supabase.auth.admin.listUsers();
    const emailExists = existingAuthUsers?.users?.some(u => u.email?.toLowerCase() === payload.email.toLowerCase());
    
    if (emailExists) {
      throw new Error('Um utilizador com este email já existe no sistema');
    }

    // Create user in Supabase Auth
    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
    });

    if (createError) {
      console.error('Error creating auth user:', createError);
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    const userId = authData.user.id;
    console.log('Auth user created:', userId);

    // Insert user data into users table (or update if trigger already created it)
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: payload.email,
        full_name: payload.full_name,
        department: payload.department,
        is_active: payload.is_active,
      }, {
        onConflict: 'id'
      });

    if (userError) {
      console.error('Error inserting user data:', userError);
      // Rollback: delete auth user
      await supabase.auth.admin.deleteUser(userId);
      throw new Error(`Failed to create user profile: ${userError.message}`);
    }

    // Insert roles
    const roleInserts = payload.roles.map(role => ({
      user_id: userId,
      role: role,
    }));

    const { error: rolesError } = await supabase
      .from('user_roles')
      .insert(roleInserts);

    if (rolesError) {
      console.error('Error inserting roles:', rolesError);
      // Rollback: delete user and auth user
      await supabase.from('users').delete().eq('id', userId);
      await supabase.auth.admin.deleteUser(userId);
      throw new Error(`Failed to assign roles: ${rolesError.message}`);
    }

    // Insert PM yacht model assignments if PM role is selected
    if (payload.roles.includes('pm_engenharia') && payload.pm_yacht_models?.length > 0) {
      const pmAssignments = payload.pm_yacht_models.map(modelId => ({
        pm_user_id: userId,
        yacht_model_id: modelId,
        assigned_by: requestingUser.id,
      }));

      const { error: pmError } = await supabase
        .from('pm_yacht_model_assignments')
        .insert(pmAssignments);

      if (pmError) {
        console.error('Error inserting PM assignments:', pmError);
        // Rollback: delete user, roles and auth user
        await supabase.from('user_roles').delete().eq('user_id', userId);
        await supabase.from('users').delete().eq('id', userId);
        await supabase.auth.admin.deleteUser(userId);
        throw new Error(`Failed to assign yacht models: ${pmError.message}`);
      }
    }

    console.log('User created successfully:', userId);

    // Return created user with roles
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userId,
          email: payload.email,
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
    console.error('Error in create-user function:', error);
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
