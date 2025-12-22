import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";
import { useMemorialCategories } from "@/hooks/useMemorialCategories";
import { useJobStops } from "@/hooks/useJobStops";
import { toast } from "sonner";

// Schema Zod
export const optionSchema = z.object({
  code: z.string().min(1, "Código é obrigatório"),
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  image_url: z.string().optional(),
  category_id: z.string().min(1, "Categoria é obrigatória"),
  base_price: z.number().min(0, "Preço deve ser positivo"),
  delivery_days_impact: z.number().int().min(0).default(0),
  is_customizable: z.boolean().default(true),
  is_configurable: z.boolean().default(false),
  is_active: z.boolean().default(true),
  allow_multiple: z.boolean().default(false),
  job_stop_id: z.string().uuid().nullable().optional(),
  configurable_sub_items: z.string().optional(),
});

export type OptionFormData = z.infer<typeof optionSchema>;

const DEFAULT_FORM_VALUES: OptionFormData = {
  code: "",
  name: "",
  description: "",
  brand: "",
  model: "",
  image_url: "",
  category_id: "",
  base_price: 0,
  delivery_days_impact: 0,
  is_customizable: true,
  is_configurable: false,
  is_active: true,
  allow_multiple: false,
  job_stop_id: null,
  configurable_sub_items: "",
};

