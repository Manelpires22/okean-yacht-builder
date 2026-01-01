import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verificar autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar token do utilizador
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ success: false, error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se é administrador
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id);

    const isAdmin = roles?.some((r) => r.role === "administrador");
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Apenas administradores podem excluir utilizadores" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obter user_id a excluir
    const { user_id: userIdToDelete } = await req.json();
    
    if (!userIdToDelete) {
      return new Response(
        JSON.stringify({ success: false, error: "ID do utilizador é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Impedir auto-exclusão
    if (userIdToDelete === requestingUser.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Não pode excluir a si próprio" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Obter dados do utilizador antes de excluir (para audit log)
    const { data: userToDelete } = await supabaseAdmin
      .from("users")
      .select("full_name, email")
      .eq("id", userIdToDelete)
      .single();

    console.log(`Deleting user: ${userIdToDelete} (${userToDelete?.email})`);

    // Excluir dados em cascata
    // 1. PM assignments
    const { error: pmError } = await supabaseAdmin
      .from("pm_yacht_model_assignments")
      .delete()
      .eq("pm_user_id", userIdToDelete);
    
    if (pmError) console.log("PM assignments deletion:", pmError.message);

    // 2. User roles
    const { error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", userIdToDelete);
    
    if (rolesError) console.log("Roles deletion:", rolesError.message);

    // 3. MFA recovery codes
    const { error: mfaError } = await supabaseAdmin
      .from("mfa_recovery_codes")
      .delete()
      .eq("user_id", userIdToDelete);
    
    if (mfaError) console.log("MFA codes deletion:", mfaError.message);

    // 4. Users table
    const { error: usersError } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", userIdToDelete);
    
    if (usersError) {
      console.error("Users table deletion error:", usersError);
      return new Response(
        JSON.stringify({ success: false, error: `Erro ao excluir perfil: ${usersError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Auth user
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete);
    
    if (authDeleteError) {
      console.error("Auth user deletion error:", authDeleteError);
      return new Response(
        JSON.stringify({ success: false, error: `Erro ao excluir conta: ${authDeleteError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Registrar no audit log
    await supabaseAdmin.from("audit_logs").insert({
      user_id: requestingUser.id,
      action: "DELETE_USER",
      table_name: "users",
      record_id: userIdToDelete,
      old_values: userToDelete,
      metadata: {
        deleted_user_email: userToDelete?.email,
        deleted_user_name: userToDelete?.full_name,
      },
    });

    console.log(`User ${userIdToDelete} deleted successfully by ${requestingUser.id}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Delete user error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
