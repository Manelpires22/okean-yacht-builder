import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Additional To Order - Aditivo contratual
 * 
 * @interface ATO
 * @property {string} id - UUID único da ATO
 * @property {string} contract_id - UUID do contrato pai
 * @property {string} ato_number - Número sequencial (ex: ATO 1, ATO 2)
 * @property {number} sequence_number - Sequência numérica para ordenação
 * @property {string} title - Título descritivo da ATO
 * @property {string|null} description - Descrição detalhada
 * @property {number} price_impact - Impacto no preço (positivo ou negativo)
 * @property {number} delivery_days_impact - Impacto no prazo em dias
 * @property {number} discount_percentage - Percentual de desconto aplicado
 * @property {"draft"|"pending_approval"|"approved"|"rejected"|"cancelled"} status - Status da ATO
 * @property {string|null} workflow_status - Status do workflow técnico
 * @property {string} requested_by - UUID do usuário solicitante
 * @property {string} requested_at - Timestamp de solicitação
 * @property {boolean} requires_approval - Se requer aprovação comercial
 * @property {"pending"|"approved"|"rejected"|null} commercial_approval_status - Aprovação comercial
 * @property {"pending"|"approved"|"rejected"|null} technical_approval_status - Aprovação técnica
 * @property {string|null} approved_by - UUID do aprovador
 * @property {string|null} approved_at - Timestamp de aprovação
 * @property {string|null} notes - Notas gerais
 * @property {string|null} rejection_reason - Motivo da rejeição
 * @property {string} created_at - Timestamp de criação
 * @property {string} updated_at - Timestamp de atualização
 * @property {any} [contract] - Dados do contrato (quando incluído)
 * @property {any} [requested_by_user] - Dados do solicitante (quando incluído)
 * @property {Array} [configurations] - Configurações de itens (quando incluído)
 */
export interface ATO {
  id: string;
  contract_id: string;
  ato_number: string;
  sequence_number: number;
  title: string;
  description: string | null;
  price_impact: number;
  delivery_days_impact: number;
  discount_percentage: number;
  status: "draft" | "pending_approval" | "approved" | "rejected" | "cancelled";
  workflow_status: string | null;
  requested_by: string;
  requested_at: string;
  requires_approval: boolean;
  commercial_approval_status: "pending" | "approved" | "rejected" | null;
  technical_approval_status: "pending" | "approved" | "rejected" | null;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  
  // Relacionamentos
  contract?: any;
  requested_by_user?: any;
  configurations?: Array<{ id: string }>;
}

/**
 * Dados de entrada para criação de ATO
 * 
 * @interface CreateATOInput
 * @property {string} contract_id - UUID do contrato
 * @property {string} title - Título da ATO
 * @property {string} [description] - Descrição opcional
 * @property {number} price_impact - Impacto no preço (pode ser negativo)
 * @property {number} delivery_days_impact - Impacto no prazo
 * @property {string} [workflow_status] - Status inicial do workflow técnico
 * @property {Array} [configurations] - Itens configurados da ATO
 * @property {string} [notes] - Notas adicionais
 */
export interface CreateATOInput {
  contract_id: string;
  title: string;
  description?: string;
  price_impact: number;
  delivery_days_impact: number;
  workflow_status?: string | null;
  discount_percentage?: number;
  discount_amount?: number;
  original_price_impact?: number;
  configurations?: Array<{
    item_type: "memorial_item" | "option" | "upgrade" | "ato_item" | "free_customization" | "definable_item";
    item_id: string | null;
    configuration_details: any;
    sub_items?: any[];
    notes?: string;
    discount_percentage?: number;
    original_price?: number;
  }>;
  notes?: string;
}

/**
 * Hook para buscar ATOs de um contrato específico
 * 
 * @description
 * Retorna lista de ATOs ordenadas por sequence_number (ordem de criação).
 * Inclui dados do contrato, cliente e contagem de configurações.
 * Query desabilitada se contractId for undefined.
 * 
 * @param {string|undefined} contractId - UUID do contrato
 * @returns {UseQueryResult<ATO[]>} Query result com lista de ATOs
 * 
 * @example
 * ```typescript
 * function ContractATOs({ contractId }) {
 *   const { data: atos, isLoading } = useATOs(contractId);
 *   
 *   if (isLoading) return <LoadingSkeleton />;
 *   if (!atos?.length) return <EmptyState message="Nenhuma ATO cadastrada" />;
 *   
 *   return (
 *     <div className="space-y-4">
 *       {atos.map(ato => (
 *         <ATOCard key={ato.id} ato={ato} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @see {@link useATO} - Para buscar ATO específica
 * @see {@link useCreateATO} - Para criar nova ATO
 */
