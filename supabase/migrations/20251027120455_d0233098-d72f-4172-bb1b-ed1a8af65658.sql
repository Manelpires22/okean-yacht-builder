-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  user_name text,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'CUSTOM')),
  table_name text,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  changed_fields text[],
  ip_address inet,
  user_agent text,
  route text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_record_id ON public.audit_logs(record_id);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'administrador'::app_role));

-- System can insert audit logs (no RLS restriction for INSERT)
CREATE POLICY "System can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email_val text;
  user_name_val text;
  changed_fields_array text[] := '{}';
  old_val jsonb;
  new_val jsonb;
  key text;
BEGIN
  -- Get user info from auth.users
  SELECT email INTO user_email_val
  FROM auth.users
  WHERE id = auth.uid();
  
  -- Get user name from users table
  SELECT full_name INTO user_name_val
  FROM public.users
  WHERE id = auth.uid();

  -- Determine action and values
  IF (TG_OP = 'DELETE') THEN
    old_val := to_jsonb(OLD);
    new_val := NULL;
    
    INSERT INTO public.audit_logs (
      user_id,
      user_email,
      user_name,
      action,
      table_name,
      record_id,
      old_values,
      new_values,
      changed_fields,
      created_at
    ) VALUES (
      auth.uid(),
      user_email_val,
      user_name_val,
      'DELETE',
      TG_TABLE_NAME,
      OLD.id,
      old_val,
      NULL,
      NULL,
      now()
    );
    
    RETURN OLD;
    
  ELSIF (TG_OP = 'UPDATE') THEN
    old_val := to_jsonb(OLD);
    new_val := to_jsonb(NEW);
    
    -- Detect changed fields
    FOR key IN SELECT jsonb_object_keys(new_val)
    LOOP
      IF old_val->key IS DISTINCT FROM new_val->key THEN
        changed_fields_array := array_append(changed_fields_array, key);
      END IF;
    END LOOP;
    
    -- Only log if there are actual changes
    IF array_length(changed_fields_array, 1) > 0 THEN
      INSERT INTO public.audit_logs (
        user_id,
        user_email,
        user_name,
        action,
        table_name,
        record_id,
        old_values,
        new_values,
        changed_fields,
        created_at
      ) VALUES (
        auth.uid(),
        user_email_val,
        user_name_val,
        'UPDATE',
        TG_TABLE_NAME,
        NEW.id,
        old_val,
        new_val,
        changed_fields_array,
        now()
      );
    END IF;
    
    RETURN NEW;
    
  ELSIF (TG_OP = 'INSERT') THEN
    new_val := to_jsonb(NEW);
    
    INSERT INTO public.audit_logs (
      user_id,
      user_email,
      user_name,
      action,
      table_name,
      record_id,
      old_values,
      new_values,
      changed_fields,
      created_at
    ) VALUES (
      auth.uid(),
      user_email_val,
      user_name_val,
      'INSERT',
      TG_TABLE_NAME,
      NEW.id,
      NULL,
      new_val,
      NULL,
      now()
    );
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create triggers on critical tables
CREATE TRIGGER audit_quotations_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_users_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_user_roles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_options_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.options
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_yacht_models_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.yacht_models
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_clients_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_approvals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.approvals
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_quotation_customizations_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.quotation_customizations
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_discount_limits_config_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.discount_limits_config
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_memorial_items_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.memorial_items
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_memorial_categories_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.memorial_categories
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();