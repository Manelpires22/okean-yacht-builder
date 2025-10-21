-- Create function to update updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR NOT NULL,
  email VARCHAR,
  phone VARCHAR,
  company VARCHAR,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on clients
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Users can view all clients
CREATE POLICY "Users can view all clients"
ON public.clients
FOR SELECT
TO authenticated
USING (true);

-- Users can create clients
CREATE POLICY "Users can create clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Users can update clients they created
CREATE POLICY "Users can update their clients"
ON public.clients
FOR UPDATE
TO authenticated
USING (created_by = auth.uid() OR has_role(auth.uid(), 'gerente_comercial'::app_role) OR has_role(auth.uid(), 'administrador'::app_role));

-- Admins can delete clients
CREATE POLICY "Admins can delete clients"
ON public.clients
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'administrador'::app_role));

-- Add client_id to quotations table
ALTER TABLE public.quotations ADD COLUMN client_id UUID REFERENCES public.clients(id);

-- Create index for better performance
CREATE INDEX idx_quotations_client_id ON public.quotations(client_id);
CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_quotations_status ON public.quotations(status);
CREATE INDEX idx_quotations_created_at ON public.quotations(created_at DESC);

-- Add trigger for updated_at on clients
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();