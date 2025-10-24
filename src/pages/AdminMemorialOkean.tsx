import { useState, useMemo } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Edit, Trash2, Database, AlertCircle, X, Check, XCircle } from "lucide-react";
import { MemorialOkeanDialog } from "@/components/admin/memorial/MemorialOkeanDialog";
import {
  useMemorialOkeanItems,
  useMemorialOkeanCategories,
  useMemorialOkeanModelos,
  useDeleteMemorialItem,
  type MemorialOkeanItem,
} from "@/hooks/useMemorialOkean";
import { cn } from "@/lib/utils";

const MODEL_BADGE_COLORS: Record<string, string> = {
  FY550: "bg-blue-100 text-blue-800 border-blue-300",
  FY670: "bg-green-100 text-green-800 border-green-300",
  FY720: "bg-yellow-100 text-yellow-800 border-yellow-300",
  FY850: "bg-purple-100 text-purple-800 border-purple-300",
};

export default function AdminMemorialOkean() {
  const [selectedModelo, setSelectedModelo] = useState<string>("Todos");
  const [selectedCategoria, setSelectedCategoria] = useState<string>("Todas");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MemorialOkeanItem | undefined>();
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const { data: items = [], isLoading, error, refetch } = useMemorialOkeanItems(
    selectedModelo,
    selectedCategoria
  );
  const { data: categories = [] } = useMemorialOkeanCategories();
  const { data: modelos = [] } = useMemorialOkeanModelos();
  const deleteMutation = useDeleteMemorialItem();

  const handleCreateClick = () => {
    setEditingItem(undefined);
    setDialogOpen(true);
  };

  const handleEditClick = (item: MemorialOkeanItem) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeletingItemId(id);
  };

  const handleDeleteConfirm = async () => {
    if (deletingItemId) {
      await deleteMutation.mutateAsync(deletingItemId);
      setDeletingItemId(null);
    }
  };

  const handleClearFilters = () => {
    setSelectedModelo("Todos");
    setSelectedCategoria("Todas");
  };

  const hasActiveFilters = selectedModelo !== "Todos" || selectedCategoria !== "Todas";

  // Agrupar itens por categoria
  const itemsByCategory = useMemo(() => {
    const grouped = items.reduce((acc, item) => {
      if (!acc[item.categoria]) {
        acc[item.categoria] = [];
      }
      acc[item.categoria].push(item);
      return acc;
    }, {} as Record<string, MemorialOkeanItem[]>);

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  // Paginação
  const totalPages = Math.ceil(itemsByCategory.length / itemsPerPage);
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return itemsByCategory.slice(start, end);
  }, [itemsByCategory, currentPage, itemsPerPage]);

  // Reset página ao mudar filtros ou items per page
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Memorial OKEAN</h1>
            <p className="text-muted-foreground">
              Gerencie os itens do memorial descritivo
            </p>
          </div>
          <Button onClick={handleCreateClick}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Item
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Modelo:</label>
            <Select value={selectedModelo} onValueChange={setSelectedModelo}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                {modelos.map((modelo) => (
                  <SelectItem key={modelo} value={modelo}>
                    {modelo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Categoria:</label>
            <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
              <SelectTrigger className="w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Limpar Filtros
            </Button>
          )}

          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-auto">
              {items.length} {items.length === 1 ? 'item' : 'itens'}
            </Badge>
          )}
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar itens</AlertTitle>
            <AlertDescription>
              {error.message}
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="ml-4"
              >
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhum item encontrado
            </h3>
            <p className="text-muted-foreground mb-4">
              Ajuste os filtros ou adicione um novo item
            </p>
            <Button onClick={handleCreateClick}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Item
            </Button>
          </div>
        )}

        {/* Acordeon por Categoria + Paginação */}
        {!isLoading && !error && items.length > 0 && (
          <div className="space-y-4">
            {/* Controles de Paginação */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Itens por página:</label>
                  <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Badge variant="outline">
                  Mostrando {paginatedCategories.length} de {itemsByCategory.length} categorias
                </Badge>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </div>

            {/* Acordeon por Categoria */}
            <Accordion type="multiple" className="space-y-2">
              {paginatedCategories.map(([categoria, categoryItems]) => (
                <AccordionItem 
                  key={categoria} 
                  value={categoria}
                  className="border rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-semibold">
                        {categoria}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {categoryItems.length} {categoryItems.length === 1 ? 'item' : 'itens'}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">ID</TableHead>
                          <TableHead className="w-[120px]">Modelo</TableHead>
                          <TableHead>Descrição do Item</TableHead>
                          <TableHead className="w-[80px] text-center">Qtd</TableHead>
                          <TableHead className="w-[150px]">Marca</TableHead>
                          <TableHead className="w-[100px]">Tipo</TableHead>
                          <TableHead className="w-[80px] text-center">Custom</TableHead>
                          <TableHead className="w-[120px] text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categoryItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-muted-foreground text-sm">
                              {item.id}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "font-medium text-xs",
                                  MODEL_BADGE_COLORS[item.modelo]
                                )}
                              >
                                {item.modelo}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[400px]">
                              <div className="truncate text-sm" title={item.descricao_item}>
                                {item.descricao_item}
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {item.quantidade || 1}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {item.marca || '-'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">
                                {item.tipo_item}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {item.is_customizable !== false ? (
                                <Check className="h-4 w-4 text-success inline-block" />
                              ) : (
                                <XCircle className="h-4 w-4 text-muted-foreground inline-block" />
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditClick(item)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteClick(item.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}

        {/* Create/Edit Dialog */}
        <MemorialOkeanDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          item={editingItem}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={deletingItemId !== null}
          onOpenChange={(open) => !open && setDeletingItemId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O item será permanentemente
                removido do memorial.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm}>
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
