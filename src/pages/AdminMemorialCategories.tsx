import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { GripVertical, Info, Plus, Search } from "lucide-react";
import {
  useGlobalMemorialCategories,
} from "@/hooks/useMemorialCategoryManagement";
import { CategoryDetailDialog } from "@/components/admin/memorial/CategoryDetailDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminMemorialCategories() {
  const [searchTerm, setSearchTerm] = useState("");
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    categoria: string;
    totalItems: number;
    models: Array<{ modelo: string; itemCount: number }>;
  } | null>(null);

  const { data: categories, isLoading } = useGlobalMemorialCategories();

  const filteredCategories = categories?.filter((cat) =>
    cat.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Categorias Globais</h1>
          <p className="text-muted-foreground">
            Categorias compartilhadas por todos os modelos de iates
          </p>
        </div>

        {/* Informação Importante */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Categorias são globais:</strong> Uma categoria pode ser usada por múltiplos
            modelos. Clique em uma categoria para ver os detalhes por modelo.
          </AlertDescription>
        </Alert>

        {/* Filtro de Busca */}
        <div className="flex gap-4">

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

        {/* Lista de Categorias Globais */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando categorias...</div>
        ) : filteredCategories && filteredCategories.length > 0 ? (
          <div className="space-y-2">
            {filteredCategories.map((category) => (
              <Card
                key={category.categoria}
                className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() =>
                  setDetailDialog({
                    open: true,
                    categoria: category.categoria,
                    totalItems: category.totalItems,
                    models: category.models,
                  })
                }
              >
                <div className="flex items-center gap-4">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-semibold">
                        {category.categoria}
                      </Badge>
                      <Badge variant="secondary">
                        {category.modelCount} {category.modelCount === 1 ? 'modelo' : 'modelos'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {category.totalItems} {category.totalItems === 1 ? 'item' : 'itens'}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailDialog({
                        open: true,
                        categoria: category.categoria,
                        totalItems: category.totalItems,
                        models: category.models,
                      });
                    }}
                  >
                    <Info className="h-4 w-4" />
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
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Categorias</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredCategories.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Itens</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredCategories.reduce((sum, cat) => sum + cat.totalItems, 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Média itens/categoria</p>
                <p className="text-2xl font-bold text-foreground">
                  {Math.round(
                    filteredCategories.reduce((sum, cat) => sum + cat.totalItems, 0) /
                      filteredCategories.length
                  )}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Dialog de Detalhes */}
      {detailDialog && (
        <CategoryDetailDialog
          open={detailDialog.open}
          onOpenChange={(open) => {
            if (!open) setDetailDialog(null);
          }}
          categoria={detailDialog.categoria}
          totalItems={detailDialog.totalItems}
          models={detailDialog.models}
        />
      )}
    </AdminLayout>
  );
}
