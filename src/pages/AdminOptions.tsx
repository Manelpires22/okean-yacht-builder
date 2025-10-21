import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit2, Tag } from "lucide-react";
import { OptionFormDialog } from "@/components/admin/options/OptionFormDialog";
import { useOptionYachtModels } from "@/hooks/useOptionYachtModels";

export default function AdminOptions() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<any>(null);
  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ["option-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("option_categories")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: options, isLoading: loadingOptions } = useQuery({
    queryKey: ["options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("options")
        .select(`
          *,
          category:option_categories(name),
          option_yacht_models(
            yacht_model_id,
            yacht_model:yacht_models(id, name, code)
          )
        `)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleCreateOption = () => {
    setEditingOption(null);
    setDialogOpen(true);
  };

  const handleEditOption = (option: any) => {
    setEditingOption(option);
    setDialogOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Opcionais</h1>
          <p className="text-muted-foreground">Gerencie categorias e opcionais disponíveis para os iates</p>
        </div>
        
      <Tabs defaultValue="options" className="w-full">
        <TabsList>
          <TabsTrigger value="options">Opcionais</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="options" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Opcionais Cadastrados</h2>
            <Button onClick={handleCreateOption}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Opcional
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Modelos Compatíveis</TableHead>
                  <TableHead>Preço Base</TableHead>
                  <TableHead>Impacto Prazo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingOptions ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : options && options.length > 0 ? (
                  options.map((option) => (
                    <TableRow key={option.id}>
                      <TableCell className="font-mono text-sm">{option.code}</TableCell>
                      <TableCell className="font-medium">{option.name}</TableCell>
                      <TableCell>
                        {option.category?.name || "Sem categoria"}
                      </TableCell>
                      <TableCell>
                        {option.option_yacht_models && option.option_yacht_models.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {option.option_yacht_models.map((rel: any) => (
                              <Badge key={rel.yacht_model_id} variant="outline" className="text-xs">
                                <Tag className="h-3 w-3 mr-1" />
                                {rel.yacht_model?.code}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Nenhum</span>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(Number(option.base_price))}</TableCell>
                      <TableCell>
                        {option.delivery_days_impact ? `+${option.delivery_days_impact} dias` : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={option.is_active ? "default" : "secondary"}>
                          {option.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditOption(option)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      Nenhum opcional cadastrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Categorias de Opcionais</h2>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Categoria
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingCategories ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : categories && categories.length > 0 ? (
                  categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-mono">{category.display_order}</TableCell>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {category.description || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={category.is_active ? "default" : "secondary"}>
                          {category.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nenhuma categoria cadastrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
      </div>

      <OptionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        optionId={editingOption?.id}
        initialData={editingOption}
      />
    </AdminLayout>
  );
}