export function useATOs(contractId: string | undefined) {
  return useQuery({
    queryKey: ["atos", contractId],
    queryFn: async () => {
      if (!contractId) throw new Error("Contract ID is required");

      const { data, error } = await supabase
        .from("additional_to_orders")
        .select(`
          *,
          contract:contracts(
            contract_number, 
            status,
            client:clients(id, name, email, phone)
          ),
          configurations:ato_configurations(id)
        `)
        .eq("contract_id", contractId)
        .order("sequence_number", { ascending: true });

      if (error) throw error;
      return data as ATO[];
    },
    enabled: !!contractId,
  });
}

/**
 * Hook para buscar uma ATO específica por ID
 * 
 * @description
 * Retorna ATO completa com contrato, cliente e todas as configurações de itens.
 * Query desabilitada se atoId for undefined.
 * 
 * @param {string|undefined} atoId - UUID da ATO
 * @returns {UseQueryResult} Query result com ATO completa
 * 
 * @example
 * ```typescript
 * function ATODetail({ atoId }) {
 *   const { data: ato, isLoading } = useATO(atoId);
 *   
 *   if (isLoading) return <LoadingSkeleton />;
 *   if (!ato) return <NotFound />;
 *   
 *   return (
 *     <div>
 *       <ATOHeader ato={ato} />
 *       <ATOConfigurationsList items={ato.configurations} />
 *     </div>
 *   );
 * }
 * ```
 * 
 * @see {@link useATOs} - Para listar ATOs de um contrato
 */
export function useATO(atoId: string | undefined) {
  return useQuery({
    queryKey: ["ato", atoId],
    queryFn: async () => {
      if (!atoId) throw new Error("ATO ID is required");

    const { data, error } = await supabase
      .from("additional_to_orders")
      .select(`
        *,
        contract:contracts(
          *,
          client:clients(id, name, email, phone)
        ),
        configurations:ato_configurations(*)
      `)
      .eq("id", atoId)
      .single();

      if (error) throw error;
      return data;
    },
    enabled: !!atoId,
  });
}

/**
 * Hook para criar uma nova ATO
 * 
 * @description
 * Cria ATO com lógica automática de:
 * - Geração de sequence_number e ato_number
 * - Determinação de necessidade de aprovação (price > 0 ou delivery > 7 dias)
 * - Status inicial (draft ou pending_approval)
 * - Criação de configurações de itens associados
 * 
 * **Queries invalidadas:**
 * - `atos` - Lista de ATOs do contrato
 * - `live-contract` - Dados calculados
 * - `contracts` - Lista geral
 * 
 * @param {CreateATOInput} input - Dados da ATO
 * @returns {UseMutationResult<ATO>} Mutation do React Query
 * 
 * @example
 * ```typescript
 * function CreateATODialog({ contractId }) {
 *   const { mutate: createATO, isPending } = useCreateATO();
 *   
 *   const handleSubmit = (formData) => {
 *     createATO({
 *       contract_id: contractId,
 *       title: formData.title,
 *       price_impact: formData.price,
 *       delivery_days_impact: formData.delivery,
 *       configurations: formData.items
 *     }, {
 *       onSuccess: (ato) => {
 *         toast.success(`ATO ${ato.ato_number} criada!`);
 *         onClose();
 *       }
 *     });
 *   };
 *   
 *   return <ATOForm onSubmit={handleSubmit} isPending={isPending} />;
 * }
 * ```
 * 
 * @see {@link useATOs} - Para listar ATOs
 */
