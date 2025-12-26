import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Representa uma cotação no sistema
 * 
 * @interface Quotation
 * @property {string} id - UUID único da cotação
 * @property {string} quotation_number - Número formatado (ex: QT-2025-001)
 * @property {string} yacht_model_id - UUID do modelo de iate
 * @property {string} [client_id] - UUID do cliente (opcional se criado inline)
 * @property {string} client_name - Nome do cliente
 * @property {string} [client_email] - E-mail do cliente
 * @property {string} [client_phone] - Telefone do cliente
 * @property {string} sales_representative_id - UUID do vendedor
 * @property {string} status - Status (draft, sent, accepted, converted, cancelled)
 * @property {number} base_price - Preço base do modelo em BRL
 * @property {number} base_delivery_days - Prazo base de entrega em dias
 * @property {number} total_options_price - Soma dos preços de opcionais
 * @property {number} total_customizations_price - Soma dos custos de customizações
 * @property {number} discount_amount - Valor total de desconto em BRL
 * @property {number} discount_percentage - Percentual de desconto aplicado
 * @property {number} final_price - Preço final total em BRL
 * @property {number} total_delivery_days - Prazo total de entrega em dias
 * @property {string} valid_until - Data de validade ISO (YYYY-MM-DD)
 * @property {string} created_at - Timestamp de criação ISO
 * @property {string} updated_at - Timestamp de última atualização ISO
 */
export interface Quotation {
  id: string;
  quotation_number: string;
  yacht_model_id: string;
  client_id?: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  sales_representative_id: string;
  status: string;
  base_price: number;
  base_delivery_days: number;
  total_options_price: number;
  total_customizations_price: number;
  discount_amount: number;
  discount_percentage: number;
  final_price: number;
  total_delivery_days: number;
  valid_until: string;
  created_at: string;
  updated_at: string;
}

/**
 * Hook para buscar todas as cotações do sistema
 * 
 * @description
 * Retorna lista completa de cotações com dados relacionados (modelo, cliente, 
 * vendedor e contratos associados). Usa React Query para cache automático,
 * revalidação e deduplicação de requests.
 * 
 * **Dados incluídos nos relacionamentos:**
 * - `yacht_models`: name, code
 * - `clients`: name, email, company
 * - `users`: full_name, email (vendedor)
 * - `contracts`: id, contract_number (se convertido)
 * 
 * @returns {UseQueryResult<Quotation[]>} Query result do React Query
 * @returns {Quotation[]} return.data - Array de cotações ordenadas por criação (desc)
 * @returns {boolean} return.isLoading - true durante carregamento inicial
 * @returns {boolean} return.isFetching - true durante qualquer fetch (incluindo refetch)
 * @returns {Error|null} return.error - Objeto de erro se query falhou
 * 
 * @example
 * ```typescript
 * function QuotationsList() {
 *   const { data: quotations, isLoading, error } = useQuotations();
 *   
 *   if (isLoading) return <Skeleton count={5} />;
 *   if (error) return <Alert variant="destructive">{error.message}</Alert>;
 *   if (!quotations?.length) return <EmptyState />;
 *   
 *   return (
 *     <div className="grid gap-4">
 *       {quotations.map(q => (
 *         <QuotationCard key={q.id} quotation={q} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 * 
 * @see {@link useQuotation} - Para buscar uma cotação específica
 * @see {@link useDeleteQuotation} - Para deletar cotação
 * @see {@link useDuplicateQuotation} - Para duplicar cotação
 */
