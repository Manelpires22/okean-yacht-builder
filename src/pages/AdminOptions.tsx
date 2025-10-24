import { AdminLayout } from "@/components/AdminLayout";
import { useQuery } from "@tanstack/react-query";
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
import { Edit2, Trash2, Plus } from "lucide-react";
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
import { toast } from "sonner";

const AdminOptions = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedModel, setSelectedModel] = useState<string>("all");
  const [editingOption, setEditingOption] = useState<any>(null);
  const [deletingOptionId, setDeletingOptionId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: models } = useYachtModels();
  const { data: categories } = useOptionCategories();

  const { data: options, isLoading, refetch } = useQuery({
    queryKey: ['admin-options', selectedCategory, selectedModel],
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

        <div className="flex gap-4">
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
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Modelo</TableHead>
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
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhum opcional encontrado
                  </TableCell>
                </TableRow>
              ) : (
                options?.map((option) => (
                  <TableRow key={option.id}>
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
                        <Badge variant="default">Global</Badge>
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
    </AdminLayout>
  );
};

export default AdminOptions;