export function useCreateATO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateATOInput) => {
      // 0. Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // 1. Buscar próximo sequence_number
      const { data: existingATOs, error: countError } = await supabase
        .from("additional_to_orders")
        .select("sequence_number")
        .eq("contract_id", input.contract_id)
        .order("sequence_number", { ascending: false })
        .limit(1);

      if (countError) throw countError;

      const nextSequence = existingATOs && existingATOs.length > 0 
        ? existingATOs[0].sequence_number + 1 
        : 1;

      const atoNumber = `ATO ${nextSequence}`;

      // 2. Determinar se precisa aprovação (similar a cotações)
      const requiresApproval = Math.abs(input.price_impact) > 0 || input.delivery_days_impact > 7;

      // 3. Criar ATO com workflow_status se fornecido
      const { data: ato, error: atoError } = await supabase
        .from("additional_to_orders")
        .insert({
          contract_id: input.contract_id,
          ato_number: atoNumber,
          sequence_number: nextSequence,
          title: input.title,
          description: input.description,
          price_impact: input.price_impact,
          delivery_days_impact: input.delivery_days_impact,
          notes: input.notes,
          requested_by: user.id,
          status: input.workflow_status ? "pending_approval" : (requiresApproval ? "pending_approval" : "approved"),
          requires_approval: requiresApproval || !!input.workflow_status,
          commercial_approval_status: requiresApproval && !input.workflow_status ? "pending" : null,
          workflow_status: input.workflow_status || null,
          discount_percentage: input.discount_percentage || 0,
          discount_amount: input.discount_amount || 0,
          original_price_impact: input.original_price_impact || input.price_impact,
        })
        .select()
        .single();

      if (atoError) throw atoError;

      // 4. Criar configurações de itens (com desconto individual)
      if (input.configurations && input.configurations.length > 0) {
        const { error: configError } = await supabase
          .from("ato_configurations")
          .insert(
            input.configurations.map((config) => ({
              ato_id: ato.id,
              item_type: config.item_type,
              item_id: config.item_id,
              configuration_details: config.configuration_details,
              sub_items: config.sub_items || [],
              notes: config.notes,
              created_by: user.id,
              discount_percentage: config.discount_percentage || 0,
              original_price: config.original_price || 0,
            }))
          );

        if (configError) throw configError;
      }

      return ato;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["atos", variables.contract_id] });
      queryClient.invalidateQueries({ queryKey: ["live-contract", variables.contract_id] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast.success("ATO criada com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error creating ATO:", error);
      toast.error("Erro ao criar ATO: " + error.message);
    },
  });
}

/**
 * Hook para aprovar ou rejeitar uma ATO
 * 
 * @description
 * Processa aprovação comercial de ATO. **Se aprovada:**
 * - Recalcula totais do contrato (price e delivery)
 * - Atualiza current_total_price e current_total_delivery_days
 * 
 * **Queries invalidadas:**
 * - `atos` - Lista de ATOs
 * - `ato` - ATO específica
 * - `live-contract` - Totais recalculados
 * - `contracts` - Lista geral
 * - `approvals` - Pendências de aprovação
 * - `ato-workflow-tasks` - Tarefas de workflow
 * 
 * @param {Object} params - Parâmetros da aprovação
 * @param {string} params.atoId - UUID da ATO
 * @param {boolean} params.approved - true para aprovar, false para rejeitar
 * @param {string} [params.notes] - Notas/motivo da decisão
 * @returns {UseMutationResult} Mutation do React Query
 * 
 * @example
 * ```typescript
 * function ATOApprovalDialog({ ato }) {
 *   const { mutate: approveATO, isPending } = useApproveATO();
 *   
 *   const handleApprove = () => {
 *     approveATO({
 *       atoId: ato.id,
 *       approved: true
 *     });
 *   };
 *   
 *   const handleReject = (reason: string) => {
 *     approveATO({
 *       atoId: ato.id,
 *       approved: false,
 *       notes: reason
 *     });
 *   };
 *   
 *   return (
 *     <div className="flex gap-4">
 *       <Button onClick={handleApprove} disabled={isPending}>
 *         Aprovar
 *       </Button>
 *       <Button 
 *         variant="destructive" 
 *         onClick={() => handleReject('Fora do orçamento')}
 *         disabled={isPending}
 *       >
 *         Rejeitar
 *       </Button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @see {@link useATOs} - Lista de ATOs
 */
