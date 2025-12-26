import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Representa um contrato gerado a partir de uma cotação aceita
 * 
 * @interface Contract
 * @property {string} id - UUID único do contrato
 * @property {string} quotation_id - UUID da cotação origem
 * @property {string} client_id - UUID do cliente
 * @property {string} yacht_model_id - UUID do modelo de iate
 * @property {string} contract_number - Número formatado (ex: CTR-2025-001)
 * @property {number} base_price - Preço base congelado no momento da conversão
 * @property {number} base_delivery_days - Prazo base congelado
 * @property {any} base_snapshot - Snapshot JSON da configuração original
 * @property {number} current_total_price - Preço atual incluindo ATOs aprovadas
 * @property {number} current_total_delivery_days - Prazo atual incluindo ATOs
 * @property {"active"|"completed"|"cancelled"} status - Status do contrato
 * @property {string} signed_at - Timestamp de assinatura ISO
 * @property {string|null} signed_by_name - Nome do signatário
 * @property {string|null} signed_by_email - E-mail do signatário
 * @property {string} created_at - Timestamp de criação
 * @property {string} updated_at - Timestamp de última atualização
 * @property {string|null} created_by - UUID do usuário que criou
 * @property {any} [quotation] - Dados da cotação (quando incluído)
 * @property {any} [client] - Dados do cliente (quando incluído)
 * @property {any} [yacht_model] - Dados do modelo (quando incluído)
 */
export interface Contract {
  id: string;
  quotation_id: string;
  client_id: string;
  yacht_model_id: string;
  hull_number_id: string | null;
  contract_number: string;
  base_price: number;
  base_delivery_days: number;
  base_snapshot: any;
  current_total_price: number;
  current_total_delivery_days: number;
  status: "active" | "completed" | "cancelled";
  signed_at: string;
  signed_by_name: string | null;
  signed_by_email: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  
  // Relacionamentos (quando incluídos no select)
  quotation?: any;
  client?: any;
  yacht_model?: any;
  hull_number?: {
    id: string;
    hull_number: string;
    brand: string;
    hull_entry_date: string | null;
    estimated_delivery_date: string | null;
    status: string;
  };
}

/**
 * Hook para buscar todos os contratos do sistema
 * 
 * @description
 * Retorna lista de contratos com dados relacionados (cotação, cliente, modelo).
 * Ordenados por data de criação (mais recentes primeiro).
 * 
 * **Dados incluídos:**
 * - `quotation`: quotation_number, status
 * - `client`: name, email, phone
 * - `yacht_model`: name, code
 * 
 * @returns {UseQueryResult<Contract[]>} Query result do React Query
 * @returns {Contract[]} return.data - Array de contratos
 * @returns {boolean} return.isLoading - true durante carregamento
 * 
 * @example
 * ```typescript
 * function ContractsList() {
 *   const { data: contracts, isLoading } = useContracts();
 *   
 *   if (isLoading) return <Skeleton />;
 *   
 *   return (
 *     <div className="space-y-4">
 *       {contracts?.map(contract => (
 *         <ContractCard key={contract.id} contract={contract} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @see {@link useContract} - Para buscar contrato específico
 * @see {@link useLiveContract} - Para dados em tempo real
 */
export function useContracts() {
  return useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          quotation:quotations(quotation_number, status),
          client:clients(name, email, phone),
          yacht_model:yacht_models(name, code),
          hull_number:hull_numbers!contracts_hull_number_id_fkey(id, hull_number, brand, hull_entry_date, estimated_delivery_date, status)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Contract[];
    },
  });
}

/**
 * Hook para buscar um contrato específico por ID
 * 
 * @description
 * Retorna contrato completo com todos os relacionamentos.
 * Query desabilitada se contractId for undefined.
 * 
 * @param {string|undefined} contractId - UUID do contrato
 * @returns {UseQueryResult<Contract>} Query result com contrato completo
 * 
 * @example
 * ```typescript
 * function ContractDetail({ id }) {
 *   const { data: contract, isLoading } = useContract(id);
 *   
 *   if (isLoading) return <LoadingSkeleton />;
 *   if (!contract) return <NotFound />;
 *   
 *   return <ContractOverview contract={contract} />;
 * }
 * ```
 * 
 * @see {@link useContracts} - Lista de contratos
 * @see {@link useLiveContract} - Para dados calculados em tempo real
 */
