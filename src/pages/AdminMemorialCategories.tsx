import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GripVertical, Settings, Plus, Search } from "lucide-react";
import {
  useMemorialCategoriesWithCount,
  useCreateCategory,
} from "@/hooks/useMemorialCategoryManagement";
import { useMemorialOkeanModelos } from "@/hooks/useMemorialOkean";
import { CategoryManagementDialog } from "@/components/admin/memorial/CategoryManagementDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AdminMemorialCategories() {
  const [selectedModelo, setSelectedModelo] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [managementDialog, setManagementDialog] = useState<{
    open: boolean;
    categoria: string;
    modelo: string;
    itemCount: number;
  } | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryModelo, setNewCategoryModelo] = useState("");

  const { data: modelos } = useMemorialOkeanModelos();
  const { data: categories, isLoading } = useMemorialCategoriesWithCount(
    selectedModelo || undefined
  );
  const createMutation = useCreateCategory();

  const filteredCategories = categories?.filter((cat) =>
    cat.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateCategory = () => {
    if (!newCategoryName.trim() || !newCategoryModelo) {
      toast.error("Preencha o nome e selecione o modelo");
      return;
    }

    createMutation.mutate(
      {
        modelo: newCategoryModelo,
        categoria: newCategoryName.trim(),
      },
      {
        onSuccess: () => {
          setCreateDialogOpen(false);
          setNewCategoryName("");
          setNewCategoryModelo("");
        },
      }
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestão de Categorias</h1>
            <p className="text-muted-foreground">
              Organize e gerencie categorias do memorial descritivo
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Categoria
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Select value={selectedModelo || undefined} onValueChange={(value) => setSelectedModelo(value || "")}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos os modelos" />
              </SelectTrigger>
              <SelectContent>
                {modelos?.map((modelo) => (
                  <SelectItem key={modelo} value={modelo}>
                    {modelo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedModelo && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedModelo("")}
              >
                Limpar
              </Button>
            )}
          </div>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Lista de Categorias */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando categorias...</div>
        ) : filteredCategories && filteredCategories.length > 0 ? (
          <div className="space-y-2">
            {filteredCategories.map((category) => (
              <Card
                key={`${category.modelo}-${category.categoria}`}
                className="p-4"
              >
                <div className="flex items-center gap-4">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-semibold">
                        {category.categoria}
                      </Badge>
                      <Badge variant="secondary">
                        {category.modelo}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {category.itemCount} {category.itemCount === 1 ? 'item' : 'itens'}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setManagementDialog({
                        open: true,
                        categoria: category.categoria,
                        modelo: category.modelo,
                        itemCount: category.itemCount,
                      })
                    }
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma categoria encontrada
          </div>
        )}

        {/* Estatísticas */}
        {filteredCategories && filteredCategories.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredCategories.length} categorias
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Itens</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredCategories.reduce((sum, cat) => sum + cat.itemCount, 0)}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Dialog de Gerenciamento */}
      {managementDialog && (
        <CategoryManagementDialog
          open={managementDialog.open}
          onOpenChange={(open) => {
            if (!open) setManagementDialog(null);
          }}
          categoria={managementDialog.categoria}
          modelo={managementDialog.modelo}
          itemCount={managementDialog.itemCount}
          allCategories={categories?.filter(c => c.modelo === managementDialog.modelo).map(c => c.categoria) || []}
        />
      )}

      {/* Dialog de Criar Categoria */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo</Label>
              <Select value={newCategoryModelo} onValueChange={setNewCategoryModelo}>
                <SelectTrigger id="modelo">
                  <SelectValue placeholder="Selecione o modelo" />
                </SelectTrigger>
                <SelectContent>
                  {modelos?.map((modelo) => (
                    <SelectItem key={modelo} value={modelo}>
                      {modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Nome da Categoria</Label>
              <Input
                id="categoria"
                placeholder="Ex: Cabine de Hóspedes"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCategory} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
