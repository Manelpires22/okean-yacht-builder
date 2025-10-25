import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Approval {
  id: string;
  quotation_id: string;
  approval_type: 'commercial' | 'technical' | 'discount' | 'customization';
  requested_by: string;
  requested_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  status: 'pending' | 'approved' | 'rejected';
  request_details: any;
  notes: string | null;
  review_notes: string | null;
  quotations?: {
    quotation_number: string;
    client_name: string;
    client_email: string | null;
    client_phone: string | null;
    final_price: number;
    base_price: number;
    total_options_price: number;
    base_discount_percentage: number;
    options_discount_percentage: number;
    sales_representative_id: string;
    sales_representative?: {
      full_name: string;
      email: string;
      department: string;
    };
    yacht_models?: {
      name: string;
      code: string;
    };
  };
  requester?: {
    full_name: string;
    email: string;
    department: string;
  };
  reviewer?: {
    full_name: string;
    email: string;
  };
}

interface UseApprovalsParams {
  status?: 'pending' | 'approved' | 'rejected';
}

export const useApprovals = (params?: UseApprovalsParams) => {
  return useQuery({
    queryKey: ['approvals', params],
    queryFn: async () => {
      let query = supabase
        .from('approvals')
        .select(`
          *,
          quotations!quotation_id (
            quotation_number,
            client_name,
            client_email,
            client_phone,
            final_price,
            base_price,
            total_options_price,
            base_discount_percentage,
            options_discount_percentage,
            sales_representative_id,
            sales_representative:users!sales_representative_id (
              full_name,
              email,
              department
            ),
            yacht_models (
              name,
              code
            )
          )
        `)
        .order('requested_at', { ascending: false });

      if (params?.status) {
        query = query.eq('status', params.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as unknown as Approval[];
    }
  });
};

export const useApproval = (id: string) => {
  return useQuery({
    queryKey: ['approval', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('approvals')
        .select(`
          *,
          quotations!quotation_id (
            quotation_number,
            client_name,
            client_email,
            client_phone,
            final_price,
            base_price,
            total_options_price,
            base_discount_percentage,
            options_discount_percentage,
            sales_representative_id,
            sales_representative:users!sales_representative_id (
              full_name,
              email,
              department
            ),
            yacht_models (
              name,
              code
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as unknown as Approval;
    },
    enabled: !!id
  });
};

export const usePendingApprovalsCount = () => {
  return useQuery({
    queryKey: ['approvals-count', 'pending'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('approvals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) throw error;
      return count || 0;
    }
  });
};

interface CreateApprovalParams {
  quotation_id: string;
  approval_type: 'discount' | 'customization';
  request_details: any;
  notes?: string;
}

export const useCreateApproval = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateApprovalParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('approvals')
        .insert({
          quotation_id: params.quotation_id,
          approval_type: params.approval_type,
          requested_by: user.id,
          request_details: params.request_details,
          notes: params.notes,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Update quotation status to pending_approval
      const { error: quotationError } = await supabase
        .from('quotations')
        .update({ status: 'pending_approval' })
        .eq('id', params.quotation_id);

      if (quotationError) throw quotationError;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approvals-count'] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success("Solicitação de aprovação enviada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar solicitação: ${error.message}`);
    }
  });
};

interface ReviewApprovalParams {
  id: string;
  status: 'approved' | 'rejected';
  review_notes?: string;
}

export const useReviewApproval = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ReviewApprovalParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Get the approval to update quotation
      const { data: approval, error: approvalError } = await supabase
        .from('approvals')
        .select('quotation_id')
        .eq('id', params.id)
        .single();

      if (approvalError) throw approvalError;

      // Update approval
      const { error } = await supabase
        .from('approvals')
        .update({
          status: params.status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_notes: params.review_notes
        })
        .eq('id', params.id);

      if (error) throw error;

      // Check if there are any remaining pending approvals for this quotation
      const { data: pendingApprovals, error: pendingError } = await supabase
        .from('approvals')
        .select('id, approval_type')
        .eq('quotation_id', approval.quotation_id)
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      // Determine new quotation status based on remaining pending approvals
      let newQuotationStatus = 'draft';
      
      if (!pendingApprovals || pendingApprovals.length === 0) {
        // All approvals completed
        newQuotationStatus = params.status === 'approved' ? 'ready_to_send' : 'draft';
      } else {
        // Check which types of approvals are still pending
        const hasPendingCommercial = pendingApprovals.some(a => a.approval_type === 'commercial');
        const hasPendingTechnical = pendingApprovals.some(a => a.approval_type === 'technical');

        if (hasPendingCommercial && hasPendingTechnical) {
          newQuotationStatus = 'pending_approval';
        } else if (hasPendingCommercial) {
          newQuotationStatus = 'pending_commercial_approval';
        } else if (hasPendingTechnical) {
          newQuotationStatus = 'pending_technical_approval';
        }
      }

      const { error: quotationError } = await supabase
        .from('quotations')
        .update({ status: newQuotationStatus })
        .eq('id', approval.quotation_id);

      if (quotationError) throw quotationError;

      return params;
    },
    onSuccess: (params) => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approvals-count'] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      
      const message = params.status === 'approved' 
        ? "Aprovação concedida com sucesso!" 
        : "Solicitação rejeitada";
      toast.success(message);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao processar aprovação: ${error.message}`);
    }
  });
};