export function useApproveATO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      atoId,
      approved,
      notes,
    }: {
      atoId: string;
      approved: boolean;
      notes?: string;
    }) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;

      // 1. Atualizar status da ATO
      const { data, error } = await supabase
        .from("additional_to_orders")
        .update({
          status: approved ? "approved" : "rejected",
          commercial_approval_status: approved ? "approved" : "rejected",
          approved_by: userId,
          approved_at: new Date().toISOString(),
          rejection_reason: approved ? null : notes,
        })
        .eq("id", atoId)
        .select()
        .single();

      if (error) throw error;

      // Se aprovado, atualizar totais do contrato
      if (approved && data) {
        // Recalcular totais do contrato
        const { data: contract } = await supabase
          .from("contracts")
          .select("id, base_price, base_delivery_days")
          .eq("id", data.contract_id)
          .single();

        if (contract) {
          const { data: approvedATOs } = await supabase
            .from("additional_to_orders")
            .select("price_impact, delivery_days_impact")
            .eq("contract_id", data.contract_id)
            .eq("status", "approved");

          const totalATOsPrice = approvedATOs?.reduce((sum, ato) => sum + (ato.price_impact || 0), 0) || 0;
          const totalATOsDelivery = approvedATOs?.reduce((max, ato) => Math.max(max, ato.delivery_days_impact || 0), 0) || 0;

          await supabase
            .from("contracts")
            .update({
              current_total_price: contract.base_price + totalATOsPrice,
              current_total_delivery_days: contract.base_delivery_days + totalATOsDelivery,
              updated_at: new Date().toISOString(),
            })
            .eq("id", data.contract_id);
        }
      }

      return data;
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["atos", data.contract_id] });
        queryClient.invalidateQueries({ queryKey: ["ato", data.id] });
        queryClient.invalidateQueries({ queryKey: ["live-contract", data.contract_id] });
        queryClient.invalidateQueries({ queryKey: ["contracts"] });
        queryClient.invalidateQueries({ queryKey: ["approvals"] });
        queryClient.invalidateQueries({ queryKey: ["ato-workflow-tasks"] });
      }
      toast.success("ATO processada com sucesso");
    },
    onError: (error: Error) => {
      console.error("Error approving ATO:", error);
      toast.error("Erro ao processar ATO: " + error.message);
    },
  });
}

/**
 * Hook para atualizar dados de uma ATO existente
 * 
 * @description
 * Mutation genérica para atualizar qualquer campo de uma ATO.
 * Atualiza automaticamente `updated_at`.
 * 
 * **Queries invalidadas:**
 * - `atos` - Lista de ATOs
 * - `ato` - ATO específica
 * 
 * @param {Object} params - Parâmetros
 * @param {string} params.atoId - UUID da ATO
 * @param {Partial<ATO>} params.updates - Campos a atualizar
 * @returns {UseMutationResult} Mutation do React Query
 * 
 * @example
 * ```typescript
 * function EditATOForm({ ato }) {
 *   const { mutate: updateATO, isPending } = useUpdateATO();
 *   
 *   const handleSave = (formData) => {
 *     updateATO({
 *       atoId: ato.id,
 *       updates: {
 *         title: formData.title,
 *         price_impact: formData.price,
 *         notes: formData.notes
 *       }
 *     });
 *   };
 *   
 *   return <ATOForm initialData={ato} onSubmit={handleSave} />;
 * }
 * ```
 * 
 * @see {@link useCreateATO} - Para criar nova ATO
 */
export function useUpdateATO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      atoId,
      updates,
    }: {
      atoId: string;
      updates: Partial<ATO>;
    }) => {
      const { data, error } = await supabase
        .from("additional_to_orders")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", atoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["atos", data.contract_id] });
      queryClient.invalidateQueries({ queryKey: ["ato", data.id] });
      toast.success("ATO atualizada com sucesso");
    },
    onError: (error: Error) => {
      console.error("Error updating ATO:", error);
      toast.error("Erro ao atualizar ATO");
    },
  });
}

/**
 * Hook para cancelar uma ATO
 * 
 * @description
 * Altera status da ATO para "cancelled". Não deleta do banco.
 * ATOs canceladas não impactam os totais do contrato.
 * 
 * @param {string} atoId - UUID da ATO
 * @returns {UseMutationResult} Mutation do React Query
 * 
 * @example
 * ```typescript
 * function CancelATOButton({ atoId }) {
 *   const { mutate: cancelATO, isPending } = useCancelATO();
 *   
 *   return (
 *     <Button 
 *       variant="outline"
 *       onClick={() => cancelATO(atoId)}
 *       disabled={isPending}
 *     >
 *       Cancelar ATO
 *     </Button>
 *   );
 * }
 * ```
 * 
 * @see {@link useDeleteATO} - Para deletar permanentemente
 */
export function useCancelATO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (atoId: string) => {
      const { data, error } = await supabase
        .from("additional_to_orders")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", atoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["atos", data.contract_id] });
      queryClient.invalidateQueries({ queryKey: ["ato", data.id] });
      toast.success("ATO cancelada");
    },
    onError: (error: Error) => {
      console.error("Error cancelling ATO:", error);
      toast.error("Erro ao cancelar ATO");
    },
  });
}