export function useQuotations() {
  return useQuery({
    queryKey: ["quotations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotations")
        .select(`
          *,
          yacht_models (
            name,
            code
          ),
          clients (
            name,
            email,
            company
          ),
          users!quotations_sales_representative_id_fkey (
            full_name,
            email
          ),
          contracts!contracts_quotation_id_fkey (
            id,
            contract_number
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Hook para buscar uma cotação específica por ID
 * 
 * @description
 * Retorna cotação completa com todos os dados relacionados:
 * - Modelo de iate (specs completas, imagem)
 * - Cliente (contato completo)
 * - Vendedor
 * - Opcionais selecionados (com detalhes de cada opcional)
 * - Customizações solicitadas (memorial e opcionais)
 * 
 * **Query desabilitada se id for undefined.**
 * 
 * @param {string} id - UUID da cotação
 * @returns {UseQueryResult<Quotation>} Query result com cotação completa
 * @returns {Quotation} return.data - Cotação com todos relacionamentos
 * @returns {boolean} return.isLoading - true durante carregamento
 * @returns {Error|null} return.error - Erro se houver
 * 
 * @example
 * ```typescript
 * function QuotationDetail({ quotationId }) {
 *   const { data: quotation, isLoading } = useQuotation(quotationId);
 *   
 *   if (isLoading) return <LoadingSkeleton />;
 *   if (!quotation) return <NotFound />;
 *   
 *   return (
 *     <div>
 *       <h1>Cotação {quotation.quotation_number}</h1>
 *       <QuotationSummary quotation={quotation} />
 *       <OptionsList options={quotation.quotation_options} />
 *       <CustomizationsList items={quotation.quotation_customizations} />
 *     </div>
 *   );
 * }
 * ```
 * 
 * @see {@link useQuotations} - Para listar todas as cotações
 * @see {@link useUpdateQuotationStatus} - Para atualizar status
 */
export function useQuotation(id: string) {
  return useQuery({
    queryKey: ["quotations", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotations")
        .select(`
          *,
          yacht_models (
            name,
            code,
            description,
            technical_specifications,
            image_url
          ),
          clients (
            name,
            email,
            phone,
            company
          ),
          users!quotations_sales_representative_id_fkey (
            full_name,
            email
          ),
        quotation_options (
          id,
          option_id,
          quantity,
          unit_price,
          total_price,
          delivery_days_impact,
          options (
            name,
            code,
            description
          )
        ),
          quotation_customizations (
            id,
            item_name,
            notes,
            quantity,
            status,
            workflow_status,
            additional_cost,
            delivery_impact_days,
            engineering_notes,
            file_paths,
            customization_code,
            memorial_item_id,
            option_id,
            pm_final_price,
            pm_final_delivery_impact_days
          ),
          quotation_upgrades (
            id,
            upgrade_id,
            memorial_item_id,
            price,
            delivery_days_impact,
            customization_notes,
            memorial_upgrades:upgrade_id (
              name,
              code,
              description
            ),
            memorial_items:memorial_item_id (
              item_name
            )
          ),
          hull_number:hull_numbers (
            id,
            hull_number,
            brand,
            estimated_delivery_date
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

/**
 * Hook para atualizar o status de uma cotação
 * 
 * @description
 * Mutation para alterar status de cotações (draft → sent → accepted, etc).
 * Invalida cache de cotações após sucesso e exibe toast de feedback.
 * 
 * **Queries invalidadas:**
 * - `quotations` - Lista de cotações recarregada
 * 
 * @returns {UseMutationResult} Mutation do React Query
 * @returns {function} return.mutate - Executa atualização
 * @returns {boolean} return.isPending - true durante execução
 * 
 * @example
 * ```typescript
 * function SendQuotationButton({ quotationId }) {
 *   const { mutate: updateStatus, isPending } = useUpdateQuotationStatus();
 *   
 *   const handleSend = () => {
 *     updateStatus({ 
 *       id: quotationId, 
 *       status: 'sent' 
 *     });
 *   };
 *   
 *   return (
 *     <Button onClick={handleSend} disabled={isPending}>
 *       {isPending ? 'Enviando...' : 'Enviar ao Cliente'}
 *     </Button>
 *   );
 * }
 * ```
 * 
 * @see {@link useQuotation} - Para buscar cotação específica
 */
export function useUpdateQuotationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from("quotations")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast({
        title: "Status atualizado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook para deletar uma cotação
 * 
 * @description
 * Remove permanentemente uma cotação do sistema. **Validação importante:**
 * cotações que já foram convertidas em contrato não podem ser deletadas.
 * 
 * **Queries invalidadas após sucesso:**
 * - `quotations` - Lista de cotações é recarregada
 * 
 * @returns {UseMutationResult} Mutation do React Query
 * @returns {function} return.mutate - Executa deleção (fire-and-forget)
 * @returns {function} return.mutateAsync - Executa deleção com Promise
 * @returns {boolean} return.isPending - true durante execução
 * 
 * @throws {Error} Se cotação já foi convertida em contrato
 * @throws {Error} Se erro do Supabase durante deleção
 * 
 * @example
 * ```typescript
 * function DeleteQuotationButton({ quotationId }) {
 *   const { mutate: deleteQuotation, isPending } = useDeleteQuotation();
 *   
 *   const handleDelete = () => {
 *     deleteQuotation(quotationId, {
 *       onSuccess: () => navigate('/cotacoes'),
 *       onError: (err) => toast.error(err.message)
 *     });
 *   };
 *   
 *   return (
 *     <AlertDialog>
 *       <AlertDialogTrigger asChild>
 *         <Button variant="destructive" disabled={isPending}>
 *           {isPending ? 'Deletando...' : 'Deletar'}
 *         </Button>
 *       </AlertDialogTrigger>
 *       <AlertDialogContent>
 *         <AlertDialogHeader>
 *           <AlertDialogTitle>Confirmar exclusão?</AlertDialogTitle>
 *         </AlertDialogHeader>
 *         <AlertDialogFooter>
 *           <AlertDialogCancel>Cancelar</AlertDialogCancel>
 *           <AlertDialogAction onClick={handleDelete}>
 *             Confirmar
 *           </AlertDialogAction>
 *         </AlertDialogFooter>
 *       </AlertDialogContent>
 *     </AlertDialog>
 *   );
 * }
 * ```
 * 
 * @see {@link useQuotations} - Lista de cotações
 */
export function useDeleteQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quotationId: string) => {
      // Verificar se existe contrato associado
      const { data: contract, error: contractError } = await supabase
        .from("contracts")
        .select("id, contract_number")
        .eq("quotation_id", quotationId)
        .maybeSingle();

      if (contractError) throw contractError;

      if (contract) {
        throw new Error(
          `Esta cotação já foi convertida em contrato (${contract.contract_number}) e não pode ser deletada.`
        );
      }

      const { error } = await supabase
        .from("quotations")
        .delete()
        .eq("id", quotationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast({
        title: "Cotação deletada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao deletar cotação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook para duplicar uma cotação existente
 * 
 * @description
 * Cria uma nova cotação baseada em uma existente, copiando:
 * - Dados do cliente e modelo
 * - Opcionais selecionados (com quantidades e preços)
 * 
 * **Não copia:**
 * - Customizações (precisam ser reavaliadas)
 * - Descontos (zerados por segurança)
 * - Status (sempre "draft")
 * 
 * **Gera novo quotation_number automaticamente.**
 * 
 * @param {string} quotationId - UUID da cotação a duplicar
 * @returns {UseMutationResult} Mutation do React Query
 * @returns {Quotation} return.data - Nova cotação criada (no onSuccess)
 * 
 * @example
 * ```typescript
 * function DuplicateQuotationAction({ quotationId }) {
 *   const { mutate: duplicate, isPending } = useDuplicateQuotation();
 *   const navigate = useNavigate();
 *   
 *   const handleDuplicate = () => {
 *     duplicate(quotationId, {
 *       onSuccess: (newQuotation) => {
 *         toast.success(`Nova cotação: ${newQuotation.quotation_number}`);
 *         navigate(`/cotacoes/${newQuotation.id}`);
 *       }
 *     });
 *   };
 *   
 *   return (
 *     <Button 
 *       variant="outline" 
 *       onClick={handleDuplicate}
 *       disabled={isPending}
 *     >
 *       <Copy className="mr-2 h-4 w-4" />
 *       {isPending ? 'Duplicando...' : 'Duplicar Cotação'}
 *     </Button>
 *   );
 * }
 * ```
 * 
 * @see {@link useQuotations} - Lista de cotações
 */
export function useDuplicateQuotation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quotationId: string) => {
      // Fetch original quotation
      const { data: original, error: fetchError } = await supabase
        .from("quotations")
        .select(`
          *,
          quotation_options (
            option_id,
            quantity,
            unit_price,
            total_price,
            delivery_days_impact
          )
        `)
        .eq("id", quotationId)
        .single();

      if (fetchError) throw fetchError;

      // Generate new quotation number
      const year = new Date().getFullYear();
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      const newQuotationNumber = `QT-${year}-${random}`;

      // Create new quotation (TypeScript error will be fixed after types regenerate)
      const { data: newQuotation, error: createError } = await supabase
        .from("quotations")
        .insert({
          quotation_number: newQuotationNumber,
          yacht_model_id: original.yacht_model_id,
          client_id: original.client_id,
          client_name: original.client_name,
          client_email: original.client_email,
          client_phone: original.client_phone,
          sales_representative_id: original.sales_representative_id,
          status: "draft",
          base_price: original.base_price,
          base_discount_percentage: 0,
          final_base_price: original.base_price,
          base_delivery_days: original.base_delivery_days,
          total_options_price: original.total_options_price,
          options_discount_percentage: 0,
          final_options_price: original.total_options_price,
          total_customizations_price: original.total_customizations_price,
          discount_amount: 0,
          discount_percentage: 0,
          final_price: original.base_price + original.total_options_price,
          total_delivery_days: original.total_delivery_days,
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        } as any) // Temporary as any until types regenerate
        .select()
        .single();

      if (createError) throw createError;

      // Copy options
      if (original.quotation_options && original.quotation_options.length > 0) {
        const newOptions = original.quotation_options.map((opt: any) => ({
          quotation_id: newQuotation.id,
          option_id: opt.option_id,
          quantity: opt.quantity,
          unit_price: opt.unit_price,
          total_price: opt.total_price,
          delivery_days_impact: opt.delivery_days_impact,
        }));

        const { error: optionsError } = await supabase
          .from("quotation_options")
          .insert(newOptions);

        if (optionsError) throw optionsError;
      }

      return newQuotation;
    },
    onSuccess: (newQuotation) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      toast({
        title: "Cotação duplicada com sucesso!",
        description: `Nova cotação: ${newQuotation.quotation_number}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao duplicar cotação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
