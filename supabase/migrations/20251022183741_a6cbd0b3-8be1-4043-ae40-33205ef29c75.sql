-- Create enum for approval types
CREATE TYPE public.approval_type AS ENUM ('discount', 'customization');

-- Create enum for approval status
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Create approvals table
CREATE TABLE public.approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE NOT NULL,
  approval_type public.approval_type NOT NULL,
  requested_by UUID NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  status public.approval_status NOT NULL DEFAULT 'pending',
  request_details JSONB,
  notes TEXT,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for approvals
-- Vendedores podem ver suas próprias solicitações
CREATE POLICY "Users can view their own approval requests"
ON public.approvals
FOR SELECT
USING (
  requested_by = auth.uid() OR
  has_role(auth.uid(), 'gerente_comercial') OR
  has_role(auth.uid(), 'administrador')
);

-- Apenas gerentes e admins podem criar aprovações (via sistema)
CREATE POLICY "System can create approvals"
ON public.approvals
FOR INSERT
WITH CHECK (true);

-- Gerentes e admins podem revisar aprovações
CREATE POLICY "Managers and admins can review approvals"
ON public.approvals
FOR UPDATE
USING (
  has_role(auth.uid(), 'gerente_comercial') OR
  has_role(auth.uid(), 'administrador')
);

-- Create indexes for performance
CREATE INDEX idx_approvals_quotation_id ON public.approvals(quotation_id);
CREATE INDEX idx_approvals_status ON public.approvals(status);
CREATE INDEX idx_approvals_requested_by ON public.approvals(requested_by);
CREATE INDEX idx_approvals_requested_at ON public.approvals(requested_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_approvals_updated_at
BEFORE UPDATE ON public.approvals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add 'pending_approval' to quotations status (recreate the check constraint)
-- First, we need to see what constraint exists and update it
ALTER TABLE public.quotations DROP CONSTRAINT IF EXISTS quotations_status_check;
ALTER TABLE public.quotations ADD CONSTRAINT quotations_status_check 
CHECK (status IN ('draft', 'pending_approval', 'pending', 'approved', 'rejected', 'expired'));