/**
 * Hook para reabrir ATO para validação comercial
 * 
 * @description
 * Após aprovação técnica (workflow completo), reabre ATO para
 * que comercial valide preços finais antes de enviar ao cliente.
 * 
 * **Mudanças aplicadas:**
 * - workflow_status → 'completed'
 * - status → 'draft'
 * - Limpa approved_at e approved_by
 * 
 * @param {string} atoId - UUID da ATO
 * @returns {UseMutationResult} Mutation do React Query
 * 
 * @example
 * ```typescript
 * function ReopenATOButton({ ato }) {
 *   const { mutate: reopenATO, isPending } = useReopenATOForCommercialReview();
 *   
 *   const canReopen = ato.workflow_status === 'pending_commercial_review';
 *   
 *   return (
 *     <Button 
 *       onClick={() => reopenATO(ato.id)}
 *       disabled={!canReopen || isPending}
 *     >
 *       Reabrir para Validação Comercial
 *     </Button>
 *   );
 * }
 * ```
 * 
 * @see {@link useApproveATO} - Para aprovar comercialmente
 */
export function useReopenATOForCommercialReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (atoId: string) => {
      const { data, error } = await supabase
        .from("additional_to_orders")
        .update({
          workflow_status: 'completed',
          status: 'draft',
          approved_at: null,
          approved_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", atoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["atos", data.contract_id] });
      queryClient.invalidateQueries({ queryKey: ["ato", data.id] });
      toast.success("ATO reaberta para validação comercial");
    },
    onError: (error: Error) => {
      console.error("Error reopening ATO:", error);
      toast.error("Erro ao reabrir ATO: " + error.message);
    },
  });
}

/**
 * Hook para reabrir ATO enviada ao cliente para edição
 * 
 * @description
 * Permite reabrir uma ATO que já foi enviada ao cliente (status = 'pending_approval')
 * para poder editar ou corrigir antes de reenviar.
 * 
 * **Mudanças aplicadas:**
 * - status → 'draft'
 * - workflow_status mantém 'completed' (não precisa passar pelo PM novamente)
 * - Limpa approved_at e approved_by
 * 
 * @param {string} atoId - UUID da ATO
 * @returns {UseMutationResult} Mutation do React Query
 * 
 * @example
 * ```typescript
 * function ReverATOButton({ ato }) {
 *   const { mutate: reopenForEditing, isPending } = useReopenATOForEditing();
 *   
 *   if (ato.status !== 'pending_approval') return null;
 *   
 *   return (
 *     <Button 
 *       variant="outline"
 *       onClick={() => reopenForEditing(ato.id)}
 *       disabled={isPending}
 *     >
 *       Rever ATO
 *     </Button>
 *   );
 * }
 * ```
 */
export function useReopenATOForEditing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (atoId: string) => {
      const { data, error } = await supabase
        .from("additional_to_orders")
        .update({
          status: 'draft',
          // Mantém workflow_status 'completed' - não precisa voltar para PM
          approved_at: null,
          approved_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", atoId)
        .eq("status", "pending_approval") // Só pode reabrir se estava enviada ao cliente
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["atos", data.contract_id] });
      queryClient.invalidateQueries({ queryKey: ["ato", data.id] });
      toast.success("ATO reaberta para edição");
    },
    onError: (error: Error) => {
      console.error("Error reopening ATO for editing:", error);
      toast.error("Erro ao reabrir ATO: " + error.message);
    },
  });
}

