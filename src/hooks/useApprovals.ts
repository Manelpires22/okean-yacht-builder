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
            yacht_model_id,
            sales_representative:users!sales_representative_id (
              full_name,
              email,
              department
            ),
            yacht_models (
              name,
              code,
              pm_assignments:pm_yacht_model_assignments(
                pm_user:users!pm_user_id(
                  id,
                  full_name,
                  email
                )
              )
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
            yacht_model_id,
            sales_representative:users!sales_representative_id (
              full_name,
              email,
              department
            ),
            yacht_models (
              name,
              code,
              pm_assignments:pm_yacht_model_assignments(
                pm_user:users!pm_user_id(
                  id,
                  full_name,
                  email
                )
              )
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
  additional_cost?: number;
  delivery_impact_days?: number;
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
        .select('quotation_id, approval_type')
        .eq('id', params.id)
        .single();

      if (approvalError) throw approvalError;

      // Prepare update data
      const updateData: any = {
        status: params.status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: params.review_notes
      };

      // For technical approvals, store cost and delivery impact in request_details
      if (approval.approval_type === 'technical' && params.status === 'approved') {
        const { data: currentApproval } = await supabase
          .from('approvals')
          .select('request_details')
          .eq('id', params.id)
          .single();

        const existingDetails = (currentApproval?.request_details as Record<string, any>) || {};
        
        updateData.request_details = {
          ...existingDetails,
          additional_cost: params.additional_cost || 0,
          delivery_impact_days: params.delivery_impact_days || 0
        };
      }

      // Update approval
      const { error } = await supabase
        .from('approvals')
        .update(updateData)
        .eq('id', params.id);

      if (error) throw error;

      // If technical approval was approved, initialize workflow
      if (approval.approval_type === 'technical' && params.status === 'approved') {
        const approvalDetails = updateData.request_details || {};
        const itemName = approvalDetails.customization_item_name;
        
        // Find the customization to initialize workflow
        const { data: customizations } = await supabase
          .from('quotation_customizations')
          .select('id, quotation_id')
          .eq('quotation_id', approval.quotation_id)
          .eq('item_name', itemName)
          .eq('status', 'pending')
          .limit(1);

        if (customizations && customizations.length > 0) {
          const customizationId = customizations[0].id;
          
          // Get yacht model to find assigned PM
          const { data: quotation } = await supabase
            .from('quotations')
            .select(`
              yacht_model_id,
              yacht_models (
                pm_assignments:pm_yacht_model_assignments(
                  pm_user_id
                )
              )
            `)
            .eq('id', approval.quotation_id)
            .single();

          const pmUserId = quotation?.yacht_models?.pm_assignments?.[0]?.pm_user_id;

          // Initialize workflow with pending_pm_review status
          await supabase
            .from('quotation_customizations')
            .update({
              workflow_status: 'pending_pm_review',
              reviewed_by: user.id,
              reviewed_at: new Date().toISOString(),
              engineering_notes: params.review_notes || null
            })
            .eq('id', customizationId);

          // Create initial workflow step (pm_initial)
          await supabase
            .from('customization_workflow_steps')
            .insert({
              customization_id: customizationId,
              step_type: 'pm_initial',
              status: 'pending',
              assigned_to: pmUserId,
              notes: 'Aprovação técnica concedida. Aguardando análise inicial do PM.'
            });

          // Send notification to PM if assigned
          if (pmUserId) {
            await supabase.functions.invoke('send-workflow-notification', {
              body: {
                assignedTo: pmUserId,
                customizationId: customizationId,
                stepType: 'pm_initial'
              }
            });
          }
        }
      }

      // If technical approval was rejected, mark customization as rejected
      if (approval.approval_type === 'technical' && params.status === 'rejected') {
        const { data: currentApproval } = await supabase
          .from('approvals')
          .select('request_details')
          .eq('id', params.id)
          .single();

        const approvalDetails = (currentApproval?.request_details as Record<string, any>) || {};
        const itemName = approvalDetails.customization_item_name;
        
        const { data: customizations } = await supabase
          .from('quotation_customizations')
          .select('id')
          .eq('quotation_id', approval.quotation_id)
          .eq('item_name', itemName)
          .eq('status', 'pending')
          .limit(1);

        if (customizations && customizations.length > 0) {
          await supabase
            .from('quotation_customizations')
            .update({
              status: 'rejected',
              reviewed_by: user.id,
              reviewed_at: new Date().toISOString(),
              engineering_notes: params.review_notes || null
            })
            .eq('id', customizations[0].id);
        }
      }

      // Check if there are any remaining pending approvals for this quotation
      const { data: pendingApprovals, error: pendingError } = await supabase
        .from('approvals')
        .select('id, approval_type')
        .eq('quotation_id', approval.quotation_id)
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      // Determine new quotation status based on approval result and remaining pending approvals
      let newQuotationStatus = 'draft';
      
      if (params.status === 'rejected') {
        // If this approval was rejected, quotation goes back to draft for revision
        newQuotationStatus = 'draft';
      } else if (pendingApprovals && pendingApprovals.length > 0) {
        // Still has pending approvals - determine which type
        const hasPendingCommercial = pendingApprovals.some(a => a.approval_type === 'commercial');
        const hasPendingTechnical = pendingApprovals.some(a => a.approval_type === 'technical');

        if (hasPendingCommercial && hasPendingTechnical) {
          // Has both types pending - prioritize showing commercial
          newQuotationStatus = 'pending_commercial_approval';
        } else if (hasPendingCommercial) {
          newQuotationStatus = 'pending_commercial_approval';
        } else if (hasPendingTechnical) {
          newQuotationStatus = 'pending_technical_approval';
        }
      } else {
        // All approvals completed successfully
        newQuotationStatus = 'ready_to_send';
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
      queryClient.invalidateQueries({ queryKey: ['customization-workflow'] });
      queryClient.invalidateQueries({ queryKey: ['quotation-customizations-workflow'] });
      
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
