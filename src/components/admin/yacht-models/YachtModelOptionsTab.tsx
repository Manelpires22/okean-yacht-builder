import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Pencil, Package } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useOptionCategories } from "@/hooks/useOptions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const optionSchema = z.object({
  code: z.string().min(1, "Código é obrigatório"),
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  category_id: z.string().min(1, "Categoria é obrigatória"),
  base_price: z.number().min(0, "Preço deve ser positivo"),
  delivery_days_impact: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

type OptionFormData = z.infer<typeof optionSchema>;

interface YachtModelOptionsTabProps {
  yachtModelId: string;
}

export function YachtModelOptionsTab({ yachtModelId }: YachtModelOptionsTabProps) {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<any | null>(null);
  const [deletingOptionId, setDeletingOptionId] = useState<string | null>(null);

  const { data: categories } = useOptionCategories();

  // Fetch options for this yacht model (direct relationship)
  const { data: options, isLoading } = useQuery({
    queryKey: ['yacht-model-options', yachtModelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('options')
        .select('*, category:option_categories(id, name)')
        .eq('yacht_model_id', yachtModelId)
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Group options by category
  const optionsByCategory = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    
    categories?.forEach(cat => {
      grouped[cat.id] = [];
    });

    options?.forEach(opt => {
      if (opt.category && grouped[opt.category.id]) {
        grouped[opt.category.id].push(opt);
      }
    });

    return grouped;
  }, [options, categories]);

  // Find first category with options for default open
  const defaultOpenCategory = useMemo(() => {
    const catWithOptions = categories?.find(cat => 
      optionsByCategory[cat.id]?.length > 0
    );
    return catWithOptions?.id || categories?.[0]?.id;
  }, [optionsByCategory, categories]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<OptionFormData>({
    resolver: zodResolver(optionSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      category_id: "",
      base_price: 0,
      delivery_days_impact: 0,
      is_active: true,
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (newOption: OptionFormData) => {
      const { data, error } = await supabase
        .from('options')
        .insert({
          ...newOption,
          yacht_model_id: yachtModelId, // Automatically link to current model
        } as any) // Cast needed until types are regenerated
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yacht-model-options'] });
      queryClient.invalidateQueries({ queryKey: ['options'] });
      toast.success('Opcional criado com sucesso!');
      setCreateDialogOpen(false);
      reset();
    },
    onError: (error: Error) => {
      toast.error('Erro ao criar opcional: ' + error.message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: OptionFormData }) => {
      const { error } = await supabase
        .from('options')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yacht-model-options'] });
      queryClient.invalidateQueries({ queryKey: ['options'] });
      toast.success('Opcional atualizado com sucesso!');
      setEditingOption(null);
      reset();
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar opcional: ' + error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (optionId: string) => {
      const { error } = await supabase
        .from('options')
        .delete()
        .eq('id', optionId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yacht-model-options'] });
      queryClient.invalidateQueries({ queryKey: ['options'] });
      toast.success('Opcional deletado com sucesso!');
      setDeletingOptionId(null);
    },
    onError: (error: Error) => {
      toast.error('Erro ao deletar opcional: ' + error.message);
    },
  });

  const handleCreateClick = () => {
    reset({
      code: "",
      name: "",
      description: "",
      category_id: "",
      base_price: 0,
      delivery_days_impact: 0,
      is_active: true,
    });
    setCreateDialogOpen(true);
  };

  const handleEditClick = (option: any) => {
    reset({
      code: option.code,
      name: option.name,
      description: option.description || "",
      category_id: option.category_id,
      base_price: Number(option.base_price),
      delivery_days_impact: Number(option.delivery_days_impact),
      is_active: option.is_active,
    });
    setEditingOption(option);
  };

  const onSubmit = (data: OptionFormData) => {
    if (editingOption) {
      updateMutation.mutate({ id: editingOption.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Opcionais do Modelo</h2>
            <p className="text-sm text-muted-foreground">
              Gerencie os opcionais exclusivos deste modelo de iate
            </p>
          </div>
          <Button onClick={handleCreateClick}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Novo Opcional
          </Button>
        </div>

        {!options || options.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum opcional cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Este modelo ainda não possui opcionais. Clique no botão acima para criar o primeiro opcional.
            </p>
          </div>
        ) : (
          <Accordion type="single" collapsible defaultValue={defaultOpenCategory} className="w-full">
            {categories?.map(cat => {
              const categoryOptions = optionsByCategory[cat.id] || [];
              const optionCount = categoryOptions.length;

              return (
                <AccordionItem key={cat.id} value={cat.id}>
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                    <div className="flex items-center gap-3 w-full">
                      <span>{cat.name}</span>
                      <Badge variant="outline" className="ml-auto mr-2">
                        {optionCount} {optionCount === 1 ? 'opcional' : 'opcionais'}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {categoryOptions.length > 0 ? (
                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Código</TableHead>
                              <TableHead>Nome</TableHead>
                              <TableHead className="text-right">Preço</TableHead>
                              <TableHead className="text-right">Prazo (dias)</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {categoryOptions.map((option) => (
                              <TableRow key={option.id}>
                                <TableCell className="font-mono text-sm">{option.code}</TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{option.name}</p>
                                    {option.description && (
                                      <p className="text-sm text-muted-foreground line-clamp-1">
                                        {option.description}
                                      </p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">{formatCurrency(option.base_price)}</TableCell>
                                <TableCell className="text-right">
                                  {option.delivery_days_impact > 0 ? `+${option.delivery_days_impact}` : '0'}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={option.is_active ? "default" : "secondary"}>
                                    {option.is_active ? "Ativo" : "Inativo"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEditClick(option)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setDeletingOptionId(option.id)}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-12 text-center">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                          Nenhum opcional nesta categoria
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          Adicione opcionais à categoria {cat.name}
                        </p>
                        <Button onClick={handleCreateClick}>
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar Primeiro Opcional
                        </Button>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={createDialogOpen || !!editingOption} onOpenChange={(open) => {
        if (!open) {
          setCreateDialogOpen(false);
          setEditingOption(null);
          reset();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingOption ? "Editar Opcional" : "Criar Novo Opcional"}
            </DialogTitle>
            <DialogDescription>
              Este opcional será exclusivo deste modelo de iate.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  {...register("code")}
                  placeholder="Ex: ELET-TV-43"
                />
                {errors.code && (
                  <p className="text-sm text-destructive">{errors.code.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category_id">Categoria *</Label>
                <Select
                  value={watch("category_id")}
                  onValueChange={(value) => setValue("category_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category_id && (
                  <p className="text-sm text-destructive">{errors.category_id.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder='Ex: TV 43" no salão com lift elétrico'
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Descrição detalhada do opcional"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base_price">Preço Base (R$) *</Label>
                <Input
                  id="base_price"
                  type="number"
                  step="0.01"
                  {...register("base_price", { valueAsNumber: true })}
                />
                {errors.base_price && (
                  <p className="text-sm text-destructive">{errors.base_price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_days_impact">Impacto no Prazo (dias)</Label>
                <Input
                  id="delivery_days_impact"
                  type="number"
                  {...register("delivery_days_impact", { valueAsNumber: true })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setEditingOption(null);
                  reset();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && (
                  <span className="mr-2">⏳</span>
                )}
                {editingOption ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingOptionId} onOpenChange={(open) => !open && setDeletingOptionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este opcional? Esta ação não pode ser desfeita.
              O opcional será removido permanentemente deste modelo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingOptionId && deleteMutation.mutate(deletingOptionId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