/**
 * Hook para deletar permanentemente uma ATO
 * 
 * @description
 * Remove ATO do banco de dados. **CRÍTICO: Apenas permite deleção de:**
 * - ATOs em status 'draft' ou 'cancelled'
 * 
 * **Bloqueia deleção de:**
 * - ATOs aprovadas ('approved')
 * - ATOs pendentes de aprovação ('pending_approval')
 * - ATOs enviadas ao cliente ('sent')
 * 
 * **Para reverter ATOs aprovadas:** Criar nova ATO com valores negativos (crédito/estorno).
 * 
 * **Remove também:**
 * - Configurações associadas (ato_configurations)
 * - Workflow steps (ato_workflow_steps)
 * 
 * @param {string} atoId - UUID da ATO
 * @returns {UseMutationResult} Mutation do React Query
 * 
 * @throws {Error} Se ATO estiver aprovada, pendente ou enviada
 * 
 * @example
 * ```typescript
 * function DeleteATOButton({ ato }) {
 *   const { mutate: deleteATO, isPending } = useDeleteATO();
 *   
 *   const canDelete = ['draft', 'cancelled'].includes(ato.status);
 *   
 *   const handleDelete = () => {
 *     deleteATO(ato.id, {
 *       onError: (error) => {
 *         if (error.message.includes('aprovadas')) {
 *           toast.error('Crie uma ATO de crédito para reverter itens');
 *         }
 *       }
 *     });
 *   };
 *   
 *   return (
 *     <AlertDialog>
 *       <AlertDialogTrigger asChild>
 *         <Button 
 *           variant="destructive" 
 *           disabled={!canDelete || isPending}
 *         >
 *           Deletar Permanentemente
 *         </Button>
 *       </AlertDialogTrigger>
 *       <AlertDialogContent>
 *         <AlertDialogHeader>
 *           <AlertDialogTitle>Confirmar exclusão?</AlertDialogTitle>
 *           <AlertDialogDescription>
 *             Esta ação é irreversível. A ATO será permanentemente deletada.
 *           </AlertDialogDescription>
 *         </AlertDialogHeader>
 *         <AlertDialogFooter>
 *           <AlertDialogCancel>Cancelar</AlertDialogCancel>
 *           <AlertDialogAction onClick={handleDelete}>
 *             Deletar
 *           </AlertDialogAction>
 *         </AlertDialogFooter>
 *       </AlertDialogContent>
 *     </AlertDialog>
 *   );
 * }
 * ```
 * 
 * @see {@link useCancelATO} - Para cancelar sem deletar
 */
export function useDeleteATO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (atoId: string) => {
      // Buscar contract_id e status antes de deletar
      const { data: ato, error: fetchError } = await supabase
        .from("additional_to_orders")
        .select("contract_id, status")
        .eq("id", atoId)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      if (!ato) {
        throw new Error("ATO não encontrada ou você não tem permissão para visualizá-la.");
      }

      // ⚠️ CRÍTICO: Impedir exclusão de ATOs aprovadas ou enviadas ao cliente
      if (['approved', 'pending_approval', 'sent'].includes(ato?.status)) {
        throw new Error("ATOs aprovadas ou enviadas não podem ser excluídas. Crie uma nova ATO com crédito/estorno para reverter itens.");
      }

      const contractId = ato?.contract_id;

      // Deletar configurações primeiro (cascade deveria fazer, mas garantir)
      await supabase
        .from("ato_configurations")
        .delete()
        .eq("ato_id", atoId);

      // Deletar workflow steps
      await supabase
        .from("ato_workflow_steps")
        .delete()
        .eq("ato_id", atoId);

      // Deletar ATO
      const { error } = await supabase
        .from("additional_to_orders")
        .delete()
        .eq("id", atoId);

      if (error) throw error;

      // Recalcular totais do contrato após exclusão
      if (contractId) {
        const { data: contract } = await supabase
          .from("contracts")
          .select("id, base_price, base_delivery_days")
          .eq("id", contractId)
          .single();

        if (contract) {
          // Buscar ATOs aprovadas restantes
          const { data: approvedATOs } = await supabase
            .from("additional_to_orders")
            .select("price_impact, delivery_days_impact")
            .eq("contract_id", contractId)
            .eq("status", "approved");

          const totalATOsPrice = approvedATOs?.reduce((sum, ato) => sum + (ato.price_impact || 0), 0) || 0;
          const totalATOsDelivery = approvedATOs?.reduce((max, ato) => Math.max(max, ato.delivery_days_impact || 0), 0) || 0;

          // Atualizar contrato com valores recalculados
          await supabase
            .from("contracts")
            .update({
              current_total_price: contract.base_price + totalATOsPrice,
              current_total_delivery_days: contract.base_delivery_days + totalATOsDelivery,
              updated_at: new Date().toISOString(),
            })
            .eq("id", contractId);
        }
      }

      return { contractId };
    },
    onSuccess: (data) => {
      if (data.contractId) {
        queryClient.invalidateQueries({ queryKey: ["atos", data.contractId] });
      }
      queryClient.invalidateQueries({ queryKey: ["atos"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["live-contract"] });
      toast.success("ATO excluída permanentemente");
    },
    onError: (error: Error) => {
      console.error("Error deleting ATO:", error);
      toast.error("Erro ao excluir ATO: " + error.message);
    },
  });
}