export function useContract(contractId: string | undefined) {
  return useQuery({
    queryKey: ["contract", contractId],
    queryFn: async () => {
      if (!contractId) throw new Error("Contract ID is required");

      const { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          quotation:quotations(*),
          client:clients(*),
          yacht_model:yacht_models(*),
          hull_number:hull_numbers!contracts_hull_number_id_fkey(id, hull_number, brand, hull_entry_date, estimated_delivery_date, status)
        `)
        .eq("id", contractId)
        .single();

      if (error) throw error;
      return data as Contract;
    },
    enabled: !!contractId,
  });
}

/**
 * Hook para buscar dados em tempo real de um contrato
 * 
 * @description
 * Usa a view otimizada `live_contracts` que calcula automaticamente:
 * - Totais de ATOs (price_impact, delivery_impact)
 * - Contadores de ATOs (aprovadas, pendentes, total)
 * - Preço e prazo atualizados em tempo real
 * 
 * **Recomendado para dashboards e visualizações que precisam de totais.**
 * 
 * @param {string|undefined} contractId - UUID do contrato
 * @returns {UseQueryResult} Query result com dados calculados
 * 
 * @example
 * ```typescript
 * function ContractSummary({ contractId }) {
 *   const { data: liveData } = useLiveContract(contractId);
 *   
 *   return (
 *     <div>
 *       <p>Preço Total: {formatCurrency(liveData?.current_total_price)}</p>
 *       <p>Prazo: {liveData?.current_total_delivery_days} dias</p>
 *       <p>ATOs Aprovadas: {liveData?.approved_atos_count}</p>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @see {@link useContract} - Para dados completos do contrato
 */
export function useLiveContract(contractId: string | undefined) {
  return useQuery({
    queryKey: ["live-contract", contractId],
    queryFn: async () => {
      if (!contractId) throw new Error("Contract ID is required");

      const { data, error } = await supabase
        .from("live_contracts")
        .select("*")
        .eq("contract_id", contractId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!contractId,
  });
}

/**
 * Hook para atualizar o status de um contrato
 * 
 * @description
 * Mutation para alterar status do contrato (active → completed/cancelled).
 * Invalida cache e exibe feedback ao usuário.
 * 
 * **Queries invalidadas:**
 * - `contracts` - Lista geral
 * - `contract` - Contrato específico
 * 
 * @returns {UseMutationResult} Mutation do React Query
 * 
 * @example
 * ```typescript
 * function CompleteContractButton({ contractId }) {
 *   const { mutate: updateStatus, isPending } = useUpdateContractStatus();
 *   
 *   const handleComplete = () => {
 *     updateStatus({ 
 *       contractId, 
 *       status: 'completed' 
 *     });
 *   };
 *   
 *   return (
 *     <Button onClick={handleComplete} disabled={isPending}>
 *       Marcar como Concluído
 *     </Button>
 *   );
 * }
 * ```
 * 
 * @see {@link useContract} - Para buscar contrato
 */
export function useUpdateContractStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contractId,
      status,
    }: {
      contractId: string;
      status: "active" | "completed" | "cancelled";
    }) => {
      const { data, error } = await supabase
        .from("contracts")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", contractId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["contract", variables.contractId] });
      toast.success("Status do contrato atualizado com sucesso");
    },
    onError: (error: Error) => {
      console.error("Error updating contract status:", error);
      toast.error("Erro ao atualizar status do contrato");
    },
  });
}

/**
 * Hook para criar contrato a partir de uma cotação aceita
 * 
 * @description
 * Invoca Edge Function `create-contract-from-quotation` que:
 * - Gera contract_number automático
 * - Cria snapshot da configuração (base_snapshot)
 * - Converte customizações aprovadas em itens do contrato
 * - Atualiza status da cotação para "converted"
 * 
 * **Queries invalidadas:**
 * - `contracts` - Lista de contratos
 * - `quotations` - Lista de cotações (status mudou)
 * 
 * @param {string} quotationId - UUID da cotação a converter
 * @returns {UseMutationResult} Mutation do React Query
 * 
 * @throws {Error} Se cotação não estiver em status "accepted"
 * @throws {Error} Se erro na Edge Function
 * 
 * @example
 * ```typescript
 * function ConvertToContractButton({ quotationId }) {
 *   const { mutate: createContract, isPending } = useCreateContractFromQuotation();
 *   const navigate = useNavigate();
 *   
 *   const handleConvert = () => {
 *     createContract(quotationId, {
 *       onSuccess: (data) => {
 *         toast.success('Contrato criado!');
 *         navigate(`/contratos/${data.contract.id}`);
 *       }
 *     });
 *   };
 *   
 *   return (
 *     <Button onClick={handleConvert} disabled={isPending}>
 *       {isPending ? 'Convertendo...' : 'Gerar Contrato'}
 *     </Button>
 *   );
 * }
 * ```
 * 
 * @see {@link useContracts} - Lista de contratos
 */
export function useCreateContractFromQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quotationId: string) => {
      const { data, error } = await supabase.functions.invoke(
        "create-contract-from-quotation",
        {
          body: { quotation_id: quotationId },
        }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast.success("Contrato criado com sucesso!");
    },
    onError: (error: Error) => {
      console.error("Error creating contract:", error);
      toast.error("Erro ao criar contrato: " + error.message);
    },
  });
}

/**
 * Hook para deletar um contrato
 * 
 * @description
 * Remove permanentemente um contrato e reverte estado relacionado:
 * 
 * **Operações executadas:**
 * 1. Reverte customizações (included_in_contract = false)
 * 2. Reverte status da cotação para "accepted"
 * 3. Deleta o contrato
 * 
 * **Queries invalidadas:**
 * - `contracts` - Lista de contratos
 * - `contract` - Contrato específico
 * - `quotations` - Lista de cotações
 * - `quotation` - Cotação específica
 * 
 * @param {string} contractId - UUID do contrato a deletar
 * @returns {UseMutationResult} Mutation do React Query
 * 
 * @throws {Error} Se erro ao buscar contrato
 * @throws {Error} Se erro ao deletar
 * 
 * @example
 * ```typescript
 * function DeleteContractButton({ contractId }) {
 *   const { mutate: deleteContract, isPending } = useDeleteContract();
 *   const navigate = useNavigate();
 *   
 *   const handleDelete = () => {
 *     deleteContract(contractId, {
 *       onSuccess: () => {
 *         toast.success('Contrato deletado e cotação revertida');
 *         navigate('/contratos');
 *       }
 *     });
 *   };
 *   
 *   return (
 *     <AlertDialog>
 *       <AlertDialogTrigger asChild>
 *         <Button variant="destructive" disabled={isPending}>
 *           Deletar Contrato
 *         </Button>
 *       </AlertDialogTrigger>
 *       <AlertDialogContent>
 *         <AlertDialogHeader>
 *           <AlertDialogTitle>Confirmar exclusão?</AlertDialogTitle>
 *           <AlertDialogDescription>
 *             O contrato será deletado e a cotação voltará para status "aceita".
 *           </AlertDialogDescription>
 *         </AlertDialogHeader>
 *         <AlertDialogFooter>
 *           <AlertDialogCancel>Cancelar</AlertDialogCancel>
 *           <AlertDialogAction onClick={handleDelete}>
 *             Confirmar Exclusão
 *           </AlertDialogAction>
 *         </AlertDialogFooter>
 *       </AlertDialogContent>
 *     </AlertDialog>
 *   );
 * }
 * ```
 * 
 * @see {@link useContracts} - Lista de contratos
 * @see {@link useCreateContractFromQuotation} - Para criar contrato
 */
export function useDeleteContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contractId: string) => {
      // 1. Buscar dados do contrato antes de deletar
      const { data: contract, error: fetchError } = await supabase
        .from("contracts")
        .select("quotation_id")
        .eq("id", contractId)
        .single();

      if (fetchError) throw fetchError;

      // 2. Reverter customizações (included_in_contract = false)
      const { error: customizationsError } = await supabase
        .from("quotation_customizations")
        .update({ included_in_contract: false })
        .eq("quotation_id", contract.quotation_id);

      if (customizationsError) {
        console.warn("Error reverting customizations:", customizationsError);
      }

      // 3. Reverter status da cotação
      const { error: quotationError } = await supabase
        .from("quotations")
        .update({ status: "accepted" })
        .eq("id", contract.quotation_id);

      if (quotationError) {
        console.warn("Error reverting quotation status:", quotationError);
      }

      // 4. Deletar contrato
      const { error: deleteError } = await supabase
        .from("contracts")
        .delete()
        .eq("id", contractId);

      if (deleteError) throw deleteError;

      return { contractId, quotationId: contract.quotation_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["contract", data.contractId] });
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotation", data.quotationId] });
      toast.success("Contrato deletado e cotação revertida com sucesso");
    },
    onError: (error: Error) => {
      console.error("Error deleting contract:", error);
      toast.error("Erro ao deletar contrato: " + error.message);
    },
  });
}
