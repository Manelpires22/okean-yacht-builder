import { AdminLayout } from "@/components/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
import { Edit2, Trash2, Plus, Check } from "lucide-react";
import { useState } from "react";
import { useYachtModels } from "@/hooks/useYachtModels";
import { useOptionCategories } from "@/hooks/useOptions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OptionDialog } from "@/components/admin/options/OptionDialog";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const AdminOptions = () => {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedModel, setSelectedModel] = useState<string>("all");
  const [editingOption, setEditingOption] = useState<any>(null);
  const [deletingOptionId, setDeletingOptionId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [showBulkAssignDialog, setShowBulkAssignDialog] = useState(false);
  const [bulkAssignModels, setBulkAssignModels] = useState<Set<string>>(new Set());
  const [showInactive, setShowInactive] = useState(false);

  const { data: models } = useYachtModels();
  const { data: categories } = useOptionCategories();

  const { data: options, isLoading, refetch } = useQuery({
    queryKey: ['admin-options', selectedCategory, selectedModel, showInactive],
    queryFn: async () => {
      let query = supabase
        .from('options')
        .select('*, category:option_categories(id, name), yacht_model:yacht_models(id, name)')
        .order('name');
      
      if (selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }

      if (selectedModel === 'generic') {
        query = query.is('yacht_model_id', null);
      } else if (selectedModel !== 'all') {
        query = query.eq('yacht_model_id', selectedModel);
      }

      // Filtrar por status ativo/inativo
      if (!showInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async () => {
    if (!deletingOptionId) return;

    try {
      const { error } = await supabase
        .from('options')
        .delete()
        .eq('id', deletingOptionId);

      if (error) throw error;

      toast.success("Opcional deletado com sucesso");
      refetch();
    } catch (error: any) {
      toast.error("Erro ao deletar opcional: " + error.message);
    } finally {
      setDeletingOptionId(null);
    }
  };

  const handleCreateClick = () => {
    setEditingOption(null);
    setIsCreating(true);
  };

  const handleEditClick = (option: any) => {
    setEditingOption(option);
    setIsCreating(true);
  };

  const toggleSelectOption = (optionId: string) => {
    const newSelected = new Set(selectedOptions);
    if (newSelected.has(optionId)) {
      newSelected.delete(optionId);
    } else {
      newSelected.add(optionId);
    }
    setSelectedOptions(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedOptions.size === options?.length) {
      setSelectedOptions(new Set());
    } else {
      setSelectedOptions(new Set(options?.map(o => o.id) || []));
    }
  };

  const handleBulkAssignClick = () => {
    if (selectedOptions.size === 0) {
      toast.error("Selecione pelo menos um opcional");
      return;
    }
    setShowBulkAssignDialog(true);
  };

  const toggleBulkAssignModel = (modelId: string) => {
    const newModels = new Set(bulkAssignModels);
    if (newModels.has(modelId)) {
      newModels.delete(modelId);
    } else {
      newModels.add(modelId);
    }
    setBulkAssignModels(newModels);
  };

  const bulkAssignMutation = useMutation({
    mutationFn: async () => {
      const updates = Array.from(selectedOptions).map(async (optionId) => {
        // Se nenhum modelo foi selecionado, tornar o opcional global (yacht_model_id = null)
        const yacht_model_id = bulkAssignModels.size === 0 ? null : 
          bulkAssignModels.size === 1 ? Array.from(bulkAssignModels)[0] : null;

        // Se múltiplos modelos foram selecionados, precisamos criar cópias do opcional
        if (bulkAssignModels.size > 1) {
          // Buscar opcional original
          const { data: originalOption } = await supabase
            .from('options')
            .select('*')
            .eq('id', optionId)
            .single();

          if (!originalOption) return;

          // Criar uma cópia para cada modelo selecionado
          const copies = Array.from(bulkAssignModels).map(modelId => ({
            code: originalOption.code,
            name: originalOption.name,
            description: originalOption.description,
            category_id: originalOption.category_id,
            yacht_model_id: modelId,
            base_price: originalOption.base_price,
            delivery_days_impact: originalOption.delivery_days_impact,
            is_active: originalOption.is_active,
            technical_specifications: originalOption.technical_specifications,
          }));

          await supabase.from('options').insert(copies);
        } else {
          // Atualizar o opcional existente
          await supabase
            .from('options')
            .update({ yacht_model_id })
            .eq('id', optionId);
        }
      });

      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-options'] });
      queryClient.invalidateQueries({ queryKey: ['options'] });
      toast.success(`${selectedOptions.size} opcionais atualizados com sucesso`);
      setShowBulkAssignDialog(false);
      setSelectedOptions(new Set());
      setBulkAssignModels(new Set());
      refetch();
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar opcionais: " + error.message);
    },
  });

  const handleBulkAssignSubmit = () => {
    bulkAssignMutation.mutate();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Opcionais</h1>
            <p className="text-muted-foreground">Gerir opcionais genéricos e específicos de modelos</p>
          </div>
          <Button onClick={handleCreateClick}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Opcional
          </Button>
        </div>

        <div className="flex gap-4 items-center">
          <div className="w-64">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-64">
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os modelos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os modelos</SelectItem>
                <SelectItem value="generic">Opcionais Genéricos</SelectItem>
                {models?.filter(m => m.is_active).map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <Switch
              id="show-inactive"
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label 
              htmlFor="show-inactive" 
              className="text-sm cursor-pointer"
            >
              Mostrar opcionais inativos
            </Label>
          </div>
        </div>

        {selectedOptions.size > 0 && (
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-base">
                {selectedOptions.size} opcionais selecionados
              </Badge>
              <Button
                variant="outline"
                onClick={() => setSelectedOptions(new Set())}
              >
                Limpar seleção
              </Button>
            </div>
            <Button onClick={handleBulkAssignClick}>
              <Check className="h-4 w-4 mr-2" />
              Atribuir a Modelos
            </Button>
          </div>
        )}

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={options?.length > 0 && selectedOptions.size === options?.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Disponível em</TableHead>
                <TableHead>Preço Base</TableHead>
                <TableHead>Prazo (dias)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : options?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Nenhum opcional encontrado
                  </TableCell>
                </TableRow>
              ) : (
                options?.map((option) => (
                  <TableRow 
                    key={option.id}
                    className={selectedOptions.has(option.id) ? "bg-muted/50" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedOptions.has(option.id)}
                        onCheckedChange={() => toggleSelectOption(option.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{option.code}</TableCell>
                    <TableCell className="font-medium">{option.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {option.category?.name || "Sem categoria"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {option.yacht_model_id ? (
                        <Badge variant="secondary">
                          {option.yacht_model?.name}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Todos os Modelos</Badge>
                      )}
                      {!option.is_active && (
                        <Badge variant="destructive" className="ml-2">
                          Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      €{option.base_price?.toLocaleString() || "0"}
                    </TableCell>
                    <TableCell>
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
                          <Edit2 className="h-4 w-4" />
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {isCreating && (
        <OptionDialog
          open={isCreating}
          onOpenChange={setIsCreating}
          option={editingOption}
          onSuccess={refetch}
        />
      )}

      <AlertDialog open={!!deletingOptionId} onOpenChange={() => setDeletingOptionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este opcional? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showBulkAssignDialog} onOpenChange={setShowBulkAssignDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Atribuir Opcionais a Modelos</DialogTitle>
            <DialogDescription>
              Selecione os modelos de iate para os {selectedOptions.size} opcionais selecionados.
              {bulkAssignModels.size > 1 && (
                <span className="block mt-2 text-warning">
                  ⚠️ Múltiplos modelos: será criada uma cópia do opcional para cada modelo selecionado.
                </span>
              )}
              {bulkAssignModels.size === 0 && (
                <span className="block mt-2 text-info">
                  💡 Nenhum modelo selecionado = Opcionais serão globais (disponíveis para todos os modelos)
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Modelos de Iate</Label>
              <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-2">
                {models?.filter(m => m.is_active).map((model) => (
                  <div key={model.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`model-${model.id}`}
                      checked={bulkAssignModels.has(model.id)}
                      onCheckedChange={() => toggleBulkAssignModel(model.id)}
                    />
                    <Label
                      htmlFor={`model-${model.id}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {model.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkAssignDialog(false);
                setBulkAssignModels(new Set());
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleBulkAssignSubmit}
              disabled={bulkAssignMutation.isPending}
            >
              {bulkAssignMutation.isPending ? "Atualizando..." : "Atribuir Opcionais"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminOptions;