export function useManageYachtOptions(yachtModelId: string) {
  const queryClient = useQueryClient();

  // ======== ESTADO DE UI ========
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<any | null>(null);
  const [deletingOptionId, setDeletingOptionId] = useState<string | null>(null);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);

  // ======== DADOS AUXILIARES ========
  const { data: categories } = useMemorialCategories();
  const { data: jobStops } = useJobStops();

  // ======== QUERIES ========
  const { data: options, isLoading } = useQuery({
    queryKey: ['yacht-model-options-v2', yachtModelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('options')
        .select(`
          *,
          category:memorial_categories!options_category_id_fkey(id, label, value),
          job_stop:job_stops!options_job_stop_id_fkey(id, stage, days_limit, item_name)
        `)
        .eq('yacht_model_id', yachtModelId)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: yachtModel } = useQuery({
    queryKey: ['yacht-model-code', yachtModelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('yacht_models')
        .select('code')
        .eq('id', yachtModelId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // ======== COMPUTED VALUES ========
  const filteredOptions = useMemo(() => {
    if (!options) return [];
    let filtered = showInactive ? options : options.filter(opt => opt.is_active);
    
    if (debouncedSearch.length >= 3) {
      const searchLower = debouncedSearch.toLowerCase();
      filtered = filtered.filter(opt =>
        opt.name?.toLowerCase().includes(searchLower) ||
        opt.code?.toLowerCase().includes(searchLower) ||
        opt.description?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [options, showInactive, debouncedSearch]);

  const optionsByCategory = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    
    categories?.forEach(cat => {
      grouped[cat.id] = [];
    });

    filteredOptions?.forEach(opt => {
      if (opt.category && grouped[opt.category.id]) {
        grouped[opt.category.id].push(opt);
      }
    });

    return grouped;
  }, [filteredOptions, categories]);

  const activeCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    categories?.forEach(cat => {
      counts[cat.id] = options?.filter(opt => opt.category_id === cat.id && opt.is_active).length || 0;
    });
    return counts;
  }, [options, categories]);

  const defaultOpenCategory = useMemo(() => {
    const catWithOptions = categories?.find(cat => 
      optionsByCategory[cat.id]?.length > 0
    );
    return catWithOptions?.id || categories?.[0]?.id;
  }, [optionsByCategory, categories]);

  // ======== FORM ========
  const form = useForm<OptionFormData>({
    resolver: zodResolver(optionSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  // ======== MUTATIONS ========
  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('options')
        .delete()
        .eq('yacht_model_id', yachtModelId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yacht-model-options-v2'] });
      queryClient.invalidateQueries({ queryKey: ['options'] });
      toast.success('Todos os opcionais foram apagados com sucesso!');
      setShowDeleteAllDialog(false);
    },
    onError: (error: Error) => {
      toast.error('Erro ao apagar opcionais: ' + error.message);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newOption: OptionFormData) => {
      const { configurable_sub_items, ...rest } = newOption;
      const { data, error } = await supabase
        .from('options')
        .insert({
          ...rest,
          yacht_model_id: yachtModelId,
          job_stop_id: newOption.job_stop_id || null,
          image_url: newOption.image_url || null,
          brand: newOption.brand || null,
          model: newOption.model || null,
          allow_multiple: newOption.allow_multiple || false,
          configurable_sub_items: configurable_sub_items 
            ? JSON.parse(configurable_sub_items) 
            : [],
        } as any)
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yacht-model-options-v2'] });
      queryClient.invalidateQueries({ queryKey: ['options'] });
      toast.success('Opcional criado com sucesso!');
      setCreateDialogOpen(false);
      form.reset(DEFAULT_FORM_VALUES);
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar opcional: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: OptionFormData }) => {
      const { configurable_sub_items, ...rest } = data;
      const { error } = await supabase
        .from('options')
        .update({
          ...rest,
          job_stop_id: data.job_stop_id || null,
          image_url: data.image_url || null,
          brand: data.brand || null,
          model: data.model || null,
          allow_multiple: data.allow_multiple || false,
          configurable_sub_items: configurable_sub_items 
            ? JSON.parse(configurable_sub_items) 
            : [],
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yacht-model-options-v2'] });
      queryClient.invalidateQueries({ queryKey: ['options'] });
      toast.success('Opcional atualizado com sucesso!');
      setEditingOption(null);
      form.reset(DEFAULT_FORM_VALUES);
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar opcional: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (optionId: string) => {
      const { error } = await supabase
        .from('options')
        .delete()
        .eq('id', optionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yacht-model-options-v2'] });
      queryClient.invalidateQueries({ queryKey: ['options'] });
      toast.success('Opcional deletado com sucesso!');
      setDeletingOptionId(null);
    },
    onError: (error: Error) => {
      toast.error('Erro ao deletar opcional: ' + error.message);
    },
  });

  // ======== HANDLERS ========
  const handleCreateClick = useCallback(() => {
    form.reset(DEFAULT_FORM_VALUES);
    setCreateDialogOpen(true);
  }, [form]);

  const handleEditClick = useCallback((option: any) => {
    form.reset({
      code: option.code,
      name: option.name,
      description: option.description || "",
      brand: option.brand || "",
      model: option.model || "",
      image_url: option.image_url || "",
      category_id: option.category_id,
      base_price: Number(option.base_price),
      delivery_days_impact: Number(option.delivery_days_impact),
      is_customizable: option.is_customizable ?? true,
      is_configurable: option.is_configurable ?? false,
      is_active: option.is_active,
      allow_multiple: option.allow_multiple ?? false,
      job_stop_id: option.job_stop_id || null,
      configurable_sub_items: Array.isArray(option.configurable_sub_items)
        ? JSON.stringify(option.configurable_sub_items)
        : (option.configurable_sub_items || ""),
    });
    setEditingOption(option);
  }, [form]);

  const closeDialog = useCallback(() => {
    setCreateDialogOpen(false);
    setEditingOption(null);
    form.reset(DEFAULT_FORM_VALUES);
  }, [form]);

  const onSubmit = useCallback((data: OptionFormData) => {
    if (editingOption) {
      updateMutation.mutate({ id: editingOption.id, data });
    } else {
      createMutation.mutate(data);
    }
  }, [editingOption, updateMutation, createMutation]);

  const handleDeleteConfirm = useCallback(() => {
    if (deletingOptionId) {
      deleteMutation.mutate(deletingOptionId);
    }
  }, [deletingOptionId, deleteMutation]);

  const handleDeleteAllConfirm = useCallback(() => {
    deleteAllMutation.mutate();
  }, [deleteAllMutation]);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }, []);

  // ======== RETURN ========
  return {
    // Data
    options,
    filteredOptions,
    optionsByCategory,
    activeCountByCategory,
    defaultOpenCategory,
    categories,
    jobStops,
    yachtModel,
    isLoading,
    
    // Dialog State
    dialogState: {
      createDialogOpen,
      editingOption,
      deletingOptionId,
      showDeleteAllDialog,
      isDialogOpen: createDialogOpen || !!editingOption,
    },
    
    // Dialog Actions
    openCreateDialog: handleCreateClick,
    openEditDialog: handleEditClick,
    closeDialog,
    setDeletingOptionId,
    setShowDeleteAllDialog,
    
    // Filters
    filters: {
      searchTerm,
      setSearchTerm,
      showInactive,
      setShowInactive,
      debouncedSearch,
    },
    
    // Form
    form,
    onSubmit: form.handleSubmit(onSubmit),
    
    // Mutation States
    mutations: {
      isCreating: createMutation.isPending,
      isUpdating: updateMutation.isPending,
      isDeleting: deleteMutation.isPending,
      isDeletingAll: deleteAllMutation.isPending,
      isSaving: createMutation.isPending || updateMutation.isPending,
    },
    
    // Actions
    handleDeleteConfirm,
    handleDeleteAllConfirm,
    
    // Utils
    formatCurrency,
  };
}
